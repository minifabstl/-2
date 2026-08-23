import { NextResponse } from "next/server";
import { eq, sum } from "drizzle-orm";
import { getDb, posts, payouts, bonuses } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";
import { calculateEarningsUsd, formatUsd } from "@/lib/earnings";

/** Lightweight earnings summary used by the profile dropdown menu. */
export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const db = getDb();
  const [{ total }] = await db.select({ total: sum(posts.viewCount) }).from(posts).where(eq(posts.userId, user.id));
  const totalViews = Number(total ?? 0);
  const [{ bonusTotal }] = await db.select({ bonusTotal: sum(bonuses.amountUsd) }).from(bonuses).where(eq(bonuses.userId, user.id));
  const totalEarned = calculateEarningsUsd(totalViews) + Number(bonusTotal ?? 0);

  const [{ paidOut }] = await db.select({ paidOut: sum(payouts.amountUsd) }).from(payouts).where(eq(payouts.userId, user.id));
  const availableToRequest = Math.max(0, totalEarned - Number(paidOut ?? 0));

  return NextResponse.json({
    totalEarnedLabel: formatUsd(totalEarned),
    availableLabel: formatUsd(availableToRequest),
  });
}
