import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, posts } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";
import { uploadMedia } from "@/lib/storage";
import { cleanTags } from "@/lib/posts";

const MAX_TITLE_LENGTH = 200;
const MAX_THUMBNAIL_BYTES = 3 * 1024 * 1024;

/**
 * Admin-only bulk upload: creates ONE post per request (the client calls this once per file
 * in the batch, see app/admin/bulk-upload/page.tsx), but unlike the regular POST /api/posts:
 *  - no per-account upload rate limit (this IS the admin doing a large batch on purpose)
 *  - no meaningful size ceiling — admins get the effectively-unlimited cap enforced in
 *    POST /api/posts/presign (ADMIN_MAX_BYTES), instead of the per-type caps regular members get
 *  - the post goes straight to status "live" — admin uploads don't need admin approval of
 *    themselves, so this skips the pending-review queue entirely
 * Both photo and video bytes must already be PUT directly to R2 via POST /api/posts/presign
 * (same flow the regular upload page uses) — this route only ever receives the resulting key.
 */
export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const form = await req.formData();
  const preUploadedMediaKey = form.get("mediaKey");
  const thumbnail = form.get("thumbnail");
  const title = String(form.get("title") ?? "").trim();
  const type = form.get("type") === "photo" ? "photo" : "video";

  let rawTags: unknown[] = [];
  const tagsField = form.get("tags");
  if (typeof tagsField === "string" && tagsField) {
    try {
      const parsed = JSON.parse(tagsField);
      if (Array.isArray(parsed)) rawTags = parsed;
    } catch {
      // ignore malformed input
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

  if (typeof preUploadedMediaKey !== "string" || !preUploadedMediaKey) {
    return NextResponse.json({ error: "A media file is required." }, { status: 400 });
  }
  const { env } = getCloudflareContext();
  const head = await env.BUCKET.head(preUploadedMediaKey);
  if (!head) {
    return NextResponse.json({ error: "Upload didn't complete — please try again." }, { status: 400 });
  }
  const mediaKey = preUploadedMediaKey;

  const thumbnailKey = thumbnail instanceof File ? await uploadMedia(thumbnail) : null;
  const id = nanoid();
  const db = getDb();
  await db.insert(posts).values({
    id,
    userId: admin.id,
    type,
    title,
    tags: tags.length > 0 ? JSON.stringify(tags) : null,
    mediaKey,
    thumbnailKey,
    status: "live",
    viewCount: 0,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true, id, status: "live" });
}
