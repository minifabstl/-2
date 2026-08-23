"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * The top promo banner. Cannot be dismissed until the user has made at least one upload —
 * `canDismiss` is computed server-side in app/layout.tsx from whether they have any posts.
 * Dismissal is intentionally in-memory only (no localStorage): it reappears on every page
 * reload, and persists only across client-side navigation within the same page load.
 */
export default function PromoBanner({ canDismiss }: { canDismiss: boolean }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="flex items-center gap-3 px-5 py-2.5 text-white text-[12.5px]"
      style={{ background: "linear-gradient(90deg, #db1a6d, #a8125a)" }}
    >
      <Link href="/creator-program" className="flex-1 min-w-0 flex items-center gap-3">
        <span className="flex items-center gap-1.5 shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M4 12l6 6L20 6" />
          </svg>
          <span className="font-display font-bold">LeakedFap</span>
          <span className="px-1.5 py-0.5 rounded bg-white/20 text-[9.5px] font-bold tracking-wide">OFFICIAL</span>
        </span>
        <span className="opacity-60">|</span>
        <span className="flex-1 min-w-0">
          <strong className="font-display font-bold">Get paid for what you post.</strong>{" "}
          <span className="opacity-90">
            Earn $0.20 per 1,000 views, paid straight to your wallet. Get a $3 bonus on your first upload.
          </span>
        </span>
        <span className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 font-semibold whitespace-nowrap shrink-0">
          Learn more
        </span>
      </Link>
      {canDismiss && (
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 opacity-80 hover:opacity-100 text-base leading-none px-1"
        >
          ✕
        </button>
      )}
    </div>
  );
}
