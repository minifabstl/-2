import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, users, passwordResetCodes } from "@/db";
import { hashPassword } from "@/lib/password";

/** Verifies the 6-digit code sent to the user's email and lets them set their new password. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const code = String(body?.code ?? "").trim();
  const newPassword = String(body?.newPassword ?? "");

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const db = getDb();
  const userRows = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email)).limit(1);
  const user = userRows[0];
  // We return the same generic error even if the user isn't found (to avoid leaking the email).
  const genericError = () => NextResponse.json({ error: "The code is incorrect or may have expired." }, { status: 400 });
  if (!user) return genericError();

  const codeRows = await db
    .select()
    .from(passwordResetCodes)
    .where(and(eq(passwordResetCodes.userId, user.id), eq(passwordResetCodes.code, code)))
    .limit(1);
  const record = codeRows[0];

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return genericError();
  }

  const { hash, salt } = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: hash, passwordSalt: salt }).where(eq(users.id, user.id));
  await db.update(passwordResetCodes).set({ usedAt: new Date() }).where(eq(passwordResetCodes.id, record.id));

  return NextResponse.json({ ok: true });
}
