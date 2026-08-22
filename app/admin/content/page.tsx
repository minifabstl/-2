import { desc, eq } from "drizzle-orm";
import { getDb, posts, users } from "@/db";
import { formatViews } from "@/lib/earnings";
import { mediaUrl } from "@/lib/storage";
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
      mediaKey: posts.mediaKey,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(200);

  const items = rows
    .map((r) => ({
      id: r.id,
      type: r.type as "video" | "photo",
      title: r.title,
      category: r.category,
      status: r.status as "pending" | "live" | "flagged" | "removed",
      viewsLabel: formatViews(r.viewCount),
      username: r.username,
      createdAt: r.createdAt.toLocaleDateString("tr-TR"),
      mediaUrl: mediaUrl(r.mediaKey),
    }))
    // Onay bekleyenler en üstte görünsün, admin ilk açtığında hemen fark etsin.
    .sort((a, b) => (a.status === "pending") === (b.status === "pending") ? 0 : a.status === "pending" ? -1 : 1);

  const pendingCount = items.filter((it) => it.status === "pending").length;

  return (
    <div>
      <div className="mb-6">
        <div className="font-display text-xl font-bold">İçerikler</div>
        <div className="text-[12.5px] text-[var(--text-muted)] mt-0.5">
          {pendingCount > 0
            ? `${pendingCount} içerik onayını bekliyor — yayına girmeden önce inceleyip onayla ya da reddet.`
            : "Yüklenen tüm video ve fotoğraflar — uygunsuz içerikleri akıştan kaldırabilirsin."}
        </div>
      </div>
      <AdminContentTable initialItems={items} />
    </div>
  );
}
