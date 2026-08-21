"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Genel Bakış" },
  { href: "/admin/users", label: "Kullanıcılar" },
  { href: "/admin/content", label: "İçerikler" },
  { href: "/admin/payouts", label: "Ödemeler" },
];

export default function AdminShell({ username, children }: { username: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <aside className="w-[230px] min-w-[230px] min-h-screen border-r border-[var(--border)] bg-[var(--surface)] flex flex-col p-3.5 gap-6 sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-2 px-2 py-1">
          <span className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 3l14 9-14 9V3z" fill="white" /></svg>
          </span>
          <div>
            <div className="font-display text-[15px] font-bold">Akış</div>
            <div className="text-[10.5px] text-[var(--text-faint)] tracking-wide">YÖNETİM PANELİ</div>
          </div>
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-2 rounded-[10px] text-[13.5px] font-semibold ${active ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]" : "text-[var(--text-muted)] hover:bg-[var(--bg)]"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg)]">
          <div className="w-[30px] h-[30px] rounded-full bg-[var(--accent)] flex items-center justify-center text-[11px] font-bold text-white font-display">
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-xs font-semibold">
            @{username}
            <div className="text-[10.5px] text-[var(--text-faint)] font-normal">Sahip</div>
          </div>
          <Link href="/" className="ml-auto text-[11px] text-[var(--text-muted)] font-semibold">Siteye Dön</Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-8">{children}</main>
    </div>
  );
}
