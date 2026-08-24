import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPostsByTag, getTagAggregate, searchPosts, TagSort } from "@/lib/posts";
import { formatViews } from "@/lib/earnings";
import { recordSearch } from "@/lib/search";
import PostGrid from "@/components/PostGrid";

type SearchParams = { q?: string; sort?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();
  return {
    title: query ? `Search results for "${query}"` : "Search",
    description: query
      ? `Videos, photos, and creators on LeakedFap matching "${query}".`
      : "Search videos, photos, and creators on LeakedFap.",
  };
}

const SORT_TABS: { key: TagSort; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "First posted" },
  { key: "views", label: "Most viewed" },
  { key: "likes", label: "Most liked" },
];

function isTagSort(value: string | undefined): value is TagSort {
  return value === "newest" || value === "oldest" || value === "views" || value === "likes";
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q, sort } = await searchParams;
  const query = (q ?? "").trim();
  const user = await getCurrentUser();

  if (query) await recordSearch(query, user?.id ?? null);

  const breadcrumb = (
    <nav aria-label="breadcrumb" className="px-6 pt-5 text-[11.5px] text-[var(--text-faint)] flex items-center gap-1.5">
      <Link href="/" className="hover:text-[var(--text-muted)]">Home</Link>
      <span>/</span>
      <span className="text-[var(--text-muted)] font-semibold">Search</span>
    </nav>
  );

  if (!query) {
    return (
      <>
        {breadcrumb}
        <div className="p-10 text-center text-[var(--text-muted)] text-sm">
          Type a video title, keyword, or username in the search box above to get started.
        </div>
      </>
    );
  }

  // A "topic": typing a name someone has tagged their uploads with (e.g. "Ronaldo") drops you
  // straight into a shared profile-style page of everything anyone has tagged that way, instead
  // of a generic fuzzy search — this is the feature the tag system exists to power.
  const topic = await getTagAggregate(query);

  if (topic) {
    const sortMode: TagSort = isTagSort(sort) ? sort : "newest";
    const results = await getPostsByTag(query, { sort: sortMode, viewerId: user?.id ?? null });

    return (
      <>
        {breadcrumb}
        <div className="px-7 pt-2">
          <div className="flex items-center gap-3.5 mb-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display font-bold text-xl shrink-0"
              style={{ background: "linear-gradient(135deg, #db1a6d, #a8125a)" }}
            >
              #
            </div>
            <div>
              <h1 className="font-display text-[20px] font-bold leading-tight">{query}</h1>
              <div className="text-[12.5px] text-[var(--text-muted)]">
                {topic.count} post{topic.count === 1 ? "" : "s"} · {formatViews(topic.totalViews)} views total
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-1">
            {SORT_TABS.map((tab) => (
              <Link
                key={tab.key}
                href={`/search?q=${encodeURIComponent(query)}&sort=${tab.key}`}
                className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold ${
                  sortMode === tab.key
                    ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        <PostGrid posts={results} isLoggedIn={!!user} title="" />
      </>
    );
  }

  const results = await searchPosts(query, user?.id ?? null);

  return (
    <>
      {breadcrumb}
      <PostGrid posts={results} isLoggedIn={!!user} title={`Search results for "${query}"`} />
    </>
  );
}
