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
        placeholder="Kullanıcı adı veya e-posta ara"
        className="border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[12.5px] outline-none w-72 mb-4"
      />

      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
        <div className="flex px-[18px] py-3 text-[11px] font-bold text-[var(--text-faint)] bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="w-52">KULLANICI</div>
          <div className="w-48">E-POSTA</div>
          <div className="w-24">KAYIT</div>
          <div className="w-20">GÖNDERİ</div>
          <div className="w-24">İZLENME</div>
          <div className="w-24">KAZANÇ</div>
          <div className="w-24">DURUM</div>
          <div className="flex-1">AKSİYONLAR</div>
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
                {u.status === "active" ? "Aktif" : "Askıda"}
              </span>
            </div>
            <div className="flex-1 flex gap-1.5">
              <button
                onClick={() => setResetTarget(u)}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold"
              >
                Şifreyi Sıfırla
              </button>
              <button
                onClick={() => toggleSuspend(u.id)}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold"
                style={{ color: u.status === "active" ? "var(--danger)" : "var(--ok)" }}
              >
                {u.status === "active" ? "Askıya Al" : "Aktif Et"}
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
          Güvenlik nedeniyle kullanıcı şifreleri hiçbir zaman düz metin olarak saklanmaz veya görüntülenmez.
          &quot;Şifreyi Sıfırla&quot; kullanıcıya güvenli bir sıfırlama bağlantısı gönderir.
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
            <div className="font-display text-[15.5px] font-bold">@{resetTarget.username} için şifre sıfırlansın mı?</div>
            <div className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
              Kullanıcının mevcut şifresi görüntülenemez ve saklanmaz. Onaylarsan kayıtlı e-posta adresine güvenli bir
              sıfırlama bağlantısı gönderilir; şifreyi yalnızca kendisi belirleyebilir.
            </div>
            {resetMsg && <div className="text-[12px] text-[var(--ok)] font-semibold">{resetMsg}</div>}
            {!resetMsg && (
              <div className="flex gap-2 mt-1">
                <button onClick={() => setResetTarget(null)} className="flex-1 py-2.5 rounded-[10px] border border-[var(--border)] text-[12.5px] font-semibold">
                  Vazgeç
                </button>
                <button onClick={confirmReset} disabled={resetting} className="flex-1 py-2.5 rounded-[10px] bg-[var(--accent)] text-white text-[12.5px] font-semibold disabled:opacity-60">
                  {resetting ? "Gönderiliyor…" : "Sıfırlama Bağlantısı Gönder"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
