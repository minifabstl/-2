import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";

/**
 * Marks (or unmarks) that an admin has manually sent the site-time gift (a real, admin-funded
 * $50 OnlyFans account — see lib/gift.ts) to a user who reached the hour milestone. Admin only.
 * There is no automated delivery — this just records that a human handled it, the same way
 * payouts are marked "paid" by hand.
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
  const rows = await db.select({ giftSentAt: users.giftSentAt, giftMilestoneReachedAt: users.giftMilestoneReachedAt }).from(users).where(eq(users.id, id)).limit(1);
  const target = rows[0];
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (!target.giftMilestoneReachedAt) return NextResponse.json({ error: "This user hasn't reached the gift milestone yet." }, { status: 400 });

  const nextSentAt = target.giftSentAt ? null : new Date();
  await db.update(users).set({ giftSentAt: nextSentAt }).where(eq(users.id, id));
  return NextResponse.json({ ok: true, giftSentAt: nextSentAt ? nextSentAt.toISOString() : null });
}
