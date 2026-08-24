import { and, desc, eq, inArray, like, or } from "drizzle-orm";
import { getDb, posts, users, likes, comments } from "@/db";
import { mediaUrl } from "@/lib/storage";
import { formatViews } from "@/lib/earnings";

export type FeedPost = {
  id: string;
  type: "video" | "photo";
  title: string;
  category: string | null;
  username: string;
  mediaUrl: string;
  viewCount: number;
  viewsLabel: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
};

/** Public feed — visible to non-member visitors too. If `viewerId` is provided, like status is included. */
export async function listPosts(opts: { category?: string; viewerId?: string | null } = {}): Promise<FeedPost[]> {
  const db = getDb();

  const where = opts.category
    ? and(eq(posts.status, "live"), eq(posts.category, opts.category))
    : eq(posts.status, "live");

  const rows = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      category: posts.category,
      mediaKey: posts.mediaKey,
      viewCount: posts.viewCount,
      username: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(where)
    .orderBy(desc(posts.createdAt))
    .limit(60);

  if (rows.length === 0) return [];
  const postIds = rows.map((r) => r.id);

  const likeRows = await db.select({ postId: likes.postId, userId: likes.userId }).from(likes).where(inArray(likes.postId, postIds));
  const commentRows = await db.select({ postId: comments.postId }).from(comments).where(inArray(comments.postId, postIds));

  const likeCounts = new Map<string, number>();
  const likedByViewer = new Set<string>();
  for (const l of likeRows) {
    likeCounts.set(l.postId, (likeCounts.get(l.postId) ?? 0) + 1);
    if (opts.viewerId && l.userId === opts.viewerId) likedByViewer.add(l.postId);
  }
  const commentCounts = new Map<string, number>();
  for (const c of commentRows) commentCounts.set(c.postId, (commentCounts.get(c.postId) ?? 0) + 1);

  return rows.map((r) => ({
    id: r.id,
    type: r.type as "video" | "photo",
    title: r.title,
    category: r.category,
    username: r.username,
    mediaUrl: mediaUrl(r.mediaKey),
    viewCount: r.viewCount,
    viewsLabel: formatViews(r.viewCount) + " views",
    likeCount: likeCounts.get(r.id) ?? 0,
    commentCount: commentCounts.get(r.id) ?? 0,
    liked: likedByViewer.has(r.id),
  }));
}

/**
 * Search live posts by video title or by the uploader's username (a search for a creator's
 * name surfaces their videos too). Falls back to nothing for an empty query — callers should
 * check for that themselves so they can show a dedicated empty state.
 */
export async function searchPosts(query: string, viewerId?: string | null): Promise<FeedPost[]> {
  const db = getDb();
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q.replace(/[%_]/g, "")}%`;

  const rows = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      category: posts.category,
      mediaKey: posts.mediaKey,
      viewCount: posts.viewCount,
      username: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(and(eq(posts.status, "live"), or(like(posts.title, pattern), like(users.username, pattern))))
    .orderBy(desc(posts.viewCount))
    .limit(60);

  if (rows.length === 0) return [];
  const postIds = rows.map((r) => r.id);

  const likeRows = await db.select({ postId: likes.postId, userId: likes.userId }).from(likes).where(inArray(likes.postId, postIds));
  const commentRows = await db.select({ postId: comments.postId }).from(comments).where(inArray(comments.postId, postIds));

  const likeCounts = new Map<string, number>();
  const likedByViewer = new Set<string>();
  for (const l of likeRows) {
    likeCounts.set(l.postId, (likeCounts.get(l.postId) ?? 0) + 1);
    if (viewerId && l.userId === viewerId) likedByViewer.add(l.postId);
  }
  const commentCounts = new Map<string, number>();
  for (const c of commentRows) commentCounts.set(c.postId, (commentCounts.get(c.postId) ?? 0) + 1);

  return rows.map((r) => ({
    id: r.id,
    type: r.type as "video" | "photo",
    title: r.title,
    category: r.category,
    username: r.username,
    mediaUrl: mediaUrl(r.mediaKey),
    viewCount: r.viewCount,
    viewsLabel: formatViews(r.viewCount) + " views",
    likeCount: likeCounts.get(r.id) ?? 0,
    commentCount: commentCounts.get(r.id) ?? 0,
    liked: likedByViewer.has(r.id),
  }));
}
