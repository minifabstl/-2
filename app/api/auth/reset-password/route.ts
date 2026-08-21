import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users, passwordResetTokens } from "@/db";
import { hashPassword } from "@/lib/password";

/** Sıfırlama token'ını tüketip kullanıcının YENİ şifresini belirler. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token ?? "";
  const newPassword = body?.newPassword ?? "";

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "Yeni şifre en az 8 karakter olmalı." }, { status: 400 });
  }

  const db = getDb();
  const rows = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.id, token)).limit(1);
  const record = rows[0];

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Bağlantının süresi dolmuş veya daha önce kullanılmış." }, { status: 400 });
  }

  const { hash, salt } = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: hash, passwordSalt: salt }).where(eq(users.id, record.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, token));

  return NextResponse.json({ ok: true });
}
