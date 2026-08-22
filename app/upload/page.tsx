"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { slug: "muzik", label: "Müzik" },
  { slug: "oyun", label: "Oyun" },
  { slug: "egitim", label: "Eğitim" },
  { slug: "spor", label: "Spor" },
  { slug: "teknoloji", label: "Teknoloji" },
  { slug: "komedi", label: "Komedi" },
];

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "photo">("video");
  const [category, setCategory] = useState(CATEGORIES[0].slug);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError("Bir video veya fotoğraf seç.");
    setError("");
    setLoading(true);

    const form = new FormData();
    form.set("title", title);
    form.set("type", type);
    form.set("category", category);
    form.set("file", file);

    const res = await fetch("/api/posts", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Yükleme başarısız.");
      return;
    }
    router.push("/profile?uploaded=1");
    router.refresh();
  }

  return (
    <div className="max-w-xl mx-auto p-10">
      <h1 className="font-display text-xl font-bold mb-6">Yeni Paylaşım</h1>
      <form onSubmit={submit} className="flex flex-col gap-5">
        {error && <div className="text-[12.5px] text-[var(--danger)] bg-[var(--danger-soft)] rounded-[10px] px-3.5 py-2.5">{error}</div>}

        <div className="flex gap-2">
          <button type="button" onClick={() => setType("video")} className={`flex-1 py-2.5 rounded-[10px] border text-sm font-semibold ${type === "video" ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]" : "border-[var(--border)] text-[var(--text-muted)]"}`}>
            Video
          </button>
          <button type="button" onClick={() => setType("photo")} className={`flex-1 py-2.5 rounded-[10px] border text-sm font-semibold ${type === "photo" ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]" : "border-[var(--border)] text-[var(--text-muted)]"}`}>
            Fotoğraf
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-[var(--text-muted)]">Başlık</span>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-sm outline-none" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-[var(--text-muted)]">Kategori</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-sm outline-none">
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-[var(--text-muted)]">Dosya</span>
          <input
            required
            type="file"
            accept={type === "video" ? "video/*" : "image/*"}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </label>

        <button disabled={loading} type="submit" className="py-3 rounded-[10px] bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-60">
          {loading ? "Yükleniyor…" : "Paylaş"}
        </button>
      </form>
    </div>
  );
}
