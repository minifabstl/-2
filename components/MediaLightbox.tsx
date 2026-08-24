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
        {post.type === "photo" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.mediaUrl} alt={post.title} className="max-w-full max-h-[75vh] object-contain rounded-[10px]" />
        ) : (
          <video
            src={post.mediaUrl}
            controls
            autoPlay
            muted
            playsInline
            className="max-w-full max-h-[75vh] object-contain rounded-[10px]"
          />
        )}
        <div className="text-white text-sm text-center">
          <span className="font-semibold">{post.title}</span>
          <span className="text-white/60"> · @{post.username}</span>
        </div>
      </div>
    </div>
  );
}
