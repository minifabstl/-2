"use client";

import { useState } from "react";

type Post = { id: string; type: string; title: string; status: "pending" | "live" | "flagged" | "removed"; viewsLabel: string; earnLabel: string };

const POST_STATUS_LABEL: Record<Post["status"], string> = {
  pending: "Onay Bekliyor",
  live: "Yayında",
  flagged: "İşaretli",
  removed: "Kaldırıldı",
};
type Payout = { id: string; date: string; amountLabel: string; status: string };

export default function ProfileView({
  user,
  stats,
  posts,
  payouts,
  justUploaded,
}: {
  user: { username: string; bitcoinAddress: string | null };
  stats: { totalPosts: number; totalViews: number; totalViewsLabel: string; totalEarnedLabel: string; availableLabel: string };
  posts: Post[];
  payouts: Payout[];
  justUploaded?: boolean;
}) {
  const [tab, setTab] = useState<"posts" | "earnings">("posts");
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
    setRequestMsg(res.ok ? `Ödeme talebin alındı: ${data.amountUsd?.toFixed(2)}$` : data.error);
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
    <div className="p-9 pb-16 max-w-[1100px]">
      {justUploaded && (
        <div className="flex items-center gap-2.5 mb-6 px-4 py-3 rounded-[10px]" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] shrink-0" />
          <span className="text-[12.5px] font-semibold">
            Paylaşımın alındı! Yönetici onayından geçtikten sonra herkese açık akışta görünecek — aşağıdan durumunu takip edebilirsin.
          </span>
        </div>
      )}
      <div className="flex items-center gap-5">
        <div className="w-[76px] h-[76px] rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-2xl font-bold font-display">
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="font-display text-[22px] font-bold">@{user.username}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mt-[26px]">
        <StatCard label="Toplam Gönderi" value={String(stats.totalPosts)} />
        <StatCard label="Toplam İzlenme" value={stats.totalViewsLabel} />
        <StatCard label="Toplam Kazanç" value={stats.totalEarnedLabel} tone="ok" />
        <StatCard label="Talep Edilebilir" value={stats.availableLabel} tone="btc" />
      </div>

      <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-80 mt-7">
        <button onClick={() => setTab("posts")} className={`flex-1 py-2.5 rounded-[9px] text-[13.5px] font-semibold ${tab === "posts" ? "bg-white text-[var(--text)] shadow-sm" : "text-[var(--text-muted)]"}`}>
          Gönderilerim
        </button>
        <button onClick={() => setTab("earnings")} className={`flex-1 py-2.5 rounded-[9px] text-[13.5px] font-semibold ${tab === "earnings" ? "bg-white text-[var(--text)] shadow-sm" : "text-[var(--text-muted)]"}`}>
          Kazanç &amp; Ödeme
        </button>
      </div>

      {tab === "posts" && (
        <div className="grid grid-cols-5 gap-3.5 mt-5">
          {posts.length === 0 && <div className="text-sm text-[var(--text-muted)] col-span-5">Henüz bir paylaşımın yok.</div>}
          {posts.map((p) => (
            <div key={p.id} className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]">
              <div className="h-[110px] relative" style={{ background: "linear-gradient(135deg, oklch(0.86 0.06 25), oklch(0.94 0.03 25))" }}>
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
                <div className="text-[11px] text-[var(--text-muted)]">{p.status === "pending" ? "Onaylanınca sayılmaya başlar" : p.viewsLabel}</div>
                <div className="text-xs font-semibold text-[var(--ok)] mt-0.5">+{p.earnLabel}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "earnings" && (
        <div className="flex gap-5 mt-[22px] items-start">
          <div className="flex-1 border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
            <div className="px-[18px] py-4 border-b border-[var(--border)] font-display text-sm font-bold">Ödeme Geçmişi</div>
            {payouts.length === 0 && <div className="px-[18px] py-4 text-sm text-[var(--text-muted)]">Henüz ödeme talebin olmadı.</div>}
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center px-[18px] py-3 text-[12.5px] border-b border-[var(--border-soft)]">
                <div className="w-28 text-[var(--text-muted)]">{p.date}</div>
                <div className="flex-1 font-semibold">{p.amountLabel}</div>
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    background: p.status === "paid" ? "var(--ok-soft)" : "var(--warn-soft)",
                    color: p.status === "paid" ? "var(--ok)" : "var(--warn)",
                  }}
                >
                  {p.status === "paid" ? "Ödendi" : "Beklemede"}
                </span>
              </div>
            ))}
          </div>

          <div className="w-[300px] border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-[18px] flex flex-col gap-3.5">
            <div className="font-display text-sm font-bold">Bitcoin Cüzdanı</div>
            <div className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
              Ödeme talep ettiğinde kazancın bu adrese gönderilir.
            </div>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="bc1q…"
              className="border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-[11.5px] outline-none"
            />
            <button onClick={saveAddress} disabled={savingAddress} className="py-2.5 rounded-[9px] border border-[var(--border)] text-[12.5px] font-semibold disabled:opacity-60">
              {savingAddress ? "Kaydediliyor…" : "Adresi Kaydet"}
            </button>
            <div className="h-px bg-[var(--border-soft)] my-0.5" />
            <button onClick={requestPayout} disabled={requesting} className="py-3 rounded-[10px] bg-[var(--btc)] text-white text-[13px] font-bold disabled:opacity-60">
              {requesting ? "Gönderiliyor…" : "Bitcoin ile Ödeme Al"}
            </button>
            {requestMsg && <div className="text-[11.5px] text-[var(--text-muted)]">{requestMsg}</div>}
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
