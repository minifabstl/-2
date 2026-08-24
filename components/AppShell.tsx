"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type { SafeUser } from "@/lib/auth";
import LoginPromptModal from "@/components/LoginPromptModal";
import Logo from "@/components/Logo";
import ProfileMenu from "@/components/ProfileMenu";
import PromoBanner from "@/components/PromoBanner";
import AdPopup from "@/components/AdPopup";
import TimeTracker from "@/components/TimeTracker";
import SidebarSearch from "@/components/SidebarSearch";
import { GIFT_MILESTONE_HOURS, GIFT_REWARD_LABEL, formatHoursOnSite } from "@/lib/gift";

const NAV = [
  { href: "/", label: "Home", locked: false, icon: "home" },
  { href: "/explore", label: "Explore", locked: false, icon: "compass" },
  { href: "/upload", label: "My Uploads", locked: true, icon: "upload" },
  { href: "/profile", label: "My Earnings", locked: true, icon: "wallet" },
  { href: "/creator-program", label: "Creator Program", locked: false, icon: "star" },
] as const;

export default function AppShell({
  user,
  avatarUrl,
  hasUploaded,
  trending,
  children,
}: {
  user: SafeUser | null;
  avatarUrl?: string | null;
  hasUploaded?: boolean;
  trending?: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [promptOpen, setPromptOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function goToUpload() {
    if (user) router.push("/upload");
    else setPromptOpen(true);
  }

  const isAuthPage = pathname === "/login" || pathname === "/reset-password" || pathname.startsWith("/admin");

  if (isAuthPage) {
    // The login/signup screen uses its own full-page layout (no sidebar).
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "linear-gradient(120deg, #fce4ee, #fdf3f7 45%, #ffffff 80%)" }}>
      {user && <TimeTracker />}
      <AdPopup key={pathname} />
      <PromoBanner canDismiss={!!hasUploaded} />
      <div className="flex flex-1 min-h-0">
      <aside className="w-60 min-w-60 border-r border-[var(--border)] flex flex-col gap-6 p-3.5 sticky top-0 h-screen overflow-y-auto">
        <Link href="/" className="flex flex-col items-center justify-center px-2 pt-1 pb-3 gap-2">
          <Logo size={32} />
          <span className="w-24 h-[3px] rounded-full" style={{ background: "var(--accent)" }} />
        </Link>

        <SidebarSearch trending={trending ?? []} />

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const locked = item.locked && !user;
            const isCreatorProgram = item.href === "/creator-program";
            const isEarnings = item.href === "/profile";
            return (
              <button
                key={item.href}
                onClick={() => (locked ? setPromptOpen(true) : router.push(item.href))}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-sm text-left ${
                  isCreatorProgram
                    ? "font-semibold"
                    : active
                      ? "bg-[var(--accent-soft)] text-[var(--accent-dark)] font-semibold"
                      : "text-[var(--text)] font-medium hover:bg-[var(--bg)]"
                }`}
                style={isCreatorProgram ? { background: "rgba(219,26,109,0.12)", color: "#db1a6d" } : undefined}
              >
                <NavIcon name={item.icon} />
                {item.label}
                {isEarnings && (
                  <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="#eab308" stroke="#ca8a04" strokeWidth="1">
                    <circle cx="12" cy="12" r="9" />
                    <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#78350f" stroke="none">$</text>
                  </svg>
                )}
                {locked && (
                  <svg className="ml-auto text-[var(--text-faint)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2.5">
          <div
            className="p-2.5 rounded-xl flex items-center gap-2 text-white"
            style={{ background: "#00aff0" }}
          >
            <span className="text-[15px] shrink-0">📢</span>
            <span className="text-[11.5px] font-semibold leading-snug">
              You can advertise via{" "}
              <a href="mailto:LeakedFap@protonmail.com" className="underline">
                LeakedFap@protonmail.com
              </a>
            </span>
          </div>
          {user && (
            <GiftCounter
              hoursOnSite={formatHoursOnSite(user.activeSeconds)}
              claimed={!!user.giftSentAt}
              reached={user.activeSeconds >= GIFT_MILESTONE_HOURS * 3600}
            />
          )}
          <GiftBox hoursOnSite={user ? formatHoursOnSite(user.activeSeconds) : null} claimed={!!user?.giftSentAt} />
          <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] flex flex-col gap-1.5">
            <div className="text-[12.5px] font-semibold">1000 views = $0.20</div>
            <div className="text-[11.5px] text-[var(--text-muted)] leading-snug">
              Earn as you share, get paid straight to your wallet. Get a $3 bonus on your first approved upload, plus $0.10 per upload after that.
            </div>
          </div>
          <div className="flex flex-wrap gap-x-2.5 gap-y-1 px-1 text-[10.5px] text-[var(--text-faint)]">
            <Link href="/sss" className="hover:text-[var(--text-muted)]">FAQ</Link>
            <Link href="/privacy" className="hover:text-[var(--text-muted)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-muted)]">Terms</Link>
          </div>
          <div className="px-1 text-[10.5px] text-[var(--text-faint)] leading-snug">
            For advertising inquiries, contact us at{" "}
            <a href="mailto:LeakedFap@protonmail.com" className="hover:text-[var(--text-muted)] underline">
              LeakedFap@protonmail.com
            </a>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 min-h-16 flex items-center gap-4 px-7" style={{ background: "#00aff0" }}>
          <Link href="/creator-program" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[16px] shrink-0 group-hover:bg-white/30">🎁</span>
            <span className="hidden md:flex flex-col leading-tight">
              <span className="text-white font-display font-bold text-[13.5px]">{GIFT_MILESTONE_HOURS} hours = {GIFT_REWARD_LABEL}</span>
              <span className="text-white/80 text-[11px]">Spend {GIFT_MILESTONE_HOURS} hours on the site and we&apos;ll gift it to you — free.</span>
            </span>
          </Link>
          <div className="flex-1" />

          <form
            onSubmit={submitSearch}
            className="hidden sm:flex items-center gap-2 bg-white/18 focus-within:bg-white/28 rounded-full px-3.5 py-2 w-[210px] shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" className="shrink-0 opacity-90">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, creators…"
              className="bg-transparent outline-none text-white placeholder-white/75 text-[12.5px] flex-1 min-w-0"
            />
          </form>

          <button
            onClick={goToUpload}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-[13px] text-white shrink-0"
            style={{ background: "#db1a6d" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            Add
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {user.role === "admin" && (
                <Link href="/admin" className="text-[13px] font-semibold text-white/80 hover:text-white">
                  Admin Panel
                </Link>
              )}
              <ProfileMenu user={user} avatarUrl={avatarUrl ?? null} />
            </div>
          ) : (
            <Link href="/login" className="px-4 py-2.5 rounded-[10px] bg-white text-[#00aff0] text-[13.5px] font-bold shrink-0">
              Log In
            </Link>
          )}
        </header>

        {!user && (
          <div className="flex items-center gap-3 px-7 py-2.5 bg-[var(--accent-soft)] border-b border-[var(--border)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="2" className="shrink-0">
              <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" />
            </svg>
            <span className="text-[13px] flex-1">Anyone can watch videos and photos — sign up for free to like and comment.</span>
            <Link href="/login" className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[12.5px] font-semibold">Sign Up</Link>
          </div>
        )}

        <main className="flex-1 min-w-0">{children}</main>
      </div>
      </div>

      <LoginPromptModal open={promptOpen} onClose={() => setPromptOpen(false)} title="Sign up to use this feature" />
    </div>
  );
}

function GiftCounter({ hoursOnSite, claimed, reached }: { hoursOnSite: string; claimed: boolean; reached: boolean }) {
  const pct = Math.min(100, (Number(hoursOnSite) / GIFT_MILESTONE_HOURS) * 100);
  const statusLabel = claimed ? "Gift sent — enjoy! 🎉" : reached ? "Milestone reached! 🎉" : `${hoursOnSite}h / ${GIFT_MILESTONE_HOURS}h`;
  return (
    <div
      className="p-2.5 rounded-xl flex items-center gap-2.5"
      style={{ background: reached || claimed ? "rgba(219,26,109,0.16)" : "var(--bg)", border: "1px solid var(--border)" }}
    >
      <span className="text-[16px] shrink-0">⏱️</span>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 rounded-full bg-white/70 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#db1a6d" }} />
        </div>
        <div className="text-[11px] font-bold mt-1" style={{ color: "#db1a6d" }}>
          {statusLabel}
        </div>
      </div>
    </div>
  );
}

function GiftBox({ hoursOnSite, claimed }: { hoursOnSite: string | null; claimed: boolean }) {
  return (
    <div className="p-2.5 rounded-xl flex flex-col gap-1.5" style={{ background: "rgba(219,26,109,0.1)" }}>
      <div className="text-[12.5px] font-semibold">🎁 {GIFT_MILESTONE_HOURS} hours = {GIFT_REWARD_LABEL}</div>
      <div className="text-[11.5px] text-[var(--text-muted)] leading-snug">
        Spend {GIFT_MILESTONE_HOURS} hours on the site and we&apos;ll gift you a real, admin-funded {GIFT_REWARD_LABEL} — free.
        {hoursOnSite && !claimed && ` You're at ${hoursOnSite}h so far.`}
      </div>
    </div>
  );
}

function NavIcon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  switch (name) {
    case "home":
      return <svg {...common}><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>;
    case "compass":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M15 9l-2 6-6 2 2-6 6-2z" /></svg>;
    case "upload":
      return <svg {...common}><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8M12 18v3" /></svg>;
    case "wallet":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1 3 2.3c0 3-6 1.5-6 4.5 0 1.4 1.3 2.4 3 2.4s3-1 3-2.4" /></svg>;
    case "star":
      return <svg {...common}><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3-4.8-4.3 6.4-.6L12 3z" /></svg>;
    default:
      return null;
  }
}
