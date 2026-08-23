import { desc } from "drizzle-orm";
import { getDb, users, posts, bonuses } from "@/db";
import { calculateEarningsUsd, calculateTier, formatUsd, TIER_LABEL } from "@/lib/earnings";
import AdminUsersTable from "@/components/AdminUsersTable";

export default async function AdminUsersPage() {
  const db = getDb();

  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  const allPosts = await db.select({ userId: posts.userId, viewCount: posts.viewCount }).from(posts);
  const allBonuses = await db.select({ userId: bonuses.userId, amountUsd: bonuses.amountUsd }).from(bonuses);

  const viewsByUser = new Map<string, { posts: number; views: number }>();
  for (const p of allPosts) {
    const cur = viewsByUser.get(p.userId) ?? { posts: 0, views: 0 };
    cur.posts += 1;
    cur.views += p.viewCount;
    viewsByUser.set(p.userId, cur);
  }

  const bonusByUser = new Map<string, number>();
  for (const b of allBonuses) {
    bonusByUser.set(b.userId, (bonusByUser.get(b.userId) ?? 0) + b.amountUsd);
  }

  const rows = allUsers.map((u) => {
    const agg = viewsByUser.get(u.id) ?? { posts: 0, views: 0 };
    const bonusUsd = bonusByUser.get(u.id) ?? 0;
    const tier = calculateTier({ verifiedCreator: u.verifiedCreator, totalUploads: agg.posts, totalViews: agg.views });
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      joined: u.createdAt.toLocaleDateString("en-US"),
      posts: agg.posts,
      views: agg.views.toLocaleString("en-US"),
      earnings: formatUsd(calculateEarningsUsd(agg.views, tier) + bonusUsd),
      status: u.status,
      role: u.role,
      tier,
      tierLabel: TIER_LABEL[tier],
      verifiedCreator: u.verifiedCreator,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <div className="font-display text-xl font-bold">Users</div>
        <div className="text-[12.5px] text-[var(--text-muted)] mt-0.5">All registered accounts and their upload history</div>
      </div>
      <AdminUsersTable initialUsers={rows} />
    </div>
  );
}
