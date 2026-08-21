import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, payouts } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";

/**
 * Bir ödeme talebini "ödendi" olarak işaretler.
 *
 * ÖNEMLİ: Bu uygulama gerçek bir Bitcoin transferi GERÇEKLEŞTİRMEZ — admin,
 * transferi kendi cüzdanından/borsasından manuel yaptıktan SONRA burayı
 * işaretler. Otomatik on-chain ödeme istersen bir ödeme sağlayıcısı (ör.
 * BTCPay Server, Coinbase Commerce, OpenNode) entegre edilmeli; bu, ayrı bir
 * güvenlik/uyumluluk incelemesi gerektiren bir adımdır (bkz. README).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const { id } = await params;
  const db = getDb();
  await db.update(payouts).set({ status: "paid", paidAt: new Date() }).where(eq(payouts.id, id));
  return NextResponse.json({ ok: true });
}
