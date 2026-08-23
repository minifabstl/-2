import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb, users, passwordResetTokens } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * RESETS the user's password — but never views or sets it directly.
 * All it does is send a time-limited/single-use link to the user's
 * registered email, letting them set their own new password.
 * This response never returns the token to the admin.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const { id } = await params;
  const db = getDb();
  const rows = await db.select({ email: users.email, username: users.username }).from(users).where(eq(users.id, id)).limit(1);
  const target = rows[0];
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const token = nanoid(40);
  const now = new Date();
  await db.insert(passwordResetTokens).values({
    id: token,
    userId: id,
    createdAt: now,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
    usedAt: null,
  });

  const origin = req.nextUrl.origin;
  const resetUrl = `${origin}/reset-password?token=${token}`;
  await sendPasswordResetEmail(target.email, resetUrl);

  return NextResponse.json({ ok: true, message: `Reset link sent to @${target.username}'s email.` });
}
