"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type { SafeUser } from "@/lib/auth";
import LoginPromptModal from "@/components/LoginPromptModal";
import Logo from "@/components/Logo";
import ProfileMenu from "@/components/ProfileMenu";

const NAV = [
  { href: "/", label: "Home", locked: false, icon: "home" },
  { href: "/explore", label: "Explore", locked: false, icon: "compass" },
  { href: "/upload", label: "My Uploads", locked: true, icon: "upload" },
  { href: "/profile", label: "My Earnings", locked: true, icon: "wallet" },
] as const;

const CATEGORIES = [
  { slug: "muzik", label: "Music" },
  { slug: "oyun", label: "Gaming" },
  { slug: "egitim", label: "Education" },
  { slug: "spor", label: "Sports" },
  { slug: "teknoloji", label: "Technology" },
  { slug: "komedi", label: "Comedy" },
];

export default function AppShell({ user, children }: { user: SafeUser | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [promptOpen, setPromptOpen] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/reset-password" || pathname.startsWith("/admin");

  if (isAuthPage) {
    // The login/signup screen uses its own full-page layout (no sidebar).
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <aside className="w-60 min-w-60 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col gap-6 p-3.5 sticky top-0 h-screen">
        <Link href="/" className="flex items-center justify-center px-2 py-3">
          <Logo size={26} />
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const locked = item.locked && !user;
            return (
              <button
                key={item.href}
                onClick={() => (locked ? setPromptOpen(true) : router.push(item.href))}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-sm text-left ${active ? "bg-[var(--accent-soft)] text-[var(--accent-dark)] font-semibold" : "text-[var(--text)] font-medium hover:bg-[var(--bg)]"}`}
              >
                <NavIcon name={item.icon} />
                {item.label}
                {locked && (
                  <svg className="ml-auto text-[var(--text-faint)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-0.5">
          <div className="text-[11px] font-semibold tracking-wide text-[var(--text-faint)] px-2.5 pt-2 pb-1">CATEGORIES</div>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/explore?kategori=${c.slug}`} className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-sm text-[var(--text)] hover:bg-[var(--bg)]">
              {c.label}
            </Link>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2.5">
          <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] flex flex-col gap-1.5">
            <div className="text-[12.5px] font-semibold">1000 views = $0.20</div>
            <div className="text-[11.5px] text-[var(--text-muted)] leading-snug">Earn as you share, get paid out in Bitcoin.</div>
          </div>
          <div className="flex flex-wrap gap-x-2.5 gap-y-1 px-1 text-[10.5px] text-[var(--text-faint)]">
            <Link href="/sss" className="hover:text-[var(--text-muted)]">FAQ</Link>
            <Link href="/privacy" className="hover:text-[var(--text-muted)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-muted)]">Terms</Link>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 min-h-16 border-b border-[var(--border)] bg-[var(--surface)] flex items-center gap-4 px-7">
          <div className="flex-1" />
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === "admin" && (
                <Link href="/admin" className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)]">
                  Admin Panel
                </Link>
              )}
              <ProfileMenu user={user} />
            </div>
          ) : (
            <Link href="/login" className="px-4 py-2.5 rounded-[10px] border border-[var(--accent)] bg-[var(--accent)] text-white text-[13.5px] font-semibold">
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

      <LoginPromptModal open={promptOpen} onClose={() => setPromptOpen(false)} title="Sign up to use this feature" />
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
    default:
      return null;
  }
}
