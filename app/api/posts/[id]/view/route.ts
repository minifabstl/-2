import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { getDb, posts } from "@/db";
import { getCurrentUser } from "@/lib/auth";

const SEEN_COOKIE_TTL_SECONDS = 60 * 60 * 6; // 6 hours — so the same browser isn't counted repeatedly

/**
 * Increments the view counter. Intentionally does not require login —
 * content can be watched without being a member, and views feed into earnings.
 *
 * There are two safeguards:
 * 1. The counter does not increment when the content's owner watches their own content
 *    (so they can't inflate their own earnings).
 * 2. The same browser opening the same content again shortly after (leaving and re-entering
 *    the page) is not counted again — it's marked with a cookie, and can be counted again
 *    after `SEEN_COOKIE_TTL_SECONDS`.
 *
 * PRODUCTION NOTE: This is still not a robust IP-based rate limit; abuse via a different
 * browser/incognito window is possible. A Cloudflare Rate Limiting rule should be added at scale.
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
  if (!target) return NextResponse.json({ error: "Content not found." }, { status: 404 });

  // 1) Don't count if the owner is watching their own content.
  if (viewer && viewer.id === target.userId) {
    return NextResponse.json({ ok: true, counted: false, reason: "owner" });
  }

  // 2) Don't count if this browser has already watched this content recently.
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
