import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, posts, likes, comments, users } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";
import { sendContentRejectedEmail } from "@/lib/email";

/**
 * "Remove" / "Reject" action.
 *
 * - If the content is still live/pending (live, flagged, pending): it is PERMANENTLY
 *   DELETED — both the database record and the file in Cloudflare R2. There is no
 *   intermediate "removed" state here so we don't waste storage in the cloud; it's
 *   deleted directly.
 * - If the content is already in "removed" status (content that was previously
 *   soft-removed via this endpoint): this request RESTORES it back to live.
 *   Use `/api/admin/content/[id]/delete` for a permanent delete.
 */
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

  if (target.status === "removed") {
    await db.update(posts).set({ status: "live" }).where(eq(posts.id, id));
    return NextResponse.json({ ok: true, status: "live" });
  }

  const ownerRows = await db
    .select({ email: users.email, notifyOnRejection: users.notifyOnRejection })
    .from(users)
    .where(eq(users.id, target.userId))
    .limit(1);
  const owner = ownerRows[0];

  // Permanent delete: remove the file in R2 and the database record (along with its likes/comments).
  const { env } = getCloudflareContext();
  await env.BUCKET.delete(target.mediaKey);
  if (target.thumbnailKey) await env.BUCKET.delete(target.thumbnailKey);

  await db.delete(likes).where(eq(likes.postId, id));
  await db.delete(comments).where(eq(comments.postId, id));
  await db.delete(posts).where(eq(posts.id, id));

  if (owner?.notifyOnRejection) {
    await sendContentRejectedEmail(owner.email, target.title).catch(() => {});
  }

  return NextResponse.json({ ok: true, status: "deleted" });
}
