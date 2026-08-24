import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { and, desc, eq, gt } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, posts, users } from "@/db";
import { getCurrentUser, AuthError, requireUser } from "@/lib/auth";
import { uploadMedia, mediaUrl } from "@/lib/storage";
import { cleanTags, parseTags } from "@/lib/posts";

const MAX_TITLE_LENGTH = 200;

// Photo limit only — video's server-side size/type limit lives in app/api/posts/presign/route.ts
// (MAX_VIDEO_BYTES) since that's where video enforcement actually happens now: videos are
// PUT directly to R2 via a presigned URL and never pass through this route as raw bytes (see
// the mediaKey handling below). Photos are small enough to still be buffered through the
// Worker safely, well under its fixed 128MB per-request memory ceiling.
const MEDIA_LIMITS: Record<"photo", { maxBytes: number; types: string[] }> = {
  photo: { maxBytes: 5 * 1024 * 1024, types: ["image/png", "image/jpeg", "image/webp"] },
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
  // For videos, the file itself was already PUT directly to R2 via a presigned URL (see
  // POST /api/posts/presign and app/upload/page.tsx) — the Worker never buffers it, which is
  // what lets videos be far bigger than the old 20MB Worker-memory-safe cap. This request only
  // carries the resulting object key, plus the small thumbnail image, as normal form fields.
  const preUploadedMediaKey = form.get("mediaKey");
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

  if (!title) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` }, { status: 400 });
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

  let mediaKey: string;
  if (type === "video") {
    // Videos must have been uploaded straight to R2 already via POST /api/posts/presign.
    // Verify the object actually exists (and grab its real size for the log) rather than
    // trusting the client's word for it — the key alone doesn't prove anything was uploaded.
    if (typeof preUploadedMediaKey !== "string" || !preUploadedMediaKey) {
      return NextResponse.json({ error: "A media file is required." }, { status: 400 });
    }
    const { env } = getCloudflareContext();
    const head = await env.BUCKET.head(preUploadedMediaKey);
    if (!head) {
      return NextResponse.json({ error: "Upload didn't complete — please try again." }, { status: 400 });
    }
    mediaKey = preUploadedMediaKey;
  } else {
    // Photos are small (5MB cap) — buffering them through the Worker is fine, so this keeps
    // the simpler classic path instead of needing a presign round-trip for every image too.
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A media file is required." }, { status: 400 });
    }
    const limits = MEDIA_LIMITS.photo;
    if (!limits.types.includes(file.type)) {
      return NextResponse.json(
        { error: `That file type isn't supported for a photo. Allowed: ${limits.types.join(", ")}.` },
        { status: 400 }
      );
    }
    if (file.size > limits.maxBytes) {
      return NextResponse.json({ error: `File is too large — the maximum is ${Math.round(limits.maxBytes / (1024 * 1024))}MB.` }, { status: 400 });
    }
    mediaKey = await uploadMedia(file);
  }

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
