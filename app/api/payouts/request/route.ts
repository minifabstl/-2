import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq, sum } from "drizzle-orm";
import { getDb, posts, payouts } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";
import { calculateEarningsUsd } from "@/lib/earnings";

/** Kullanıcının birikmiş (henüz ödeme talebi oluşturulmamış) kazancı için ödeme talebi açar. */
export async function POST() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  if (!user.bitcoinAddress) {
    return NextResponse.json({ error: "Önce profilinden bir Bitcoin cüzdan adresi ekle." }, { status: 400 });
  }

  const db = getDb();
  const [{ total }] = await db
    .select({ total: sum(posts.viewCount) })
    .from(posts)
    .where(eq(posts.userId, user.id));

  const totalViews = Number(total ?? 0);
  const totalEarned = calculateEarningsUsd(totalViews);

  const [{ paidOut }] = await db
    .select({ paidOut: sum(payouts.amountUsd) })
    .from(payouts)
    .where(eq(payouts.userId, user.id));

  const alreadyRequested = Number(paidOut ?? 0);
  const available = totalEarned - alreadyRequested;

  if (available < 1) {
    return NextResponse.json({ error: "Ödeme talep etmek için en az 1$ birikmiş kazancın olmalı." }, { status: 400 });
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
