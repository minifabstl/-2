import { getCurrentUser } from "@/lib/auth";
import { listPosts } from "@/lib/posts";
import PostGrid from "@/components/PostGrid";

const CATEGORY_LABELS: Record<string, string> = {
  muzik: "Müzik",
  oyun: "Oyun",
  egitim: "Eğitim",
  spor: "Spor",
  teknoloji: "Teknoloji",
  komedi: "Komedi",
};

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams;
  const user = await getCurrentUser();
  const posts = await listPosts({ viewerId: user?.id ?? null, category: kategori });

  const title = kategori ? CATEGORY_LABELS[kategori] ?? "Keşfet" : "Keşfet";
  return <PostGrid posts={posts} isLoggedIn={!!user} title={title} />;
}
