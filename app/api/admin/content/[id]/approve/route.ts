import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, posts, users, bonuses } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";
import { sendContentApprovedEmail } from "@/lib/email";
import { FIRST_UPLOAD_BONUS_USD, REPEAT_UPLOAD_BONUS_USD } from "@/lib/earnings";

/** Approves a pending (or flagged) piece of content and publishes it. Admin only. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const { id } = await params;
  const db = getDb();
  const rows = await db
    .select({ status: posts.status, title: posts.title, userId: posts.userId, email: users.email, notifyOnApproval: users.notifyOnApproval })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, id))
    .limit(1);
  const target = rows[0];
  if (!target) return NextResponse.json({ error: "Content not found." }, { status: 404 });

  const wasPending = target.status === "pending";

  await db.update(posts).set({ status: "live" }).where(eq(posts.id, id));

  // Grant a one-time upload bonus, but only on a post's FIRST approval (not when
  // re-approving a previously-flagged post, and never twice for the same post).
  if (wasPending) {
    const existingBonus = await db.select({ id: bonuses.id }).from(bonuses).where(eq(bonuses.postId, id)).limit(1);
    if (existingBonus.length === 0) {
      const priorBonuses = await db.select({ id: bonuses.id }).from(bonuses).where(eq(bonuses.userId, target.userId)).limit(1);
      const amountUsd = priorBonuses.length === 0 ? FIRST_UPLOAD_BONUS_USD : REPEAT_UPLOAD_BONUS_USD;
      await db.insert(bonuses).values({ id: nanoid(), userId: target.userId, postId: id, amountUsd, createdAt: new Date() });
    }
  }

  if (target.notifyOnApproval) {
    await sendContentApprovedEmail(target.email, target.title).catch(() => {});
  }

  return NextResponse.json({ ok: true, status: "live" });
}
