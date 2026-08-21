import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb, posts } from "@/db";

/**
 * Görüntülenme sayacını artırır. Kasıtlı olarak giriş gerektirmez —
 * içerikler üye olmadan da izlenebilir ve izlenme kazanca yansır.
 *
 * ÜRETİM NOTU: Bu basit sayaç aynı kullanıcının sayfayı yenileyip izlenmeyi
 * suistimal etmesine açıktır. Gerçek üretimde IP/oturum bazlı hız sınırlama
 * veya "son X saniyede bu içerik zaten sayıldı" kontrolü eklenmelidir.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const db = getDb();
  await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, postId));
  return NextResponse.json({ ok: true });
}
