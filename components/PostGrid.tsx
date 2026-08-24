"use client";

import { useState } from "react";
import type { FeedPost } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import CommentsModal from "@/components/CommentsModal";
import LoginPromptModal from "@/components/LoginPromptModal";
import MediaLightbox from "@/components/MediaLightbox";

const GRADIENTS = [25, 230, 90, 300, 160, 15, 260, 45];

export default function PostGrid({ posts, isLoggedIn, title }: { posts: FeedPost[]; isLoggedIn: boolean; title: string }) {
  const [items, setItems] = useState(posts);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState("Sign up to like");
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [openMedia, setOpenMedia] = useState<string | null>(null);

  function requireLogin(message: string) {
    setPromptText(message);
    setPromptOpen(true);
  }

  async function toggleLike(postId: string) {
    if (!isLoggedIn) return requireLogin("Sign up to like");
    setItems((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 } : p))
    );
    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    if (!res.ok) {
      // revert
      setItems((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 } : p))
      );
    }
  }

  function openCommentsFor(postId: string) {
    setOpenComments(postId);
  }

  if (items.length === 0) {
    return (
      <div className="p-10 text-center text-[var(--text-muted)] text-sm">
        There&apos;s no content here yet.
      </div>
    );
  }

  const activePost = items.find((p) => p.id === openComments) ?? null;
  const activeMediaPost = items.find((p) => p.id === openMedia) ?? null;

  return (
    <div className="p-7 pb-16">
      <h2 className="font-display text-[19px] font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-4 gap-2 max-w-[680px] ml-auto">
        {items.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            gradientHue={GRADIENTS[i % GRADIENTS.length]}
            onLike={() => toggleLike(post.id)}
            onComment={() => openCommentsFor(post.id)}
            onOpen={() => setOpenMedia(post.id)}
          />
        ))}
      </div>

      {activePost && (
        <CommentsModal
          post={activePost}
          isLoggedIn={isLoggedIn}
          onClose={() => setOpenComments(null)}
          onNeedLogin={() => {
            setOpenComments(null);
            requireLogin("Sign up to comment");
          }}
        />
      )}

      <LoginPromptModal open={promptOpen} onClose={() => setPromptOpen(false)} title={promptText} />

      {activeMediaPost && <MediaLightbox post={activeMediaPost} onClose={() => setOpenMedia(null)} />}
    </div>
  );
}
