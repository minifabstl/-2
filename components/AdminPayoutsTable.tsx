"use client";

import { useState } from "react";

type Item = {
  id: string;
  amountLabel: string;
  bitcoinAddress: string;
  status: "pending" | "paid";
  username: string;
  createdAt: string;
  paidAt: string | null;
};

export default function AdminPayoutsTable({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<"all" | Item["status"]>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function markPaid(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/payouts/${id}/mark-paid`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) return;
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: "paid", paidAt: new Date().toLocaleDateString("en-US") } : it))
    );
  }

  function copyAddress(id: string, address: string) {
    navigator.clipboard?.writeText(address).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const filtered = items.filter((it) => filter === "all" || it.status === filter);

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {(["all", "pending", "paid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-[10px] text-[12px] font-semibold ${
              filter === f ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]" : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
            }`}
          >
            {f === "all" ? "All" : f === "pending" ? "Pending" : "Paid"}
          </button>
        ))}
      </div>

      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
        <div className="flex px-[18px] py-3 text-[11px] font-bold text-[var(--text-faint)] bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="w-36">USER</div>
          <div className="w-28">AMOUNT</div>
          <div className="flex-1">BITCOIN ADDRESS</div>
          <div className="w-24">REQUESTED</div>
          <div className="w-24">STATUS</div>
          <div className="w-40">ACTION</div>
        </div>

        {filtered.length === 0 && (
          <div className="px-[18px] py-8 text-center text-[12.5px] text-[var(--text-muted)]">No payout requests.</div>
        )}

        {filtered.map((it) => (
          <div key={it.id} className="flex items-center px-[18px] py-2.5 text-[12.5px] border-b border-[var(--border-soft)]">
            <div className="w-36 font-semibold">@{it.username}</div>
            <div className="w-28 font-semibold text-[var(--ok)]">{it.amountLabel}</div>
            <div className="flex-1 pr-3">
              <button
                onClick={() => copyAddress(it.id, it.bitcoinAddress)}
                className="font-mono text-[11.5px] text-[var(--text-muted)] hover:text-[var(--text)] truncate max-w-full text-left"
                title="Click to copy"
              >
                {copiedId === it.id ? "Copied ✓" : it.bitcoinAddress}
              </button>
            </div>
            <div className="w-24 text-[var(--text-muted)]">{it.createdAt}</div>
            <div className="w-24">
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: it.status === "paid" ? "var(--ok-soft)" : "var(--accent-soft)",
                  color: it.status === "paid" ? "var(--ok)" : "var(--accent-dark)",
                }}
              >
                {it.status === "paid" ? "Paid" : "Pending"}
              </span>
            </div>
            <div className="w-40">
              {it.status === "pending" ? (
                <button
                  onClick={() => markPaid(it.id)}
                  disabled={busyId === it.id}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[11px] font-semibold disabled:opacity-60"
                >
                  {busyId === it.id ? "Processing…" : "Sent BTC, Mark Paid"}
                </button>
              ) : (
                <span className="text-[11px] text-[var(--text-faint)]">{it.paidAt ? `on ${it.paidAt}` : "—"}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-start mt-3.5 p-3 rounded-[10px] bg-[var(--accent-soft)]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="2" className="mt-0.5 shrink-0">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v8M9 10c0-1.1 1.3-2 3-2s3 .8 3 1.9c0 2.4-6 1.2-6 3.6 0 1.1 1.3 1.9 3 1.9s3-.8 3-1.9" />
        </svg>
        <span className="text-[11.5px] leading-relaxed">
          This panel does not send automatic Bitcoin transfers. After you send the payment to the address from your own
          wallet or exchange, click the &quot;Sent BTC, Mark Paid&quot; button.
        </span>
      </div>
    </div>
  );
}
