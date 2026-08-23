"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/Logo";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/payouts", label: "Payouts" },
];

export default function AdminShell({
  username,
  pendingContentCount = 0,
  children,
}: {
  username: string;
  pendingContentCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <aside className="w-[230px] min-w-[230px] min-h-screen border-r border-[var(--border)] bg-[var(--surface)] flex flex-col p-3.5 gap-6 sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-2 px-2 py-1">
          <LogoMark size={26} />
          <div>
            <div className="font-display text-[15px] font-bold">
              Leaked<span className="text-[var(--accent)]">Fap</span>
            </div>
            <div className="text-[10.5px] text-[var(--text-faint)] tracking-wide">ADMIN PANEL</div>
          </div>
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-2.5 py-2 rounded-[10px] text-[13.5px] font-semibold ${active ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]" : "text-[var(--text-muted)] hover:bg-[var(--bg)]"}`}
              >
                <span className="flex-1">{item.label}</span>
                {item.href === "/admin/content" && pendingContentCount > 0 && (
                  <span className="ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--warn)] text-white text-[10.5px] font-bold flex items-center justify-center">
                    {pendingContentCount}
                  </span>
                )}
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
            <div className="text-[10.5px] text-[var(--text-faint)] font-normal">Owner</div>
          </div>
          <Link href="/" className="ml-auto text-[11px] text-[var(--text-muted)] font-semibold">Back to Site</Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-8">{children}</main>
    </div>
  );
}
