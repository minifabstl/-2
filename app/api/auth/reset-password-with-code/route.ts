import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, users, passwordResetCodes } from "@/db";
import { hashPassword } from "@/lib/password";

/** Kullanıcının e-postasına gönderilen 6 haneli kodu doğrulayıp yeni şifresini kendisi belirler. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const code = String(body?.code ?? "").trim();
  const newPassword = String(body?.newPassword ?? "");

  if (!email || !code) {
    return NextResponse.json({ error: "E-posta ve kod gerekli." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Yeni şifre en az 8 karakter olmalı." }, { status: 400 });
  }

  const db = getDb();
  const userRows = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email)).limit(1);
  const user = userRows[0];
  // Kullanıcı bulunamasa bile aynı genel hata mesajını döneriz (e-posta sızdırmamak için).
  const genericError = () => NextResponse.json({ error: "Kod hatalı veya süresinin dolmuş olabilir." }, { status: 400 });
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
