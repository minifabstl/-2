"use client";

import { useEffect } from "react";
import type { FeedPost } from "@/lib/posts";

export default function MediaLightbox({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-lg"
        aria-label="Close"
      >
        ✕
      </button>
      <div
        className="max-w-4xl max-h-[85vh] w-full flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-w-full max-h-[75vh]">
          {post.type === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.mediaUrl} alt={post.title} className="max-w-full max-h-[75vh] object-contain rounded-[10px]" />
          ) : (
            <video
              src={post.mediaUrl}
              poster={post.thumbnailUrl ?? undefined}
              controls
              autoPlay
              muted
              playsInline
              className="max-w-full max-h-[75vh] object-contain rounded-[10px]"
            />
          )}
          {/* Watermark — small, centered, non-interactive — so screenshots/reposts of our media are traceable back to us. */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
            <span className="font-display font-bold text-white/40 text-[15px] tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] notranslate" translate="no">
              LeakedFap
            </span>
          </div>
        </div>
        <div className="text-white text-sm text-center">
          <span className="font-semibold">{post.title}</span>
          <span className="text-white/60"> · @{post.username}</span>
        </div>
      </div>
    </div>
  );
}
