"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const HISTORY_KEY = "lf_search_history";
const MAX_HISTORY = 8;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveHistory(list: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    // localStorage unavailable (private mode, etc.) — history just won't persist
  }
}

/**
 * Sidebar search box with two data-backed sections underneath:
 * - Trending: the real top-5 most-searched terms sitewide in the last 7 days (server-computed
 *   from lib/search.ts's search_logs table — never a static/fabricated list).
 * - Recent: this browser's own search history, stored in localStorage only (per-viewer,
 *   never sent to the server), which the user can delete one entry at a time or all at once.
 */
export default function SidebarSearch({ trending }: { trending: string[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Reads localStorage only after mount so the server-rendered HTML (which has no access to
    // the browser's storage) matches the client's first hydration pass — avoids a mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  function runSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((h) => h.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
    setQuery("");
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function removeHistoryItem(item: string) {
    setHistory((prev) => {
      const next = prev.filter((h) => h !== item);
      saveHistory(next);
      return next;
    });
  }

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  return (
    <div className="flex flex-col gap-2.5">
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

      {trending.length > 0 && (
        <div className="flex flex-col gap-1 px-1">
          <div className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wide">Trending</div>
          {trending.map((t) => (
            <button
              key={t}
              onClick={() => runSearch(t)}
              className="flex items-center gap-1.5 text-left text-[12px] text-[var(--text-muted)] hover:text-[var(--accent-dark)] truncate"
            >
              <span className="shrink-0">🔥</span>
              <span className="truncate">{t}</span>
            </button>
          ))}
        </div>
      )}

      {hydrated && history.length > 0 && (
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wide">Recent</div>
            <button onClick={clearHistory} className="text-[10px] text-[var(--text-faint)] hover:text-[var(--accent-dark)] font-semibold">
              Clear
            </button>
          </div>
          {history.map((h) => (
            <div key={h} className="flex items-center gap-1.5">
              <button onClick={() => runSearch(h)} className="flex-1 min-w-0 text-left truncate text-[12px] text-[var(--text-muted)] hover:text-[var(--accent-dark)]">
                {h}
              </button>
              <button
                onClick={() => removeHistoryItem(h)}
                aria-label={`Remove "${h}" from search history`}
                className="shrink-0 text-[var(--text-faint)] hover:text-[var(--danger)] px-1 text-[11px]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
