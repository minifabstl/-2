import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb, users, passwordResetTokens } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * Kullanıcının şifresini SIFIRLAR — ama asla görüntülemez ya da belirlemez.
 * Tek yaptığı: kullanıcının kayıtlı e-postasına, kendi yeni şifresini
 * belirleyebileceği süreli/tek kullanımlık bir bağlantı göndermek.
 * Bu response hiçbir zaman token'ı admin'e döndürmez.
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
  if (!target) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  const token = nanoid(40);
  const now = new Date();
  await db.insert(passwordResetTokens).values({
    id: token,
    userId: id,
    createdAt: now,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 saat
    usedAt: null,
  });

  const origin = req.nextUrl.origin;
  const resetUrl = `${origin}/reset-password?token=${token}`;
  await sendPasswordResetEmail(target.email, resetUrl);

  return NextResponse.json({ ok: true, message: `Sıfırlama bağlantısı @${target.username} kullanıcısının e-postasına gönderildi.` });
}
