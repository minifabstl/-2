import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listPosts } from "@/lib/posts";
import PostGrid from "@/components/PostGrid";

export const metadata: Metadata = {
  title: "Explore",
  description: "Explore the newest videos and photos on LeakedFap.",
};

export default async function ExplorePage() {
  const user = await getCurrentUser();
  const posts = await listPosts({ viewerId: user?.id ?? null, viewerIsAdmin: user?.role === "admin" });

  return (
    <>
      <nav aria-label="breadcrumb" className="px-6 pt-5 text-[11.5px] text-[var(--text-faint)] flex items-center gap-1.5">
        <Link href="/" className="hover:text-[var(--text-muted)]">Home</Link>
        <span>/</span>
        <span className="text-[var(--text-muted)] font-semibold">Explore</span>
      </nav>
      <PostGrid posts={posts} isLoggedIn={!!user} title="Explore" />
    </>
  );
}
