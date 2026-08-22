import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb, users, passwordResetCodes } from "@/db";
import { sendPasswordResetCodeEmail } from "@/lib/email";

const CODE_TTL_MS = 15 * 60 * 1000; // 15 dakika

function generateCode() {
  // 6 haneli, başında sıfır olabilir (000000-999999), string olarak saklanır.
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

/**
 * Kullanıcının kendi başlattığı şifre sıfırlama — e-postasını girer, kayıtlıysa
 * kendi e-postasına 6 haneli bir kod gider. Kullanıcı adı sızdırmamak için bu
 * uç nokta e-posta kayıtlı olsun olmasın her zaman aynı başarı mesajını döner.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "E-posta gerekli." }, { status: 400 });
  }

  const db = getDb();
  const rows = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email)).limit(1);
  const target = rows[0];

  // Kayıtlı olsun olmasın aynı yanıtı dönüyoruz — bir e-postanın sistemde
  // kayıtlı olup olmadığını dışarıdan anlaşılabilir hâle getirmemek için.
  if (target) {
    const code = generateCode();
    const now = new Date();
    await db.insert(passwordResetCodes).values({
      id: nanoid(),
      userId: target.id,
      code,
      createdAt: now,
      expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      usedAt: null,
    });
    await sendPasswordResetCodeEmail(target.email, code);
  }

  return NextResponse.json({
    ok: true,
    message: "Bu e-posta sistemde kayıtlıysa, sıfırlama kodu gönderildi.",
  });
}
