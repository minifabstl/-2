import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb, posts, payouts, bonuses } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateEarningsUsd, formatUsd, formatViews } from "@/lib/earnings";
import { mediaUrl } from "@/lib/storage";
import ProfileView from "@/components/ProfileView";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ uploaded?: string; tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { uploaded, tab } = await searchParams;

  const db = getDb();

  const myPosts = await db
    .select({ id: posts.id, type: posts.type, title: posts.title, status: posts.status, viewCount: posts.viewCount, createdAt: posts.createdAt })
    .from(posts)
    .where(eq(posts.userId, user.id))
    .orderBy(desc(posts.createdAt));

  const myPayouts = await db
    .select()
    .from(payouts)
    .where(eq(payouts.userId, user.id))
    .orderBy(desc(payouts.createdAt));

  const myBonuses = await db.select({ postId: bonuses.postId, amountUsd: bonuses.amountUsd }).from(bonuses).where(eq(bonuses.userId, user.id));
  const bonusByPostId = new Map(myBonuses.map((b) => [b.postId, b.amountUsd]));
  const totalBonusUsd = myBonuses.reduce((acc, b) => acc + b.amountUsd, 0);

  const totalViews = myPosts.reduce((acc, p) => acc + p.viewCount, 0);
  const totalEarned = calculateEarningsUsd(totalViews) + totalBonusUsd;
  const alreadyRequested = myPayouts.reduce((s, p) => s + p.amountUsd, 0);
  const availableToRequest = Math.max(0, totalEarned - alreadyRequested);

  return (
    <ProfileView
      justUploaded={uploaded === "1"}
      initialTab={tab === "earnings" ? "earnings" : "posts"}
      user={{ username: user.username, bitcoinAddress: user.bitcoinAddress, avatarUrl: user.avatarKey ? mediaUrl(user.avatarKey) : null }}
      stats={{
        totalPosts: myPosts.length,
        totalViews,
        totalViewsLabel: formatViews(totalViews),
        totalEarnedLabel: formatUsd(totalEarned),
        availableLabel: formatUsd(availableToRequest),
      }}
      posts={myPosts.map((p) => ({
        id: p.id,
        type: p.type,
        title: p.title,
        status: p.status,
        viewsLabel: formatViews(p.viewCount) + " views",
        earnLabel: formatUsd(calculateEarningsUsd(p.viewCount) + (bonusByPostId.get(p.id) ?? 0)),
      }))}
      payouts={myPayouts.map((p) => ({
        id: p.id,
        date: p.createdAt.toLocaleDateString("en-US"),
        amountLabel: formatUsd(p.amountUsd),
        status: p.status,
      }))}
    />
  );
}
