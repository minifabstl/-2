import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

/** Changes the current user's password after verifying their old password. */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => null);
  const oldPassword = body?.oldPassword ?? "";
  const newPassword = body?.newPassword ?? "";

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const db = getDb();
  const rows = await db
    .select({ passwordHash: users.passwordHash, passwordSalt: users.passwordSalt })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const valid = await verifyPassword(String(oldPassword), row.passwordHash, row.passwordSalt);
  if (!valid) {
    return NextResponse.json({ error: "Your old password is incorrect." }, { status: 400 });
  }

  const { hash, salt } = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: hash, passwordSalt: salt }).where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
