import { desc, eq } from "drizzle-orm";
import { getDb, posts, users } from "@/db";
import { formatViews } from "@/lib/earnings";
import AdminContentTable from "@/components/AdminContentTable";

export default async function AdminContentPage() {
  const db = getDb();

  const rows = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      category: posts.category,
      status: posts.status,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      username: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(200);

  const items = rows.map((r) => ({
    id: r.id,
    type: r.type as "video" | "photo",
    title: r.title,
    category: r.category,
    status: r.status as "live" | "flagged" | "removed",
    viewsLabel: formatViews(r.viewCount),
    username: r.username,
    createdAt: r.createdAt.toLocaleDateString("tr-TR"),
  }));

  return (
    <div>
      <div className="mb-6">
        <div className="font-display text-xl font-bold">İçerikler</div>
        <div className="text-[12.5px] text-[var(--text-muted)] mt-0.5">
          Yüklenen tüm video ve fotoğraflar — uygunsuz içerikleri akıştan kaldırabilirsin
        </div>
      </div>
      <AdminContentTable initialItems={items} />
    </div>
  );
}
