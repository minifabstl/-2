import { gte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, searchLogs } from "@/db";

const TRENDING_WINDOW_DAYS = 7;
const TRENDING_LIMIT = 5;
const MAX_QUERY_LENGTH = 60;

/** Logs a real search so "Trending searches" reflects what people actually looked for. */
export async function recordSearch(query: string, userId?: string | null): Promise<void> {
  const q = query.trim().slice(0, MAX_QUERY_LENGTH);
  if (!q) return;
  const db = getDb();
  await db.insert(searchLogs).values({
    id: nanoid(),
    query: q,
    userId: userId ?? null,
    createdAt: new Date(),
  });
}

/**
 * Top N search terms by real search volume in the last `TRENDING_WINDOW_DAYS` days.
 * Grouped case-insensitively so "Boris" and "boris" count as the same trend, displayed
 * using whichever exact casing was searched most recently.
 */
export async function getTrendingSearches(limit: number = TRENDING_LIMIT): Promise<string[]> {
  const db = getDb();
  const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      // MIN()/MAX() are well-defined SQLite aggregates (unlike a bare non-grouped column),
      // so this deterministically picks one consistent display casing per normalized group.
      display: sql<string>`max(${searchLogs.query})`.as("display_query"),
      lastSearchedAt: sql<number>`max(${searchLogs.createdAt})`.as("last_searched_at"),
      count: sql<number>`count(*)`.as("search_count"),
    })
    .from(searchLogs)
    .where(gte(searchLogs.createdAt, since))
    .groupBy(sql`lower(${searchLogs.query})`)
    .orderBy(sql`search_count desc`, sql`last_searched_at desc`)
    .limit(limit);

  return rows.map((r) => r.display);
}
