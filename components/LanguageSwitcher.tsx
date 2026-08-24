"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Real, working whole-site translation via the Google Website Translator widget (loaded once
 * in app/layout.tsx). Picking a language here sets the `googtrans` cookie Google's widget reads
 * on load, then reloads the page — Google translates every piece of text it can find in the
 * rendered DOM, including content added by client-side navigation afterward. Not a fabricated
 * "we support 13 languages" claim — it's the same free machine-translation layer many sites use.
 */
const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
] as const;

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

  function selectLanguage(code: string) {
    setOpen(false);
    const host = window.location.hostname;
    // Writing document.cookie is an intentional side effect (setting the cookie Google
    // Translate's widget reads on the next load), not component render state.
    /* eslint-disable react-hooks/immutability */
    if (code === "en") {
      document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = `googtrans=; domain=.${host}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    } else {
      document.cookie = `googtrans=/en/${code}; path=/`;
      document.cookie = `googtrans=/en/${code}; domain=.${host}; path=/`;
    }
    /* eslint-enable react-hooks/immutability */
    window.location.reload();
  }

  const active = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative shrink-0 notranslate" translate="no">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change language"
        className="flex items-center gap-1 px-2.5 py-2 rounded-full bg-white/18 hover:bg-white/28"
      >
        <span className="text-[15px] leading-none">{hydrated ? active.flag : "🇺🇸"}</span>
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
        <div className="absolute right-0 top-full mt-2 w-44 max-h-80 overflow-y-auto rounded-xl bg-white shadow-lg border border-[var(--border)] py-1.5 z-50">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => selectLanguage(l.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left hover:bg-[var(--bg)] ${
                l.code === current ? "font-bold text-[var(--accent-dark)]" : "text-[var(--text)]"
              }`}
            >
              <span className="text-[15px]">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
