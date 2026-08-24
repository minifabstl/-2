"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Real, working whole-site translation via the Google Website Translator widget (loaded once
 * in app/layout.tsx). Picking a language here drives the hidden <select class="goog-te-combo">
 * Google's widget injects — the same mechanism Google's own site-embed code uses — so the page
 * translates instantly with no reload. We also persist the choice in the `googtrans` cookie so
 * it's still applied on the very next full page load, and reload only as a fallback if the
 * widget hasn't finished initializing yet. Not a fabricated "we support 13 languages" claim —
 * it's the same free machine-translation layer many sites use.
 *
 * Flags are rendered as real flag images (flagcdn.com) rather than Unicode flag emoji — Windows
 * doesn't render flag emoji as actual flags (it shows the two-letter country code instead), so
 * emoji flags looked broken there.
 */
const LANGUAGES = [
  { code: "en", label: "English", country: "us" },
  { code: "tr", label: "Türkçe", country: "tr" },
  { code: "fr", label: "Français", country: "fr" },
  { code: "es", label: "Español", country: "es" },
  { code: "de", label: "Deutsch", country: "de" },
  { code: "it", label: "Italiano", country: "it" },
  { code: "ru", label: "Русский", country: "ru" },
  { code: "zh-CN", label: "中文", country: "cn" },
  { code: "ja", label: "日本語", country: "jp" },
  { code: "pt", label: "Português", country: "pt" },
  { code: "nl", label: "Nederlands", country: "nl" },
  { code: "hi", label: "हिन्दी", country: "in" },
  { code: "th", label: "ไทย", country: "th" },
] as const;

function Flag({ country, className }: { country: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/24x18/${country}.png`}
      srcSet={`https://flagcdn.com/48x36/${country}.png 2x`}
      alt=""
      width={20}
      height={15}
      className={`rounded-[2px] object-cover shrink-0 ${className ?? ""}`}
    />
  );
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

// googtrans cookie format is "/en/tr" (source lang / target lang).
function currentLangCode(): string {
  const raw = getCookie("googtrans");
  if (!raw) return "en";
  const parts = raw.split("/").filter(Boolean);
  return parts[1] || "en";
}

function persistCookie(code: string) {
  const host = window.location.hostname;
  /* eslint-disable react-hooks/immutability -- document.cookie write is an intentional side effect */
  if (code === "en") {
    document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = `googtrans=; domain=.${host}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  } else {
    document.cookie = `googtrans=/en/${code}; path=/`;
    document.cookie = `googtrans=/en/${code}; domain=.${host}; path=/`;
  }
  /* eslint-enable react-hooks/immutability */
}

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("en");
  const [hydrated, setHydrated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(currentLangCode());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function applyToWidget(code: string, attemptsLeft: number) {
    const select = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
    if (select) {
      select.value = code === "en" ? "" : code;
      select.dispatchEvent(new Event("change"));
      return;
    }
    // The Google widget can still be loading the first time someone opens the dropdown —
    // retry briefly before giving up and falling back to a full reload.
    if (attemptsLeft > 0) {
      setTimeout(() => applyToWidget(code, attemptsLeft - 1), 300);
    } else {
      window.location.reload();
    }
  }

  function selectLanguage(code: string) {
    setOpen(false);
    setCurrent(code);
    persistCookie(code);
    applyToWidget(code, 8);
  }

  const active = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative shrink-0 notranslate" translate="no">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change language"
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-white/18 hover:bg-white/28"
      >
        {hydrated ? <Flag country={active.country} /> : <span className="w-5 h-[15px]" />}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 max-h-80 overflow-y-auto rounded-xl bg-white shadow-lg border border-[var(--border)] py-1.5 z-50">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => selectLanguage(l.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left hover:bg-[var(--bg)] ${
                l.code === current ? "font-bold text-[var(--accent-dark)]" : "text-[var(--text)]"
              }`}
            >
              <Flag country={l.country} />
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
