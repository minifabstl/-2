"use client";

import { useState } from "react";

type Item = {
  id: string;
  type: "video" | "photo";
  title: string;
  category: string | null;
  status: "live" | "flagged" | "removed";
  viewsLabel: string;
  username: string;
  createdAt: string;
};

const STATUS_LABEL: Record<Item["status"], string> = {
  live: "Yayında",
  flagged: "İşaretli",
  removed: "Kaldırıldı",
};

export default function AdminContentTable({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Item["status"]>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleRemove(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/content/${id}/remove`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) return;
    const data = await res.json();
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: data.status } : it)));
  }

  const filtered = items.filter((it) => {
    const matchesQuery =
      it.title.toLowerCase().includes(query.toLowerCase()) || it.username.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || it.status === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Başlık veya kullanıcı ara"
          className="border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[12.5px] outline-none w-72"
        />
        <div className="flex gap-1">
          {(["all", "live", "flagged", "removed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-[10px] text-[12px] font-semibold ${
                filter === f ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]" : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
              }`}
            >
              {f === "all" ? "Tümü" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
        <div className="flex px-[18px] py-3 text-[11px] font-bold text-[var(--text-faint)] bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="flex-1">BAŞLIK</div>
          <div className="w-32">TÜR</div>
          <div className="w-36">YÜKLEYEN</div>
          <div className="w-28">KATEGORİ</div>
          <div className="w-24">İZLENME</div>
          <div className="w-24">TARİH</div>
          <div className="w-28">DURUM</div>
          <div className="w-36">AKSİYON</div>
        </div>

        {filtered.length === 0 && (
          <div className="px-[18px] py-8 text-center text-[12.5px] text-[var(--text-muted)]">Gösterilecek içerik yok.</div>
        )}

        {filtered.map((it) => (
          <div key={it.id} className="flex items-center px-[18px] py-2.5 text-[12.5px] border-b border-[var(--border-soft)]">
            <div className="flex-1 font-semibold truncate pr-2">{it.title}</div>
            <div className="w-32 text-[var(--text-muted)]">{it.type === "video" ? "Video" : "Fotoğraf"}</div>
            <div className="w-36 text-[var(--text-muted)]">@{it.username}</div>
            <div className="w-28 text-[var(--text-muted)]">{it.category ?? "—"}</div>
            <div className="w-24">{it.viewsLabel}</div>
            <div className="w-24 text-[var(--text-muted)]">{it.createdAt}</div>
            <div className="w-28">
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: it.status === "live" ? "var(--ok-soft)" : it.status === "flagged" ? "var(--accent-soft)" : "var(--danger-soft)",
                  color: it.status === "live" ? "var(--ok)" : it.status === "flagged" ? "var(--accent-dark)" : "var(--danger)",
                }}
              >
                {STATUS_LABEL[it.status]}
              </span>
            </div>
            <div className="w-36">
              <button
                onClick={() => toggleRemove(it.id)}
                disabled={busyId === it.id}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold disabled:opacity-60"
                style={{ color: it.status === "removed" ? "var(--ok)" : "var(--danger)" }}
              >
                {busyId === it.id ? "İşleniyor…" : it.status === "removed" ? "Geri Yükle" : "Kaldır"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
