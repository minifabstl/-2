"use client";

import { useState } from "react";

type Row = {
  id: string;
  username: string;
  email: string;
  joined: string;
  posts: number;
  views: string;
  earnings: string;
  status: "active" | "suspended";
  role: "user" | "admin";
};

export default function AdminUsersTable({ initialUsers }: { initialUsers: Row[] }) {
  const [rows, setRows] = useState(initialUsers);
  const [resetTarget, setResetTarget] = useState<Row | null>(null);
  const [resetMsg, setResetMsg] = useState("");
  const [resetting, setResetting] = useState(false);
  const [query, setQuery] = useState("");

  async function toggleSuspend(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: r.status === "active" ? "suspended" : "active" } : r)));
    await fetch(`/api/admin/users/${id}/suspend`, { method: "POST" });
  }

  async function confirmReset() {
    if (!resetTarget) return;
    setResetting(true);
    const res = await fetch(`/api/admin/users/${resetTarget.id}/reset-password`, { method: "POST" });
    const data = await res.json();
    setResetting(false);
    setResetMsg(res.ok ? data.message : data.error);
    setTimeout(() => {
      setResetTarget(null);
      setResetMsg("");
    }, 2200);
  }

  const filtered = rows.filter(
    (r) => r.username.toLowerCase().includes(query.toLowerCase()) || r.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username or email"
        className="border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[12.5px] outline-none w-72 mb-4"
      />

      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
        <div className="flex px-[18px] py-3 text-[11px] font-bold text-[var(--text-faint)] bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="w-52">USER</div>
          <div className="w-48">EMAIL</div>
          <div className="w-24">JOINED</div>
          <div className="w-20">POSTS</div>
          <div className="w-24">VIEWS</div>
          <div className="w-24">EARNINGS</div>
          <div className="w-24">STATUS</div>
          <div className="flex-1">ACTIONS</div>
        </div>
        {filtered.map((u) => (
          <div key={u.id} className="flex items-center px-[18px] py-2.5 text-[12.5px] border-b border-[var(--border-soft)]">
            <div className="w-52 flex items-center gap-2.5">
              <div className="w-[26px] h-[26px] rounded-full bg-[var(--accent-soft)] text-[var(--accent-dark)] text-[10.5px] font-bold flex items-center justify-center font-display">
                {u.username.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-semibold">@{u.username}</span>
              {u.role === "admin" && <span className="text-[10px] font-bold text-[var(--accent)]">ADMIN</span>}
            </div>
            <div className="w-48 text-[var(--text-muted)] truncate">{u.email}</div>
            <div className="w-24 text-[var(--text-muted)]">{u.joined}</div>
            <div className="w-20">{u.posts}</div>
            <div className="w-24">{u.views}</div>
            <div className="w-24 font-semibold text-[var(--ok)]">{u.earnings}</div>
            <div className="w-24">
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: u.status === "active" ? "var(--ok-soft)" : "var(--danger-soft)",
                  color: u.status === "active" ? "var(--ok)" : "var(--danger)",
                }}
              >
                {u.status === "active" ? "Active" : "Suspended"}
              </span>
            </div>
            <div className="flex-1 flex gap-1.5">
              <button
                onClick={() => setResetTarget(u)}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold"
              >
                Reset Password
              </button>
              <button
                onClick={() => toggleSuspend(u.id)}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold"
                style={{ color: u.status === "active" ? "var(--danger)" : "var(--ok)" }}
              >
                {u.status === "active" ? "Suspend" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-start mt-3.5 p-3 rounded-[10px] bg-[var(--accent-soft)]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="2" className="mt-0.5 shrink-0">
          <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" />
        </svg>
        <span className="text-[11.5px] leading-relaxed">
          For security reasons, user passwords are never stored or displayed in plain text.
          &quot;Reset Password&quot; sends the user a secure reset link.
        </span>
      </div>

      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => !resetting && setResetTarget(null)}>
          <div className="w-[380px] bg-[var(--surface)] rounded-2xl p-[22px] flex flex-col gap-3.5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-[38px] h-[38px] rounded-[10px] bg-[var(--accent-soft)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="2">
                <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" />
              </svg>
            </div>
            <div className="font-display text-[15.5px] font-bold">Reset password for @{resetTarget.username}?</div>
            <div className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
              The user&apos;s current password cannot be viewed or stored. If you confirm, a secure reset link will be sent
              to their registered email address; only they can set a new password.
            </div>
            {resetMsg && <div className="text-[12px] text-[var(--ok)] font-semibold">{resetMsg}</div>}
            {!resetMsg && (
              <div className="flex gap-2 mt-1">
                <button onClick={() => setResetTarget(null)} className="flex-1 py-2.5 rounded-[10px] border border-[var(--border)] text-[12.5px] font-semibold">
                  Cancel
                </button>
                <button onClick={confirmReset} disabled={resetting} className="flex-1 py-2.5 rounded-[10px] bg-[var(--accent)] text-white text-[12.5px] font-semibold disabled:opacity-60">
                  {resetting ? "Sending…" : "Send Reset Link"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
