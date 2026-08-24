import { and, asc, count, desc, eq, inArray, like, or, sql, sum } from "drizzle-orm";
import { getDb, posts, users, likes, comments } from "@/db";
import { mediaUrl } from "@/lib/storage";
import { formatViews } from "@/lib/earnings";

export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 24;

export type TagSort = "newest" | "oldest" | "views" | "likes";

/**
 * True (case-insensitive, exact) membership test against the JSON-array tags column, using
 * SQLite's built-in JSON1 extension (`json_each`) — so tagging a video "ronaldo" matches a
 * search for "Ronaldo" but NOT a search for "cristiano-ronaldo" (which a plain LIKE would).
 */
function hasExactTag(tag: string) {
  return sql`EXISTS (SELECT 1 FROM json_each(${posts.tags}) WHERE lower(json_each.value) = lower(${tag}))`;
}

export type FeedPost = {
  id: string;
  type: "video" | "photo";
  title: string;
  tags: string[];
  username: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  viewCount: number;
  viewsLabel: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
};

/** Parses the JSON-stringified tags column back into a clean string array. Never throws. */
export function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is string => typeof t === "string" && t.length > 0).slice(0, MAX_TAGS);
  } catch {
    return [];
  }
}

/** Cleans up user-supplied tags for storage: trims, drops empties, dedupes, caps length and count. */
export function cleanTags(raw: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw) {
    if (typeof t !== "string") continue;
    const trimmed = t.trim().slice(0, MAX_TAG_LENGTH);
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

const SELECT_FIELDS = {
  id: posts.id,
  type: posts.type,
  title: posts.title,
  tags: posts.tags,
  mediaKey: posts.mediaKey,
  thumbnailKey: posts.thumbnailKey,
  viewCount: posts.viewCount,
  username: users.username,
};

async function attachEngagement(
  rows: {
    id: string;
    type: string;
    title: string;
    tags: string | null;
    mediaKey: string;
    thumbnailKey: string | null;
    viewCount: number;
    username: string;
  }[],
  viewerId?: string | null
): Promise<FeedPost[]> {
  const db = getDb();
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
    tags: parseTags(r.tags),
    username: r.username,
    mediaUrl: mediaUrl(r.mediaKey),
    thumbnailUrl: r.thumbnailKey ? mediaUrl(r.thumbnailKey) : null,
    viewCount: r.viewCount,
    viewsLabel: formatViews(r.viewCount) + " views",
    likeCount: likeCounts.get(r.id) ?? 0,
    commentCount: commentCounts.get(r.id) ?? 0,
    liked: likedByViewer.has(r.id),
  }));
}

/** Public feed — visible to non-member visitors too. If `viewerId` is provided, like status is included. */
export async function listPosts(opts: { viewerId?: string | null; type?: "video" | "photo" } = {}): Promise<FeedPost[]> {
  const db = getDb();

  const where = opts.type ? and(eq(posts.status, "live"), eq(posts.type, opts.type)) : eq(posts.status, "live");

  const rows = await db
    .select(SELECT_FIELDS)
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(where)
    .orderBy(desc(posts.createdAt))
    .limit(60);

  return attachEngagement(rows, opts.viewerId);
}

/**
 * Search live posts by video title, by the uploader's username (a search for a creator's name
 * surfaces their videos too), or by one of the video's SEO tags. Falls back to nothing for an
 * empty query — callers should check for that themselves so they can show a dedicated empty state.
 */
export async function searchPosts(query: string, viewerId?: string | null): Promise<FeedPost[]> {
  const db = getDb();
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q.replace(/[%_]/g, "")}%`;

  const rows = await db
    .select(SELECT_FIELDS)
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(
      and(
        eq(posts.status, "live"),
        or(like(posts.title, pattern), like(users.username, pattern), like(posts.tags, pattern))
      )
    )
    .orderBy(desc(posts.viewCount))
    .limit(60);

  return attachEngagement(rows, viewerId);
}

/**
 * Aggregate stats for a "topic profile" — every live post any user has tagged with `tag`
 * (e.g. every video tagged "ronaldo", uploaded by any number of different users). Returns
 * null when nothing has ever been tagged with it, so callers can tell "an empty topic" apart
 * from "not a topic at all — fall back to a regular search".
 */
export async function getTagAggregate(tag: string): Promise<{ count: number; totalViews: number } | null> {
  const t = tag.trim();
  if (!t) return null;
  const db = getDb();
  const [row] = await db
    .select({ count: count(), totalViews: sum(posts.viewCount) })
    .from(posts)
    .where(and(eq(posts.status, "live"), hasExactTag(t)));

  const n = row?.count ?? 0;
  if (n === 0) return null;
  return { count: n, totalViews: Number(row.totalViews ?? 0) };
}

/**
 * Every live post (from any user) tagged with `tag`, sorted the way the topic profile page's
 * filter tabs ask for. "likes" sort is applied in JS after fetching engagement counts, same as
 * everywhere else in this file — fine at this MVP's scale (capped at 100 posts per topic).
 */
export async function getPostsByTag(tag: string, opts: { sort?: TagSort; viewerId?: string | null } = {}): Promise<FeedPost[]> {
  const t = tag.trim();
  if (!t) return [];
  const db = getDb();

  const orderBy =
    opts.sort === "oldest" ? asc(posts.createdAt) : opts.sort === "views" ? desc(posts.viewCount) : desc(posts.createdAt);

  const rows = await db
    .select(SELECT_FIELDS)
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(and(eq(posts.status, "live"), hasExactTag(t)))
    .orderBy(orderBy)
    .limit(100);

  const attached = await attachEngagement(rows, opts.viewerId);
  if (opts.sort === "likes") attached.sort((a, b) => b.likeCount - a.likeCount);
  return attached;
}
