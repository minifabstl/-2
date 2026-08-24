"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MAX_TAGS = 5;

const MAX_MB = { photo: 5, video: 95 };
const ACCEPT = { photo: "image/png,image/jpeg,image/webp,image/jpg", video: "video/mp4,video/quicktime,video/webm,video/x-m4v" };
const FORMAT_HINT = { photo: "PNG, JPEG, WEBP, JPG", video: "MP4, MOV, WEBM, M4V" };

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "photo">("video");
  const [tags, setTags] = useState<string[]>(Array(MAX_TAGS).fill(""));
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [readGuide, setReadGuide] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const maxMb = MAX_MB[type];
  const fileSizeMb = file ? file.size / (1024 * 1024) : 0;

  // Captures a still frame from a video file so we have a real thumbnail image to serve as the
  // <video poster>, instead of relying on the browser to decode a frame on its own — mobile
  // browsers (Safari on iOS especially) often refuse to paint any frame without one.
  function captureVideoThumbnail(f: File): Promise<Blob | null> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(f);
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.src = url;

      const cleanup = () => URL.revokeObjectURL(url);

      video.onloadeddata = () => {
        // Seek a moment in so we don't capture an all-black first frame.
        video.currentTime = Math.min(0.3, video.duration / 4 || 0);
      };
      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx || !canvas.width || !canvas.height) {
            cleanup();
            resolve(null);
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              cleanup();
              resolve(blob);
            },
            "image/jpeg",
            0.85
          );
        } catch {
          cleanup();
          resolve(null);
        }
      };
      video.onerror = () => {
        cleanup();
        resolve(null);
      };
    });
  }

  async function pickFile(f: File | null) {
    setError("");
    if (!f) return;
    const isVideo = f.type.startsWith("video/");
    const expectedType = isVideo ? "video" : "photo";
    if (expectedType !== type) {
      setError(`The file you selected is a ${isVideo ? "video" : "photo"} — first select the correct type above.`);
      return;
    }
    if (f.size / (1024 * 1024) > MAX_MB[expectedType]) {
      setError(`File is too large — the maximum is ${MAX_MB[expectedType]} MB.`);
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setThumbnailBlob(null);
    if (isVideo) {
      const thumb = await captureVideoThumbnail(f);
      setThumbnailBlob(thumb);
    }
  }

  function removeFile() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setThumbnailBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError("Select a video or photo.");
    if (!readGuide) return setError("You must confirm that you've read the upload guidelines before continuing.");
    if (!acceptedTerms) return setError("You must accept the content rights and Terms of Service before continuing.");
    setError("");
    setLoading(true);

    const form = new FormData();
    form.set("title", title);
    form.set("type", type);
    form.set("tags", JSON.stringify(tags.map((t) => t.trim()).filter(Boolean)));
    form.set("file", file);
    if (thumbnailBlob) form.set("thumbnail", thumbnailBlob, "thumbnail.jpg");

    const res = await fetch("/api/posts", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    router.push("/profile?uploaded=1");
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-10">
      {/* Top step indicator (visual) */}
      <div className="flex items-center justify-center gap-3 mb-7">
        {[
          { label: "Upload", active: true },
          { label: "Submit", active: !!file },
          { label: "Done", active: false },
        ].map((step, i, arr) => (
          <div key={step.label} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full border-2"
                style={{
                  borderColor: step.active ? "var(--accent)" : "var(--border)",
                  background: step.active ? "var(--accent)" : "transparent",
                }}
              />
              <span className={`text-[11px] font-semibold ${step.active ? "text-[var(--accent-dark)]" : "text-[var(--text-faint)]"}`}>{step.label}</span>
            </div>
            {i < arr.length - 1 && <div className="w-16 h-px bg-[var(--border)] -mt-4" />}
          </div>
        ))}
      </div>

      <div className="mb-6 px-4 py-3 rounded-[10px] flex items-center gap-2 text-[12.5px] font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent-dark)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
        Your uploads earn money: $0.20 per 1000 views, paid straight to your wallet.
      </div>

      <form onSubmit={submit} className="flex flex-col gap-6">
        {error && <div className="text-[12.5px] text-[var(--danger)] bg-[var(--danger-soft)] rounded-[10px] px-3.5 py-2.5">{error}</div>}

        <div className="flex gap-2">
          <button type="button" onClick={() => { setType("video"); removeFile(); }} className={`flex-1 py-2.5 rounded-[10px] border text-sm font-semibold ${type === "video" ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]" : "border-[var(--border)] text-[var(--text-muted)]"}`}>
            Video
          </button>
          <button type="button" onClick={() => { setType("photo"); removeFile(); }} className={`flex-1 py-2.5 rounded-[10px] border text-sm font-semibold ${type === "photo" ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]" : "border-[var(--border)] text-[var(--text-muted)]"}`}>
            Photo
          </button>
        </div>

        <div>
          <div className="font-display text-[15px] font-bold mb-3">Details</div>

          <div className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] mb-3.5">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent-dark)" }}>
              i
            </span>
            <div className="text-[12px] text-[var(--text-muted)] leading-relaxed">
              Before uploading: clear, well-lit content that you own the rights to and that follows the rules gets
              approved faster. Inappropriate or unauthorized content will be rejected.
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-[12px] text-[var(--text-muted)] cursor-pointer">
            <input type="checkbox" checked={readGuide} onChange={(e) => setReadGuide(e.target.checked)} className="mt-0.5" />
            I have read and understood the upload guidelines.
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Left: file picker / drag-and-drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); if (readGuide) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (!readGuide) return;
              pickFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 p-7 text-center min-h-[280px]"
            style={{
              borderColor: dragOver ? "var(--accent)" : "var(--border)",
              background: dragOver ? "var(--accent-soft)" : "var(--surface)",
              opacity: readGuide ? 1 : 0.55,
            }}
          >
            {!previewUrl ? (
              <>
                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="2">
                    <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-sm font-semibold">Select file</div>
                <div className="text-[11px] text-[var(--text-faint)] leading-relaxed">
                  Supported {type === "photo" ? "photo" : "video"} formats:
                  <br />
                  {FORMAT_HINT[type]} (max {maxMb}MB)
                </div>
                <button
                  type="button"
                  disabled={!readGuide}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 px-5 py-2.5 rounded-full bg-[var(--accent)] text-white text-[13px] font-semibold disabled:opacity-50"
                >
                  Add
                </button>
              </>
            ) : (
              <div className="relative w-full h-full">
                <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center h-[220px]">
                  {type === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <video src={previewUrl} className="max-w-full max-h-full" controls />
                  )}
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[13px] font-bold shadow-sm"
                >
                  ✕
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT[type]}
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              disabled={!readGuide}
              className="hidden"
            />
          </div>

          {/* Right: title, category, size indicator */}
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold">Title <span className="text-[var(--text-faint)] font-normal">(required)</span></span>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your content a title" className="border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-sm outline-none" />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold">
                Meta Tags <span className="text-[var(--text-faint)] font-normal">(up to 5, optional)</span>
              </span>
              <span className="text-[11px] text-[var(--text-faint)] leading-snug -mt-0.5">
                Keywords that describe your content — they help people find it through Google search.
              </span>
              <div className="grid grid-cols-2 gap-2">
                {tags.map((tag, i) => (
                  <input
                    key={i}
                    value={tag}
                    onChange={(e) => {
                      const next = [...tags];
                      next[i] = e.target.value;
                      setTags(next);
                    }}
                    maxLength={24}
                    placeholder={`Tag ${i + 1}`}
                    className="border border-[var(--border)] rounded-[10px] px-3 py-2 text-[13px] outline-none"
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[12.5px] font-semibold mb-1.5">
                Added media ({fileSizeMb.toFixed(1)}MB / {maxMb}MB)
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (fileSizeMb / maxMb) * 100)}%`, background: "var(--accent)" }}
                />
              </div>
            </div>

            <div className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
              Your media will only become visible in the public feed after review by our admin team.
            </div>
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-[12px] text-[var(--text-muted)] cursor-pointer">
          <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5" />
          I confirm that I own the rights to this content or have authorization to share it, that everyone appearing
          in it is over 18 years old, and that they have consented to it being shared.{" "}
          <Link href="/terms" target="_blank" className="text-[var(--accent)] underline" onClick={(e) => e.stopPropagation()}>
            Terms of Service
          </Link>
          .
        </label>

        <button
          disabled={loading || !file || !title || !readGuide || !acceptedTerms}
          type="submit"
          className="py-3 rounded-[10px] bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Share"}
        </button>
      </form>
    </div>
  );
}
