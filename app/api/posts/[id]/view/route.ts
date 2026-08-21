import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { getDb, posts } from "@/db";
import { getCurrentUser } from "@/lib/auth";

const SEEN_COOKIE_TTL_SECONDS = 60 * 60 * 6; // 6 saat — aynı tarayıcıdan tekrar tekrar sayılmasın

/**
 * Görüntülenme sayacını artırır. Kasıtlı olarak giriş gerektirmez —
 * içerikler üye olmadan da izlenebilir ve izlenme kazanca yansır.
 *
 * İki koruma var:
 * 1. İçeriğin sahibi kendi içeriğini izlerken sayaç artmaz (kendi kazancını şişirmesin).
 * 2. Aynı tarayıcı aynı içeriği kısa süre içinde tekrar açtığında (sayfaya çık-gir) tekrar sayılmaz —
 *    bir çerezle işaretlenir, `SEEN_COOKIE_TTL_SECONDS` sonra tekrar sayılabilir.
 *
 * ÜRETİM NOTU: Bu hâlâ IP bazlı sağlam bir hız sınırlama değildir; farklı tarayıcı/gizli
 * pencere ile suistimal mümkün. Ciddi ölçekte Cloudflare Rate Limiting kuralı eklenmeli.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const db = getDb();
  const cookieStore = await cookies();

  const [viewer, rows] = await Promise.all([
    getCurrentUser(),
    db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, postId)).limit(1),
  ]);

  const target = rows[0];
  if (!target) return NextResponse.json({ error: "İçerik bulunamadı." }, { status: 404 });

  // 1) Sahibi kendi içeriğini izliyorsa sayma.
  if (viewer && viewer.id === target.userId) {
    return NextResponse.json({ ok: true, counted: false, reason: "owner" });
  }

  // 2) Bu tarayıcı bu içeriği yakın zamanda zaten izlemişse sayma.
  const seenCookieName = `seen_${postId}`;
  if (cookieStore.get(seenCookieName)) {
    return NextResponse.json({ ok: true, counted: false, reason: "already-seen" });
  }

  await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, postId));

  cookieStore.set(seenCookieName, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SEEN_COOKIE_TTL_SECONDS,
  });

  return NextResponse.json({ ok: true, counted: true });
}
