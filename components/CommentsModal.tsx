"use client";

import { useEffect, useState } from "react";
import type { FeedPost } from "@/lib/posts";

type Comment = { id: string; text: string; username: string; createdAt: string };

export default function CommentsModal({
  post,
  isLoggedIn,
  onClose,
  onNeedLogin,
}: {
  post: FeedPost;
  isLoggedIn: boolean;
  onClose: () => void;
  onNeedLogin: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${post.id}/comment`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .finally(() => setLoading(false));
  }, [post.id]);

  async function submit() {
    if (!isLoggedIn) return onNeedLogin();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    const res = await fetch(`/api/posts/${post.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setSending(false);
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [{ id: data.id, text, username: data.username, createdAt: new Date().toISOString() }, ...prev]);
      setDraft("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center" onClick={onClose}>
      <div className="w-[400px] max-h-[520px] bg-[var(--surface)] rounded-2xl flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-[18px] py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="font-display text-[14.5px] font-bold">Comments</div>
          <button onClick={onClose} className="text-[var(--text-faint)] text-lg leading-none p-1">&#10005;</button>
        </div>
        <div className="flex-1 overflow-y-auto px-[18px] py-3.5 flex flex-col gap-3.5">
          {loading && <div className="text-xs text-[var(--text-faint)]">Loading…</div>}
          {!loading && comments.length === 0 && (
            <div className="text-xs text-[var(--text-faint)]">No comments yet — be the first to write one.</div>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 min-w-7 rounded-full bg-[var(--border-soft)] flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] font-display">
                {c.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-[12.5px] font-semibold">@{c.username}</div>
                <div className="text-[13px] leading-snug mt-0.5">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3.5 border-t border-[var(--border)]">
          {isLoggedIn ? (
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Write a comment…"
                className="flex-1 border border-[var(--border)] rounded-[10px] px-3 py-2 text-[12.5px] outline-none"
              />
              <button
                onClick={submit}
                disabled={sending}
                className="px-3.5 py-2 rounded-[10px] bg-[var(--accent)] text-white text-[12.5px] font-semibold disabled:opacity-60"
              >
                Send
              </button>
            </div>
          ) : (
            <button
              onClick={onNeedLogin}
              className="w-full py-2.5 rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] text-[12.5px] font-semibold"
            >
              Sign up to comment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
