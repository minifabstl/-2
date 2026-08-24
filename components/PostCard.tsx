"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
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
    <div className="group flex flex-col rounded-xl overflow-hidden bg-[var(--surface)] shadow-sm hover:shadow-md transition-shadow">
      <div
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        className="relative w-full aspect-[3/4] flex items-center justify-center overflow-hidden cursor-pointer"
        style={{ background: `linear-gradient(135deg, oklch(0.86 0.06 ${gradientHue}), oklch(0.94 0.03 ${gradientHue}))` }}
      >
        {post.type === "photo" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.mediaUrl}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <video
            src={post.mediaUrl}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            preload="metadata"
            muted
            playsInline
          />
        )}
        {post.type === "video" && (
          <div className="relative w-[46px] h-[46px] rounded-full bg-white/90 flex items-center justify-center">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#18181b"><path d="M6 4l14 8-14 8V4z" /></svg>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 bg-black/45 text-white text-[11.5px] font-semibold px-2 py-1 rounded-[7px]">
          {post.type === "video" ? "VIDEO" : "PHOTO"}
        </div>
        <div className="absolute bottom-2.5 right-2.5 bg-black/45 text-white text-[11.5px] font-semibold px-2 py-1 rounded-[7px]">
          {post.viewsLabel}
        </div>
        {/* Bottom gradient + caption overlay, so the tile stays image-forward like a photo mosaic */}
        <div className="absolute inset-x-0 bottom-0 pt-10 pb-3 px-3 bg-gradient-to-t from-black/75 via-black/25 to-transparent">
          <div className="text-white text-[15px] font-semibold leading-tight truncate">{post.title}</div>
          <div className="text-white/80 text-[12px] truncate">@{post.username}</div>
        </div>
      </div>
      <div className="px-3 pt-2.5 pb-3 flex flex-col gap-2">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="px-1.5 py-0.5 rounded-md bg-[var(--bg)] text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--accent-dark)] hover:bg-[var(--accent-soft)]"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4">
          <button onClick={onLike} className="flex items-center gap-1.5" style={{ color: post.liked ? "var(--accent)" : "var(--text-muted)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill={post.liked ? "var(--accent)" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-4.35-9.5-9.06C.86 8.6 2.2 5 5.6 5c1.9 0 3.3 1 4.4 2.6C11.1 6 12.5 5 14.4 5c3.4 0 4.74 3.6 3.1 6.94C19 16.65 12 21 12 21z" />
            </svg>
            <span className="text-[13px] font-semibold">{post.likeCount}</span>
          </button>
          <button onClick={onComment} className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-4-1L3 20l1-4.5a8.38 8.38 0 01-1-4A8.5 8.5 0 0111.5 3a8.38 8.38 0 018.5 8.5z" />
            </svg>
            <span className="text-[13px] font-semibold">{post.commentCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
