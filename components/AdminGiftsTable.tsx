"use client";

import { useState } from "react";

type Item = {
  id: string;
  username: string;
  email: string;
  reachedDate: string;
  sent: boolean;
  sentDate: string | null;
};

export default function AdminGiftsTable({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleSent(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/users/${id}/gift-sent`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, sent: !!data.giftSentAt, sentDate: data.giftSentAt ? new Date(data.giftSentAt).toLocaleDateString("en-US") : null } : it)));
    }
    setBusyId(null);
  }

  if (items.length === 0) {
    return (
      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-8 text-center text-[13px] text-[var(--text-muted)]">
        No one has reached the gift milestone yet.
      </div>
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
      <div className="flex px-[18px] py-3 text-[11px] font-bold text-[var(--text-faint)] bg-[var(--bg)] border-b border-[var(--border)]">
        <div className="w-52">USER</div>
        <div className="flex-1">EMAIL</div>
        <div className="w-28">REACHED</div>
        <div className="w-32">STATUS</div>
        <div className="w-40">ACTION</div>
      </div>
      {items.map((it) => (
        <div key={it.id} className="flex items-center px-[18px] py-2.5 text-[12.5px] border-b border-[var(--border-soft)] last:border-b-0">
          <div className="w-52 font-semibold">@{it.username}</div>
          <div className="flex-1 text-[var(--text-muted)] truncate">{it.email}</div>
          <div className="w-28 text-[var(--text-muted)]">{it.reachedDate}</div>
          <div className="w-32">
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{
                background: it.sent ? "var(--ok-soft)" : "var(--warn-soft)",
                color: it.sent ? "var(--ok)" : "var(--warn)",
              }}
            >
              {it.sent ? `Sent · ${it.sentDate}` : "Pending"}
            </span>
          </div>
          <div className="w-40">
            <button
              onClick={() => toggleSent(it.id)}
              disabled={busyId === it.id}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold disabled:opacity-60"
              style={{ color: it.sent ? "var(--text-muted)" : "var(--accent-dark)" }}
            >
              {busyId === it.id ? "Saving…" : it.sent ? "Undo" : "Mark Gift Sent"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
