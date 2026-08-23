import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listPosts } from "@/lib/posts";
import PostGrid from "@/components/PostGrid";

const CATEGORY_LABELS: Record<string, string> = {
  muzik: "Music",
  oyun: "Gaming",
  egitim: "Education",
  spor: "Sports",
  teknoloji: "Technology",
  komedi: "Comedy",
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ kategori?: string }> }): Promise<Metadata> {
  const { kategori } = await searchParams;
  const label = kategori ? CATEGORY_LABELS[kategori] : null;
  return {
    title: label ? `${label} Content — Explore` : "Explore",
    description: label
      ? `Explore the newest videos and photos in the ${label.toLowerCase()} category on LeakedFap.`
      : "Explore the newest videos and photos from every category on LeakedFap.",
  };
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams;
  const user = await getCurrentUser();
  const posts = await listPosts({ viewerId: user?.id ?? null, category: kategori });

  const title = kategori ? CATEGORY_LABELS[kategori] ?? "Explore" : "Explore";
  const breadcrumb = (
    <nav aria-label="breadcrumb" className="px-6 pt-5 text-[11.5px] text-[var(--text-faint)] flex items-center gap-1.5">
      <Link href="/" className="hover:text-[var(--text-muted)]">Home</Link>
      <span>/</span>
      <Link href="/explore" className={!kategori ? "text-[var(--text-muted)] font-semibold" : "hover:text-[var(--text-muted)]"}>Explore</Link>
      {kategori && CATEGORY_LABELS[kategori] && (
        <>
          <span>/</span>
          <span className="text-[var(--text-muted)] font-semibold">{CATEGORY_LABELS[kategori]}</span>
        </>
      )}
    </nav>
  );

  return (
    <>
      {breadcrumb}
      <PostGrid posts={posts} isLoggedIn={!!user} title={title} />
    </>
  );
}
