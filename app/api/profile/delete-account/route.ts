import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, users, posts, likes, comments, payouts, sessions, passwordResetTokens, passwordResetCodes, bonuses } from "@/db";
import { AuthError, destroySession, requireUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

/**
 * Permanently deletes the current user's account: their uploads (DB rows and R2 files),
 * likes, comments, payouts, sessions, and the user record itself. Irreversible.
 */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => null);
  const password = body?.password ?? "";

  const db = getDb();
  const rows = await db
    .select({ passwordHash: users.passwordHash, passwordSalt: users.passwordSalt })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const valid = await verifyPassword(String(password), row.passwordHash, row.passwordSalt);
  if (!valid) {
    return NextResponse.json({ error: "Your password is incorrect." }, { status: 400 });
  }

  const myPosts = await db
    .select({ id: posts.id, mediaKey: posts.mediaKey, thumbnailKey: posts.thumbnailKey })
    .from(posts)
    .where(eq(posts.userId, user.id));

  const { env } = getCloudflareContext();
  for (const p of myPosts) {
    await env.BUCKET.delete(p.mediaKey);
    if (p.thumbnailKey) await env.BUCKET.delete(p.thumbnailKey);
    await db.delete(likes).where(eq(likes.postId, p.id));
    await db.delete(comments).where(eq(comments.postId, p.id));
  }
  await db.delete(bonuses).where(eq(bonuses.userId, user.id));
  await db.delete(posts).where(eq(posts.userId, user.id));
  await db.delete(likes).where(eq(likes.userId, user.id));
  await db.delete(comments).where(eq(comments.userId, user.id));
  await db.delete(payouts).where(eq(payouts.userId, user.id));
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
  await db.delete(passwordResetCodes).where(eq(passwordResetCodes.userId, user.id));
  await db.delete(users).where(eq(users.id, user.id));

  await destroySession();

  return NextResponse.json({ ok: true });
}
