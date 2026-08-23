"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "lfap_promo_banner_dismissed";

export default function PromoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Reads a one-time client-only preference (dismissed or not) to decide whether to show the banner.
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a client-only external source
    setVisible(!dismissed);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore — worst case the banner reappears next visit
    }
  }

  if (!visible) return null;

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
            Earn $0.20 per 1,000 views, paid in Bitcoin. Get a $3 bonus on your first upload.
          </span>
        </span>
        <span className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 font-semibold whitespace-nowrap shrink-0">
          Learn more
        </span>
      </Link>
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 opacity-80 hover:opacity-100 text-base leading-none px-1">
        ✕
      </button>
    </div>
  );
}
