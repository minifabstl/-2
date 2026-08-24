import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { searchPosts } from "@/lib/posts";
import PostGrid from "@/components/PostGrid";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();
  return {
    title: query ? `Search results for "${query}"` : "Search",
    description: query
      ? `Videos, photos, and creators on LeakedFap matching "${query}".`
      : "Search videos, photos, and creators on LeakedFap.",
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const user = await getCurrentUser();
  const results = query ? await searchPosts(query, user?.id ?? null) : [];

  return (
    <>
      <nav aria-label="breadcrumb" className="px-6 pt-5 text-[11.5px] text-[var(--text-faint)] flex items-center gap-1.5">
        <Link href="/" className="hover:text-[var(--text-muted)]">Home</Link>
        <span>/</span>
        <span className="text-[var(--text-muted)] font-semibold">Search</span>
      </nav>

      {!query ? (
        <div className="p-10 text-center text-[var(--text-muted)] text-sm">
          Type a video title, keyword, or username in the search box above to get started.
        </div>
      ) : (
        <PostGrid posts={results} isLoggedIn={!!user} title={`Search results for "${query}"`} />
      )}
    </>
  );
}
