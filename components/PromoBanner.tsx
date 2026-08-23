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
      <span className="flex-1 min-w-0">
        <strong className="font-semibold">Earn money for the content you share.</strong>{" "}
        <span className="opacity-90">Guaranteed $3 on your first upload, plus $0.10 on every upload after that.</span>
      </span>
      <Link href="/sss" className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 font-semibold whitespace-nowrap shrink-0">
        Learn more
      </Link>
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 opacity-80 hover:opacity-100 text-base leading-none px-1">
        ✕
      </button>
    </div>
  );
}
