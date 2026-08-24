"use client";

import { useEffect, useState } from "react";

// Reappears every time someone opens the site in a fresh browser session (sessionStorage is
// per-tab and clears when the tab/browser closes) — not on every internal click, which would
// make the site unusable. This is a legal/compliance gate for age-restricted content, shown
// full-screen on both mobile and desktop (the layout below is responsive, not a separate build).
const AGE_GATE_KEY = "lf_age_confirmed";
const EXIT_URL = "https://www.google.com";

export default function AgeGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(AGE_GATE_KEY) !== "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
      }
    } catch {
      // Storage unavailable (e.g. a strict privacy mode) — fail safe by showing the gate.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  function confirmAdult() {
    try {
      sessionStorage.setItem(AGE_GATE_KEY, "1");
    } catch {
      // Ignore — worst case the gate just shows again next time.
    }
    setVisible(false);
  }

  function exitSite() {
    window.location.href = EXIT_URL;
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-6 text-center overflow-y-auto"
      style={{ background: "#18181b" }}
      role="dialog"
      aria-modal="true"
      aria-label="Age verification"
    >
      <div className="max-w-md w-full flex flex-col items-center gap-5 py-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #db1a6d, #00aff0)" }}
        >
          <span className="text-white font-display font-bold text-2xl notranslate" translate="no">
            LF
          </span>
        </div>

        <h1 className="text-white font-display text-[24px] sm:text-[30px] font-bold leading-tight">
          This is an adults-only website
        </h1>

        <p className="text-white/70 text-[13.5px] sm:text-[14px] leading-relaxed">
          <span className="notranslate" translate="no">
            LeakedFap
          </span>{" "}
          contains age-restricted material, including nudity and explicit depictions of sexual activity. By
          entering, you confirm that you are at least 18 years old — or the age of majority in your jurisdiction —
          and that you consent to viewing sexually explicit content.
        </p>

        <div className="w-full flex flex-col gap-3 mt-2">
          <button
            onClick={confirmAdult}
            className="w-full py-3.5 rounded-[10px] font-bold text-[14.5px] text-white"
            style={{ background: "#db1a6d" }}
          >
            I am 18 or older — Enter
          </button>
          <button
            onClick={exitSite}
            className="w-full py-3.5 rounded-[10px] font-bold text-[14.5px] text-white/80 border border-white/15"
          >
            I am under 18 — Exit
          </button>
        </div>

        <div className="text-white/40 text-[11px] mt-2">
          © {new Date().getFullYear()}{" "}
          <span className="notranslate" translate="no">
            LeakedFap
          </span>
        </div>
      </div>
    </div>
  );
}
