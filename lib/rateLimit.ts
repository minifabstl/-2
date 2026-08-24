import { and, count, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, loginAttempts } from "@/db";

/**
 * A small, self-contained rate limiter backed by the `login_attempts` table — used to slow down
 * brute-force login guessing and scripted account creation. It is intentionally simple (no KV /
 * Durable Object binding is provisioned for this project) and keyed by whatever the caller
 * chooses (an identifier, an IP address, a route name + IP, etc.).
 *
 * This is a second line of defense, not the primary one — an edge-level Cloudflare Rate
 * Limiting rule in front of /api/auth/login, /api/auth/register, and /api/posts is the right
 * place to stop distributed/scripted abuse, since it blocks requests before they ever reach
 * this Worker. That has to be configured in the Cloudflare dashboard (this code can't do it).
 */

/** True if `key` has hit `maxAttempts` or more within the last `windowMs`. */
export async function isRateLimited(key: string, windowMs: number, maxAttempts: number): Promise<boolean> {
  const db = getDb();
  const since = new Date(Date.now() - windowMs);
  const [row] = await db
    .select({ n: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.key, key), gt(loginAttempts.createdAt, since)));
  return (row?.n ?? 0) >= maxAttempts;
}

/** Records one attempt against `key` (call this on every failed/throttled attempt). */
export async function recordAttempt(key: string): Promise<void> {
  const db = getDb();
  await db.insert(loginAttempts).values({ id: nanoid(), key, createdAt: new Date() });
}

/** Clears attempts for `key` (call this on a successful login, to un-penalize the real owner). */
export async function clearAttempts(key: string): Promise<void> {
  const db = getDb();
  await db.delete(loginAttempts).where(eq(loginAttempts.key, key));
}

/** Best-effort client IP from Cloudflare's connecting-IP header. Falls back to "unknown". */
export function clientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
