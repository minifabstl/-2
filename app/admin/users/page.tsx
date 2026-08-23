import { desc } from "drizzle-orm";
import { getDb, users, posts } from "@/db";
import { calculateEarningsUsd, formatUsd } from "@/lib/earnings";
import AdminUsersTable from "@/components/AdminUsersTable";

export default async function AdminUsersPage() {
  const db = getDb();

  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  const allPosts = await db.select({ userId: posts.userId, viewCount: posts.viewCount }).from(posts);

  const viewsByUser = new Map<string, { posts: number; views: number }>();
  for (const p of allPosts) {
    const cur = viewsByUser.get(p.userId) ?? { posts: 0, views: 0 };
    cur.posts += 1;
    cur.views += p.viewCount;
    viewsByUser.set(p.userId, cur);
  }

  const rows = allUsers.map((u) => {
    const agg = viewsByUser.get(u.id) ?? { posts: 0, views: 0 };
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      joined: u.createdAt.toLocaleDateString("en-US"),
      posts: agg.posts,
      views: agg.views.toLocaleString("en-US"),
      earnings: formatUsd(calculateEarningsUsd(agg.views)),
      status: u.status,
      role: u.role,
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
