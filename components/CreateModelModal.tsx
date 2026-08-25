"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateModelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function pickFile(f: File | null) {
    setError("");
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function reset() {
    setName("");
    setFile(null);
    setPreview(null);
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter a name.");
    if (!file) return setError("Please choose a photo.");

    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("name", name.trim());
      form.set("photo", file);
      const res = await fetch("/api/models", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong — please try again.");
        return;
      }
      reset();
      onClose();
      router.push(`/models/${data.model.slug}`);
      router.refresh();
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={() => {
        reset();
        onClose();
      }}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] bg-[var(--surface)] rounded-2xl p-6 flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="font-display text-[17px] font-bold">Add a Model</div>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="text-[var(--text-faint)] text-lg leading-none p-1"
          >
            &#10005;
          </button>
        </div>
        <div className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          Add anyone here, then tag your uploads with this same name — every video and photo
          tagged with it will automatically show up on their page.
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-24 h-24 rounded-full mx-auto overflow-hidden border-2 border-dashed border-[var(--border)] flex items-center justify-center bg-[var(--bg)] shrink-0"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[11px] text-[var(--text-faint)] font-semibold text-center px-2">Add photo</span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g. Ronaldo)"
          maxLength={40}
          className="border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[13px] outline-none"
        />

        {error && <div className="text-[12px] text-[var(--danger)]">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="py-3 rounded-[10px] font-bold text-[13.5px] text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {submitting ? "Creating…" : "Create"}
        </button>
      </form>
    </div>
  );
}
