import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, payouts } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";

/**
 * Marks a payout request as "paid".
 *
 * IMPORTANT: This application does NOT perform an actual Bitcoin transfer —
 * the admin marks this AFTER manually sending the transfer from their own
 * wallet/exchange. If you want automated on-chain payment, a payment
 * provider (e.g. BTCPay Server, Coinbase Commerce, OpenNode) needs to be
 * integrated; this is a step that requires a separate security/compliance
 * review (see README).
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
