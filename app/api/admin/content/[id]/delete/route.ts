import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, posts, likes, comments } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";

/** Permanent delete — for old content already in "Removed" status. Fully deletes the file in R2 and the database record; cannot be undone. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const { id } = await params;
  const db = getDb();
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  const target = rows[0];
  if (!target) return NextResponse.json({ error: "Content not found." }, { status: 404 });

  const { env } = getCloudflareContext();
  await env.BUCKET.delete(target.mediaKey);
  if (target.thumbnailKey) await env.BUCKET.delete(target.thumbnailKey);

  await db.delete(likes).where(eq(likes.postId, id));
  await db.delete(comments).where(eq(comments.postId, id));
  await db.delete(posts).where(eq(posts.id, id));

  return NextResponse.json({ ok: true, status: "deleted" });
}
