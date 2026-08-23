"use client";

import { useEffect, useRef } from "react";
import type { FeedPost } from "@/lib/posts";

export default function PostCard({
  post,
  gradientHue,
  onLike,
  onComment,
  onOpen,
}: {
  post: FeedPost;
  gradientHue: number;
  onLike: () => void;
  onComment: () => void;
  onOpen: () => void;
}) {
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    fetch(`/api/posts/${post.id}/view`, { method: "POST" }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col border border-[var(--border)] rounded-[14px] overflow-hidden bg-[var(--surface)]">
      <div
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        className="relative w-full h-[150px] flex items-center justify-center overflow-hidden cursor-pointer"
        style={{ background: `linear-gradient(135deg, oklch(0.86 0.06 ${gradientHue}), oklch(0.94 0.03 ${gradientHue}))` }}
      >
        {post.type === "photo" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.mediaUrl} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <video src={post.mediaUrl} className="absolute inset-0 w-full h-full object-cover" preload="metadata" muted playsInline />
        )}
        {post.type === "video" && (
          <div className="relative w-[38px] h-[38px] rounded-full bg-white/90 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#18181b"><path d="M6 4l14 8-14 8V4z" /></svg>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-black/45 text-white text-[10.5px] font-semibold px-1.5 py-0.5 rounded-[6px]">
          {post.type === "video" ? "VIDEO" : "PHOTO"}
        </div>
        <div className="absolute bottom-2 right-2 bg-black/45 text-white text-[10.5px] font-semibold px-1.5 py-0.5 rounded-[6px]">
          {post.viewsLabel}
        </div>
      </div>
      <div className="px-3 pt-2.5 pb-3 flex flex-col gap-2">
        <div className="text-[13px] font-semibold leading-tight">{post.title}</div>
        <div className="text-[11.5px] text-[var(--text-muted)]">@{post.username}</div>
        <div className="flex items-center gap-3.5 mt-0.5">
          <button onClick={onLike} className="flex items-center gap-1.5" style={{ color: post.liked ? "var(--accent)" : "var(--text-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={post.liked ? "var(--accent)" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-4.35-9.5-9.06C.86 8.6 2.2 5 5.6 5c1.9 0 3.3 1 4.4 2.6C11.1 6 12.5 5 14.4 5c3.4 0 4.74 3.6 3.1 6.94C19 16.65 12 21 12 21z" />
            </svg>
            <span className="text-xs font-semibold">{post.likeCount}</span>
          </button>
          <button onClick={onComment} className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-4-1L3 20l1-4.5a8.38 8.38 0 01-1-4A8.5 8.5 0 0111.5 3a8.38 8.38 0 018.5 8.5z" />
            </svg>
            <span className="text-xs font-semibold">{post.commentCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
