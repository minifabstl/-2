import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, posts, likes, comments } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";

/** Kalıcı silme — "Kaldırıldı" durumundaki eski içerikler için. R2'deki dosyayı ve veritabanı kaydını tamamen siler, geri alınamaz. */
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
  if (!target) return NextResponse.json({ error: "İçerik bulunamadı." }, { status: 404 });

  const { env } = getCloudflareContext();
  await env.BUCKET.delete(target.mediaKey);
  if (target.thumbnailKey) await env.BUCKET.delete(target.thumbnailKey);

  await db.delete(likes).where(eq(likes.postId, id));
  await db.delete(comments).where(eq(comments.postId, id));
  await db.delete(posts).where(eq(posts.id, id));

  return NextResponse.json({ ok: true, status: "deleted" });
}
