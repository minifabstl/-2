import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { desc, eq } from "drizzle-orm";
import { getDb, posts, users } from "@/db";
import { getCurrentUser, AuthError, requireUser } from "@/lib/auth";
import { uploadMedia, mediaUrl } from "@/lib/storage";
import { cleanTags, parseTags } from "@/lib/posts";

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

  const mediaKey = await uploadMedia(file);
  // The thumbnail (a still frame captured client-side, see app/upload/page.tsx) is what
  // powers the <video poster> on post cards — without it, mobile browsers often show a
  // blank/black tile since they won't reliably decode a frame from the video file itself.
  const thumbnailKey = thumbnail instanceof File ? await uploadMedia(thumbnail) : null;
  const db = getDb();
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
