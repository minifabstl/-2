"use client";

import { useRef, useState } from "react";

const MAX_TAGS = 5;
// Admins aren't held to the regular member per-type caps — the server (POST /api/posts/presign)
// enforces a much higher ceiling (ADMIN_MAX_BYTES, 5GB) for admin accounts instead. This is just
// a client-side sanity check so a huge accidental file fails fast instead of uploading first.
const MAX_MB = { photo: 5000, video: 5000 };

type QueueStatus = "queued" | "uploading" | "done" | "error";

type QueueItem = {
  id: string;
  file: File;
  type: "photo" | "video";
  title: string;
  previewUrl: string;
  status: QueueStatus;
  pct: number;
  error: string;
};

function titleFromFilename(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Untitled";
}

/** Captures a still frame from a video file to use as its poster thumbnail — same approach as
 * the regular upload page (app/upload/page.tsx), needed because mobile browsers often won't
 * decode a frame from the video file on their own. */
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
        canvas.toBlob((blob) => { cleanup(); resolve(blob); }, "image/jpeg", 0.85);
      } catch {
        cleanup();
        resolve(null);
      }
    };
    video.onerror = () => { cleanup(); resolve(null); };
  });
}

/** PUTs raw file bytes straight to R2 over a presigned URL, tracking progress via XHR. */
function uploadDirectly(uploadUrl: string, f: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", f.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("The upload to storage failed."));
    };
    xhr.onerror = () => reject(new Error("The upload to storage failed."));
    xhr.send(f);
  });
}

export default function AdminBulkUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [tags, setTags] = useState<string[]>(Array(MAX_TAGS).fill(""));
  const [running, setRunning] = useState(false);
  const [globalError, setGlobalError] = useState("");

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setGlobalError("");
    const next: QueueItem[] = [];
    const skipped: string[] = [];

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      const isPhoto = file.type.startsWith("image/");
      if (!isVideo && !isPhoto) {
        skipped.push(`${file.name} (unsupported file type)`);
        continue;
      }
      const type: "photo" | "video" = isVideo ? "video" : "photo";
      const maxMb = MAX_MB[type];
      if (file.size / (1024 * 1024) > maxMb) {
        skipped.push(`${file.name} (over ${maxMb}MB)`);
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        type,
        title: titleFromFilename(file.name),
        previewUrl: URL.createObjectURL(file),
        status: "queued",
        pct: 0,
        error: "",
      });
    }

    if (skipped.length > 0) setGlobalError(`Skipped: ${skipped.join(", ")}`);
    setQueue((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeItem(id: string) {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((q) => q.id !== id);
    });
  }

  function updateItem(id: string, patch: Partial<QueueItem>) {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  async function uploadOne(item: QueueItem, cleanTags: string[]) {
    updateItem(item.id, { status: "uploading", pct: 0, error: "" });
    try {
      const presignRes = await fetch("/api/posts/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: item.file.name, contentType: item.file.type, size: item.file.size, type: item.type }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error ?? "Couldn't start the upload.");
      await uploadDirectly(presignData.uploadUrl, item.file, (pct) => updateItem(item.id, { pct }));
      const mediaKey = presignData.key;
      const thumbnailBlob = item.type === "video" ? await captureVideoThumbnail(item.file) : null;
      updateItem(item.id, { pct: 100 });

      const form = new FormData();
      form.set("title", item.title || titleFromFilename(item.file.name));
      form.set("type", item.type);
      form.set("tags", JSON.stringify(cleanTags));
      form.set("mediaKey", mediaKey);
      if (thumbnailBlob) form.set("thumbnail", thumbnailBlob, "thumbnail.jpg");

      const res = await fetch("/api/admin/bulk-upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");

      updateItem(item.id, { status: "done", pct: 100 });
    } catch (err) {
      updateItem(item.id, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
    }
  }

  async function uploadAll() {
    setRunning(true);
    setGlobalError("");
    const cleanTagList = tags.map((t) => t.trim()).filter(Boolean).slice(0, MAX_TAGS);
    // Sequential on purpose — keeps R2/Worker load predictable for a large batch instead of
    // firing dozens of presign + PUT requests at once.
    for (const item of queue) {
      if (item.status === "done") continue;
      await uploadOne(item, cleanTagList);
    }
    setRunning(false);
  }

  const doneCount = queue.filter((q) => q.status === "done").length;
  const errorCount = queue.filter((q) => q.status === "error").length;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold">Bulk Upload</h1>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          Select any number of photos and videos at once. Each one goes live immediately — no approval step,
          since this is an admin upload.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-[var(--border)] rounded-2xl p-8 flex flex-col items-center justify-center gap-2.5 text-center bg-[var(--surface)]"
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="2">
              <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-sm font-semibold">Drag files here, or</div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-full bg-[var(--accent)] text-white text-[13px] font-semibold"
          >
            Select Files
          </button>
          <div className="text-[11px] text-[var(--text-faint)]">
            No practical size limit for admin uploads. Mix photos and videos freely.
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/jpg,video/mp4,video/quicktime,video/webm,video/x-m4v"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {globalError && <div className="text-[12.5px] text-[var(--danger)] bg-[var(--danger-soft)] rounded-[10px] px-3.5 py-2.5">{globalError}</div>}

        {queue.length > 0 && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold">
                Shared Tags <span className="text-[var(--text-faint)] font-normal">(applied to every file in this batch, up to 5, optional)</span>
              </span>
              <div className="grid grid-cols-5 gap-2">
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

            <div className="flex flex-col gap-2.5">
              {queue.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border border-[var(--border)] rounded-xl p-2.5 bg-[var(--surface)]">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-black flex items-center justify-center shrink-0">
                    {item.type === "photo" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={item.previewUrl} className="w-full h-full object-cover" muted />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <input
                      value={item.title}
                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                      disabled={item.status === "uploading" || item.status === "done"}
                      className="border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[12.5px] outline-none disabled:opacity-60"
                    />
                    <div className="text-[10.5px] text-[var(--text-faint)] uppercase font-semibold tracking-wide">{item.type}</div>
                    {item.status === "uploading" && (
                      <div className="h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${item.pct}%`, background: "var(--accent)" }} />
                      </div>
                    )}
                    {item.status === "error" && <div className="text-[11px] text-[var(--danger)]">{item.error}</div>}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {item.status === "done" && <span className="text-[11px] font-semibold text-[var(--ok)]">Live ✓</span>}
                    {item.status === "queued" && (
                      <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center text-[12px] font-bold text-[var(--text-muted)]">
                        &#10005;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={uploadAll}
                disabled={running || queue.every((q) => q.status === "done")}
                className="py-3 px-6 rounded-[10px] bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-50"
              >
                {running ? "Uploading…" : `Upload All (${queue.length})`}
              </button>
              <div className="text-[12.5px] text-[var(--text-muted)]">
                {doneCount} done{errorCount > 0 ? `, ${errorCount} failed` : ""} of {queue.length}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
