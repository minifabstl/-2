"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Sidebar search box — submits to /search?q=... (see app/search/page.tsx). */
export default function SidebarSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function runSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    setQuery("");
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        runSearch(query);
      }}
      className="flex items-center gap-2 rounded-full px-3.5 py-2.5"
      style={{ background: "rgba(219,26,109,0.1)" }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#db1a6d" strokeWidth="2.2" className="shrink-0">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        className="bg-transparent outline-none text-[13px] font-semibold flex-1 min-w-0 placeholder:font-semibold"
        style={{ color: "#db1a6d" }}
      />
    </form>
  );
}
