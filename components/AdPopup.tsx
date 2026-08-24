"use client";

import { useEffect, useState } from "react";

/**
 * A one-time animated ad popup that appears near the right side of the screen,
 * stays visible for ~6.5s, then fades/slides out on its own. In-memory only —
 * reappears on every fresh page load, same pattern as PromoBanner's dismissal.
 */
export default function AdPopup() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 500);
    const hideTimer = setTimeout(() => setVisible(false), 500 + 6800);
    const removeTimer = setTimeout(() => setMounted(false), 500 + 6800 + 500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`fixed right-5 top-1/2 -translate-y-1/2 z-[60] transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-6 scale-90"
      }`}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg max-w-[280px]"
        style={{ background: "#00aff0", boxShadow: "0 8px 24px rgba(0,175,240,0.35)" }}
      >
        <span className="text-[18px] shrink-0">📢</span>
        <span className="text-white text-[12.5px] font-semibold leading-snug">
          For advertising, you can reach us at{" "}
          <a href="mailto:LeakedFap@protonmail.com" className="underline">
            LeakedFap@protonmail.com
          </a>
        </span>
      </div>
    </div>
  );
}
