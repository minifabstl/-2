"use client";

import { useState } from "react";

type Post = {
  id: string;
  type: string;
  title: string;
  status: "pending" | "live" | "flagged" | "removed";
  viewsLabel: string;
  earnLabel: string;
  thumbnailUrl: string | null;
};

const POST_STATUS_LABEL: Record<Post["status"], string> = {
  pending: "Pending Approval",
  live: "Live",
  flagged: "Flagged",
  removed: "Removed",
};
type Payout = { id: string; date: string; amountLabel: string; status: string };

export default function ProfileView({
  user,
  stats,
  posts,
  payouts,
  justUploaded,
  initialTab = "posts",
}: {
  user: { username: string; bitcoinAddress: string | null; avatarUrl: string | null };
  stats: { totalPosts: number; totalViews: number; totalViewsLabel: string; totalEarnedLabel: string; availableLabel: string };
  posts: Post[];
  payouts: Payout[];
  justUploaded?: boolean;
  initialTab?: "posts" | "earnings";
}) {
  const [tab, setTab] = useState<"posts" | "earnings">(initialTab);
  const [requesting, setRequesting] = useState(false);
  const [requestMsg, setRequestMsg] = useState("");
  const [address, setAddress] = useState(user.bitcoinAddress ?? "");
  const [savingAddress, setSavingAddress] = useState(false);

  async function requestPayout() {
    setRequesting(true);
    setRequestMsg("");
    const res = await fetch("/api/payouts/request", { method: "POST" });
    const data = await res.json();
    setRequesting(false);
    setRequestMsg(res.ok ? `Your payout request has been received: $${data.amountUsd?.toFixed(2)}` : data.error);
  }

  async function saveAddress() {
    setSavingAddress(true);
    await fetch("/api/profile/bitcoin-address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bitcoinAddress: address }),
    });
    setSavingAddress(false);
  }

  return (
    <div className="p-4 sm:p-9 pb-16 max-w-[1100px]">
      {justUploaded && (
        <div className="flex items-center gap-2.5 mb-6 px-4 py-3 rounded-[10px]" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] shrink-0" />
          <span className="text-[12.5px] font-semibold">
            Your post has been received! It will appear in the public feed once approved by an admin — you can track its status below.
          </span>
        </div>
      )}
      <div className="flex items-center gap-5">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="w-[76px] h-[76px] rounded-full object-cover" />
        ) : (
          <div className="w-[76px] h-[76px] rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-2xl font-bold font-display">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="font-display text-[22px] font-bold">@{user.username}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-[26px]">
        <StatCard label="Total Posts" value={String(stats.totalPosts)} />
        <StatCard label="Total Views" value={stats.totalViewsLabel} />
        <StatCard label="Total Earnings" value={stats.totalEarnedLabel} tone="ok" />
        <StatCard label="Available to Request" value={stats.availableLabel} tone="btc" />
      </div>

      <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-full sm:w-80 mt-7">
        <button onClick={() => setTab("posts")} className={`flex-1 py-2.5 rounded-[9px] text-[13.5px] font-semibold ${tab === "posts" ? "bg-white text-[var(--text)] shadow-sm" : "text-[var(--text-muted)]"}`}>
          My Posts
        </button>
        <button onClick={() => setTab("earnings")} className={`flex-1 py-2.5 rounded-[9px] text-[13.5px] font-semibold ${tab === "earnings" ? "bg-white text-[var(--text)] shadow-sm" : "text-[var(--text-muted)]"}`}>
          Earnings &amp; Payout
        </button>
      </div>

      {tab === "posts" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-5">
          {posts.length === 0 && <div className="text-sm text-[var(--text-muted)] col-span-2 sm:col-span-3 lg:col-span-5">You don&apos;t have any posts yet.</div>}
          {posts.map((p) => (
            <div key={p.id} className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]">
              <div className="h-[110px] relative overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.86 0.06 25), oklch(0.94 0.03 25))" }}>
                {p.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnailUrl} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
                )}
                {p.status !== "live" && (
                  <span
                    className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      background: p.status === "pending" ? "var(--warn-soft)" : p.status === "flagged" ? "var(--accent-soft)" : "var(--danger-soft)",
                      color: p.status === "pending" ? "var(--warn)" : p.status === "flagged" ? "var(--accent-dark)" : "var(--danger)",
                    }}
                  >
                    {POST_STATUS_LABEL[p.status]}
                  </span>
                )}
              </div>
              <div className="px-2.5 py-2.5">
                <div className="text-[11px] text-[var(--text-muted)]">{p.status === "pending" ? "Will start counting once approved" : p.viewsLabel}</div>
                <div className="text-xs font-semibold text-[var(--ok)] mt-0.5">+{p.earnLabel}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "earnings" && (
        <div className="mt-[22px]">
          <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
            <div className="px-[18px] py-4 border-b border-[var(--border)]">
              <div className="font-display text-sm font-bold">Earnings by Content</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Includes a $3 bonus on your first approved upload, and $0.10 for every upload after that.
              </div>
            </div>
            {posts.length === 0 && <div className="px-[18px] py-4 text-sm text-[var(--text-muted)]">You don&apos;t have any posts yet.</div>}
            {posts.length > 0 && (
              <div className="grid grid-cols-[1fr_70px_70px] sm:grid-cols-[1fr_120px_110px_110px] px-3 sm:px-[18px] py-2.5 text-[10.5px] font-semibold text-[var(--text-faint)] tracking-wide uppercase border-b border-[var(--border-soft)]">
                <div>Title</div>
                <div className="hidden sm:block">Type</div>
                <div>Views</div>
                <div>Earned</div>
              </div>
            )}
            {posts.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_70px_70px] sm:grid-cols-[1fr_120px_110px_110px] items-center px-3 sm:px-[18px] py-3 text-[12.5px] border-b border-[var(--border-soft)] last:border-b-0"
              >
                <div className="font-medium truncate pr-3">{p.title}</div>
                <div className="hidden sm:block text-[var(--text-muted)] capitalize">{p.type}</div>
                <div className="text-[var(--text-muted)] truncate">{p.status === "pending" ? "—" : p.viewsLabel}</div>
                <div className="font-semibold text-[var(--ok)] truncate">+{p.earnLabel}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-5 items-start mt-5">
          <div className="w-full lg:flex-1 border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
            <div className="px-3 sm:px-[18px] py-4 border-b border-[var(--border)] font-display text-sm font-bold">Payout History</div>
            {payouts.length === 0 && <div className="px-3 sm:px-[18px] py-4 text-sm text-[var(--text-muted)]">You haven&apos;t requested a payout yet.</div>}
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-3 sm:px-[18px] py-3 text-[12.5px] border-b border-[var(--border-soft)]">
                <div className="w-24 sm:w-28 shrink-0 text-[var(--text-muted)]">{p.date}</div>
                <div className="flex-1 font-semibold truncate">{p.amountLabel}</div>
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0"
                  style={{
                    background: p.status === "paid" ? "var(--ok-soft)" : "var(--warn-soft)",
                    color: p.status === "paid" ? "var(--ok)" : "var(--warn)",
                  }}
                >
                  {p.status === "paid" ? "Paid" : "Pending"}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full lg:w-[300px] border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-[18px] flex flex-col gap-3.5">
            <div className="font-display text-sm font-bold">Payout Wallet</div>
            <div className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
              When you request a payout, your earnings are sent to this address.
            </div>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your wallet address"
              className="border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-[11.5px] outline-none"
            />
            <button onClick={saveAddress} disabled={savingAddress} className="py-2.5 rounded-[9px] border border-[var(--border)] text-[12.5px] font-semibold disabled:opacity-60">
              {savingAddress ? "Saving…" : "Save Address"}
            </button>
            <div className="h-px bg-[var(--border-soft)] my-0.5" />
            <button onClick={requestPayout} disabled={requesting} className="py-3 rounded-[10px] bg-[var(--btc)] text-white text-[13px] font-bold disabled:opacity-60">
              {requesting ? "Sending…" : "Request Payout"}
            </button>
            {requestMsg && <div className="text-[11.5px] text-[var(--text-muted)]">{requestMsg}</div>}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "ok" | "btc" }) {
  const bg = tone === "ok" ? "var(--ok-soft)" : tone === "btc" ? "var(--btc-soft)" : "var(--surface)";
  return (
    <div className="border border-[var(--border)] rounded-2xl p-4" style={{ background: bg }}>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="font-display text-[22px] font-bold mt-1">{value}</div>
    </div>
  );
}
