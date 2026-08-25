"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { TagSort } from "@/lib/posts";

const SORT_TABS: { key: TagSort; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "First posted" },
  { key: "views", label: "Most viewed" },
  { key: "likes", label: "Most liked" },
  { key: "comments", label: "Most commented" },
];

const TYPE_TABS: { key: "" | "video" | "photo"; label: string }[] = [
  { key: "", label: "All" },
  { key: "video", label: "Video" },
  { key: "photo", label: "Photo" },
];

export default function ModelFilters({
  slug,
  sortMode,
  typeFilter,
}: {
  slug: string;
  sortMode: TagSort;
  typeFilter?: "video" | "photo";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Pushes the new URL AND explicitly asks Next to refetch this server component's data
  // (router.refresh()) in the same transition — without this, clicking a filter could leave
  // stale content on screen until the visitor manually reloads the page.
  function go(next: { sort?: TagSort; type?: string }) {
    const params = new URLSearchParams();
    const nextSort = next.sort ?? sortMode;
    const nextType = next.type !== undefined ? next.type : (typeFilter ?? "");
    if (nextSort !== "newest") params.set("sort", nextSort);
    if (nextType) params.set("type", nextType);
    const qs = params.toString();
    const href = `/models/${slug}${qs ? `?${qs}` : ""}`;
    startTransition(() => {
      router.push(href, { scroll: false });
      router.refresh();
    });
  }

  return (
    <div className={`flex flex-col gap-2.5 transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.key || "all"}
            onClick={() => go({ type: tab.key })}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold whitespace-nowrap ${
              (typeFilter ?? "") === tab.key
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg)] text-[var(--text-muted)] active:bg-[var(--accent-soft)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {SORT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => go({ sort: tab.key })}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold whitespace-nowrap ${
              sortMode === tab.key
                ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                : "text-[var(--text-muted)] active:bg-[var(--bg)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
