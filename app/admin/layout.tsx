import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { getDb, posts } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const db = getDb();
  const [pendingRow] = await db.select({ n: count() }).from(posts).where(eq(posts.status, "pending"));

  return (
    <AdminShell username={user.username} pendingContentCount={pendingRow?.n ?? 0}>
      {children}
    </AdminShell>
  );
}
