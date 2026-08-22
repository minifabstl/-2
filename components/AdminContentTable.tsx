"use client";

import { useState } from "react";

type Item = {
  id: string;
  type: "video" | "photo";
  title: string;
  category: string | null;
  status: "pending" | "live" | "flagged" | "removed";
  viewsLabel: string;
  username: string;
  createdAt: string;
  mediaUrl: string;
};

const STATUS_LABEL: Record<Item["status"], string> = {
  pending: "Onay Bekliyor",
  live: "Yayında",
  flagged: "İşaretli",
  removed: "Kaldırıldı",
};

export default function AdminContentTable({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Item["status"]>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<Item | null>(null);

  async function toggleRemove(id: string, isPermanent: boolean) {
    if (isPermanent && !window.confirm("Bu içerik kalıcı olarak silinecek (dosya da bulut depodan silinir) ve geri alınamaz. Emin misin?")) {
      return;
    }
    setBusyId(id);
    const res = await fetch(`/api/admin/content/${id}/remove`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) return;
    const data = await res.json();
    if (data.status === "deleted") {
      setItems((prev) => prev.filter((it) => it.id !== id));
      setPreviewItem((p) => (p?.id === id ? null : p));
    } else {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: data.status } : it)));
    }
  }

  async function deleteForever(id: string) {
    if (!window.confirm("Bu içerik kalıcı olarak silinecek (dosya da bulut depodan silinir) ve geri alınamaz. Emin misin?")) {
      return;
    }
    setBusyId(id);
    const res = await fetch(`/api/admin/content/${id}/delete`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
    setPreviewItem((p) => (p?.id === id ? null : p));
  }

  async function approve(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/content/${id}/approve`, { method: "POST" });
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
          {(["all", "pending", "live", "flagged", "removed"] as const).map((f) => (
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
          <div className="w-14">ÖNİZLEME</div>
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
            <div className="w-14 pr-2">
              <button
                type="button"
                onClick={() => setPreviewItem(it)}
                className="w-9 h-9 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center relative shrink-0"
                title="İçeriği önizle"
              >
                {it.type === "photo" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.mediaUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={it.mediaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                )}
                {it.type === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                )}
              </button>
            </div>
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
                  background:
                    it.status === "live" ? "var(--ok-soft)" : it.status === "pending" ? "var(--warn-soft)" : it.status === "flagged" ? "var(--accent-soft)" : "var(--danger-soft)",
                  color:
                    it.status === "live" ? "var(--ok)" : it.status === "pending" ? "var(--warn)" : it.status === "flagged" ? "var(--accent-dark)" : "var(--danger)",
                }}
              >
                {STATUS_LABEL[it.status]}
              </span>
            </div>
            <div className="w-36 flex flex-wrap gap-1.5">
              {it.status === "pending" ? (
                <>
                  <button
                    onClick={() => approve(it.id)}
                    disabled={busyId === it.id}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold disabled:opacity-60"
                    style={{ color: "var(--ok)" }}
                  >
                    {busyId === it.id ? "…" : "Onayla"}
                  </button>
                  <button
                    onClick={() => toggleRemove(it.id, true)}
                    disabled={busyId === it.id}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold disabled:opacity-60"
                    style={{ color: "var(--danger)" }}
                    title="Reddedilen içerik bulut depodan da kalıcı olarak silinir"
                  >
                    {busyId === it.id ? "…" : "Reddet"}
                  </button>
                </>
              ) : it.status === "removed" ? (
                <>
                  <button
                    onClick={() => toggleRemove(it.id, false)}
                    disabled={busyId === it.id}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold disabled:opacity-60"
                    style={{ color: "var(--ok)" }}
                  >
                    {busyId === it.id ? "…" : "Geri Yükle"}
                  </button>
                  <button
                    onClick={() => deleteForever(it.id)}
                    disabled={busyId === it.id}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold disabled:opacity-60"
                    style={{ color: "var(--danger)" }}
                    title="Dosyayı bulut depodan da kalıcı olarak sil"
                  >
                    {busyId === it.id ? "…" : "Kalıcı Sil"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => toggleRemove(it.id, true)}
                  disabled={busyId === it.id}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold disabled:opacity-60"
                  style={{ color: "var(--danger)" }}
                  title="Kaldırılan içerik bulut depodan da kalıcı olarak silinir"
                >
                  {busyId === it.id ? "İşleniyor…" : "Kaldır"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {previewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setPreviewItem(null)}
        >
          <div className="max-w-3xl w-full flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white">
              <div>
                <div className="font-display text-[15px] font-bold">{previewItem.title}</div>
                <div className="text-[11.5px] text-white/70 mt-0.5">
                  @{previewItem.username} · {previewItem.category ?? "kategori yok"} · {STATUS_LABEL[previewItem.status]}
                </div>
              </div>
              <button onClick={() => setPreviewItem(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg">
                ✕
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[75vh]">
              {previewItem.type === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewItem.mediaUrl} alt={previewItem.title} className="max-w-full max-h-[75vh] object-contain" />
              ) : (
                <video src={previewItem.mediaUrl} className="max-w-full max-h-[75vh]" controls autoPlay />
              )}
            </div>
            {previewItem.status === "pending" && (
              <div className="flex gap-2.5 justify-end">
                <button
                  onClick={() => {
                    toggleRemove(previewItem.id, true);
                  }}
                  disabled={busyId === previewItem.id}
                  className="px-4 py-2 rounded-[10px] bg-white/10 text-white text-[13px] font-semibold disabled:opacity-60"
                >
                  Reddet
                </button>
                <button
                  onClick={() => {
                    approve(previewItem.id);
                    setPreviewItem(null);
                  }}
                  disabled={busyId === previewItem.id}
                  className="px-4 py-2 rounded-[10px] bg-[var(--accent)] text-white text-[13px] font-semibold disabled:opacity-60"
                >
                  Onayla
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
