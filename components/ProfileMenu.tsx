"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SafeUser } from "@/lib/auth";

export default function ProfileMenu({ user }: { user: SafeUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [earnings, setEarnings] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open || earnings !== null) return;
    fetch("/api/profile/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setEarnings(data.totalEarnedLabel))
      .catch(() => {});
  }, [open, earnings]);

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  }

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-transparent hover:border-[var(--border)]"
      >
        <span className="w-[34px] h-[34px] rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[13px] font-bold font-display shrink-0">
          {initials}
        </span>
        <span className="text-[13px] font-semibold hidden sm:inline">{user.username}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-72 border border-[var(--border)] rounded-2xl bg-[var(--surface)] shadow-lg overflow-hidden z-30">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border-soft)]">
            <span className="w-11 h-11 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[15px] font-bold font-display shrink-0">
              {initials}
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold truncate">{user.username}</div>
              <div className="text-[12px] text-[var(--text-muted)] truncate">{user.email}</div>
            </div>
          </div>

          <nav className="py-1.5">
            <MenuLink href="/profile" onNavigate={() => setOpen(false)}>
              Profile
            </MenuLink>
            <MenuLink href="/profile?tab=earnings" onNavigate={() => setOpen(false)}>
              <span className="flex-1">Your Earnings</span>
              <span className="text-[12.5px] font-semibold text-[var(--ok)]">{earnings ?? "…"}</span>
            </MenuLink>
            <MenuLink href="/profile/preferences" onNavigate={() => setOpen(false)}>
              Preferences
            </MenuLink>
            <MenuLink href="/profile/edit" onNavigate={() => setOpen(false)}>
              Edit Profile
            </MenuLink>
          </nav>

          <div className="border-t border-[var(--border-soft)] py-1.5">
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-4 py-2.5 text-[13px] font-medium text-[var(--danger)] hover:bg-[var(--bg)]"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, onNavigate, children }: { href: string; onNavigate: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onNavigate} className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[var(--text)] hover:bg-[var(--bg)]">
      {children}
    </Link>
  );
}
