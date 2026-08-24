import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { and, desc, eq, gt } from "drizzle-orm";
import { getDb, posts, users } from "@/db";
import { getCurrentUser, AuthError, requireUser } from "@/lib/auth";
import { uploadMedia, mediaUrl } from "@/lib/storage";
import { cleanTags, parseTags } from "@/lib/posts";

const MAX_TITLE_LENGTH = 200;

// Mirrors the limits shown in app/upload/page.tsx — but the client-side check there is only a
// UX convenience. It's trivial to bypass by calling this endpoint directly (e.g. with curl), so
// the real enforcement has to happen here, server-side, on the file the server actually receives.
//
// video maxBytes must stay well under Cloudflare Workers' fixed 128MB per-request memory
// ceiling — this route buffers the incoming file in memory (formData() + arrayBuffer()), so a
// limit close to 128MB crashes the Worker with "Error 1102: exceeded resource limits" instead
// of returning this clean 400 response. Keep this in sync with MAX_MB in app/upload/page.tsx.
const MEDIA_LIMITS: Record<"photo" | "video", { maxBytes: number; types: string[] }> = {
  photo: { maxBytes: 5 * 1024 * 1024, types: ["image/png", "image/jpeg", "image/webp"] },
  video: { maxBytes: 20 * 1024 * 1024, types: ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"] },
};
const MAX_THUMBNAIL_BYTES = 3 * 1024 * 1024;

// Very small, self-contained upload throttle: a member can't post more than this many times
// in the window below. This isn't a substitute for edge-level rate limiting (a Cloudflare Rate
// Limiting rule in front of this route is the right place to stop distributed/scripted abuse) —
// it just stops a single logged-in account from hammering storage with scripted uploads.
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 8;

/** Public feed — viewable without logging in. */
export async function GET() {
  const db = getDb();
  const currentUser = await getCurrentUser();

  const rows = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      tags: posts.tags,
      mediaKey: posts.mediaKey,
      thumbnailKey: posts.thumbnailKey,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      username: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.status, "live"))
    .orderBy(desc(posts.createdAt))
    .limit(60);

  return NextResponse.json({
    isLoggedIn: !!currentUser,
    posts: rows.map((p) => ({
      ...p,
      tags: parseTags(p.tags),
      mediaUrl: mediaUrl(p.mediaKey),
      thumbnailUrl: p.thumbnailKey ? mediaUrl(p.thumbnailKey) : null,
    })),
  });
}

/** Create a new post — logged-in users only. Expects multipart/form-data. */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const form = await req.formData();
  const file = form.get("file");
  const thumbnail = form.get("thumbnail");
  const title = String(form.get("title") ?? "").trim();
  const type = form.get("type") === "photo" ? "photo" : "video";

  // Tags arrive as a JSON-stringified array of strings from the upload form (up to 5 SEO keyword tags).
  let rawTags: unknown[] = [];
  const tagsField = form.get("tags");
  if (typeof tagsField === "string" && tagsField) {
    try {
      const parsed = JSON.parse(tagsField);
      if (Array.isArray(parsed)) rawTags = parsed;
    } catch {
      // ignore malformed input — falls through to an empty tag list
    }
  }
  const tags = cleanTags(rawTags);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A media file is required." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` }, { status: 400 });
  }

  const limits = MEDIA_LIMITS[type];
  if (!limits.types.includes(file.type)) {
    return NextResponse.json(
      { error: `That file type isn't supported for a ${type}. Allowed: ${limits.types.join(", ")}.` },
      { status: 400 }
    );
  }
  if (file.size > limits.maxBytes) {
    return NextResponse.json({ error: `File is too large — the maximum is ${Math.round(limits.maxBytes / (1024 * 1024))}MB.` }, { status: 400 });
  }
  if (thumbnail instanceof File) {
    if (!thumbnail.type.startsWith("image/")) {
      return NextResponse.json({ error: "Thumbnail must be an image." }, { status: 400 });
    }
    if (thumbnail.size > MAX_THUMBNAIL_BYTES) {
      return NextResponse.json({ error: "Thumbnail is too large." }, { status: 400 });
    }
  }

  const db = getDb();

  // Upload throttle — see the constant comment above.
  const windowStart = new Date(Date.now() - UPLOAD_WINDOW_MS);
  const recentUploads = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.userId, user.id), gt(posts.createdAt, windowStart)))
    .limit(MAX_UPLOADS_PER_WINDOW);
  if (recentUploads.length >= MAX_UPLOADS_PER_WINDOW) {
    return NextResponse.json({ error: "You're uploading too quickly — please wait a few minutes and try again." }, { status: 429 });
  }

  const mediaKey = await uploadMedia(file);
  // The thumbnail (a still frame captured client-side, see app/upload/page.tsx) is what
  // powers the <video poster> on post cards — without it, mobile browsers often show a
  // blank/black tile since they won't reliably decode a frame from the video file itself.
  const thumbnailKey = thumbnail instanceof File ? await uploadMedia(thumbnail) : null;
  const id = nanoid();
  await db.insert(posts).values({
    id,
    userId: user.id,
    type,
    title,
    tags: tags.length > 0 ? JSON.stringify(tags) : null,
    mediaKey,
    thumbnailKey,
    // Newly uploaded content does not go live directly — it must pass admin approval.
    status: "pending",
    viewCount: 0,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true, id, status: "pending" });
}
