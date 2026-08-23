import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb, users } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";
import { GIFT_MILESTONE_SECONDS, TRACK_MAX_SECONDS_PER_CALL } from "@/lib/gift";

/**
 * Heartbeat endpoint the client calls every ~30s while the tab is visible and focused
 * (see components/TimeTracker.tsx) to accrue "active time on site" toward the gift program.
 * Not a rigorous anti-abuse system — same trust model as the rest of this MVP — but the
 * server always clamps the reported delta rather than trusting the client outright.
 */
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => null);
  const rawSeconds = Number(body?.seconds);
  const seconds = Number.isFinite(rawSeconds) ? Math.min(Math.max(Math.round(rawSeconds), 0), TRACK_MAX_SECONDS_PER_CALL) : 0;
  if (seconds <= 0) {
    return NextResponse.json({ ok: true, activeSeconds: user.activeSeconds, milestoneReached: !!user.giftMilestoneReachedAt });
  }

  const db = getDb();
  const wasBelowMilestone = user.activeSeconds < GIFT_MILESTONE_SECONDS;
  const newTotal = user.activeSeconds + seconds;
  const justReachedMilestone = wasBelowMilestone && newTotal >= GIFT_MILESTONE_SECONDS && !user.giftMilestoneReachedAt;

  await db
    .update(users)
    .set({
      activeSeconds: sql`${users.activeSeconds} + ${seconds}`,
      ...(justReachedMilestone ? { giftMilestoneReachedAt: new Date() } : {}),
    })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true, activeSeconds: newTotal, milestoneReached: newTotal >= GIFT_MILESTONE_SECONDS });
}
