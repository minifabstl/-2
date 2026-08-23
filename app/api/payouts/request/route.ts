import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { count, desc, eq, sum } from "drizzle-orm";
import { getDb, posts, payouts, bonuses } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";
import { PAYOUT_COOLDOWN_DAYS, calculateEarningsUsd, calculateTier } from "@/lib/earnings";

/** Opens a payout request for the user's accrued (not yet requested) earnings. */
export async function POST() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  if (!user.bitcoinAddress) {
    return NextResponse.json({ error: "Add a wallet address to your profile first." }, { status: 400 });
  }

  const db = getDb();

  // Payouts can only be requested once every PAYOUT_COOLDOWN_DAYS — see the Creator Program page.
  const [lastPayout] = await db
    .select({ createdAt: payouts.createdAt })
    .from(payouts)
    .where(eq(payouts.userId, user.id))
    .orderBy(desc(payouts.createdAt))
    .limit(1);
  if (lastPayout) {
    const cooldownMs = PAYOUT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const nextEligibleAt = lastPayout.createdAt.getTime() + cooldownMs;
    const msRemaining = nextEligibleAt - Date.now();
    if (msRemaining > 0) {
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
      return NextResponse.json(
        { error: `You can request a payout once every ${PAYOUT_COOLDOWN_DAYS} days. Try again in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}.` },
        { status: 400 }
      );
    }
  }

  const [{ total }] = await db
    .select({ total: sum(posts.viewCount) })
    .from(posts)
    .where(eq(posts.userId, user.id));
  const [{ uploadCount }] = await db
    .select({ uploadCount: count() })
    .from(posts)
    .where(eq(posts.userId, user.id));

  const totalViews = Number(total ?? 0);
  const tier = calculateTier({ verifiedCreator: user.verifiedCreator, totalUploads: uploadCount, totalViews });
  const [{ bonusTotal }] = await db.select({ bonusTotal: sum(bonuses.amountUsd) }).from(bonuses).where(eq(bonuses.userId, user.id));
  const totalEarned = calculateEarningsUsd(totalViews, tier) + Number(bonusTotal ?? 0);

  const [{ paidOut }] = await db
    .select({ paidOut: sum(payouts.amountUsd) })
    .from(payouts)
    .where(eq(payouts.userId, user.id));

  const alreadyRequested = Number(paidOut ?? 0);
  const available = totalEarned - alreadyRequested;

  if (available < 1) {
    return NextResponse.json({ error: "You must have at least $1 in accrued earnings to request a payout." }, { status: 400 });
  }

  const id = nanoid();
  await db.insert(payouts).values({
    id,
    userId: user.id,
    amountUsd: available,
    bitcoinAddress: user.bitcoinAddress,
    status: "pending",
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true, amountUsd: available });
}
