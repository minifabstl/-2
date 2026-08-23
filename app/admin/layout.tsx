import { redirect } from "next/navigation";
import { and, count, eq, isNotNull, isNull } from "drizzle-orm";
import { getDb, posts, users } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const db = getDb();
  const [pendingRow] = await db.select({ n: count() }).from(posts).where(eq(posts.status, "pending"));
  const [pendingGiftsRow] = await db
    .select({ n: count() })
    .from(users)
    .where(and(isNotNull(users.giftMilestoneReachedAt), isNull(users.giftSentAt)));

  return (
    <AdminShell username={user.username} pendingContentCount={pendingRow?.n ?? 0} pendingGiftsCount={pendingGiftsRow?.n ?? 0}>
      {children}
    </AdminShell>
  );
}
