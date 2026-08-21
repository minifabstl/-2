import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb, sessions, users } from "@/db";

const SESSION_COOKIE = "session_id";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün

export async function createSession(userId: string) {
  const db = getDb();
  const id = nanoid(48);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  await db.insert(sessions).values({ id, userId, createdAt: now, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Geçerli isteğin sahibi olan kullanıcıyı döndürür, giriş yoksa null. */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const db = getDb();
  const rows = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.session.expiresAt.getTime() < Date.now()) return null;
  if (row.user.status === "suspended") return null;

  // Şifre alanlarını asla çağırana döndürme
  const { passwordHash: _ph, passwordSalt: _ps, ...safeUser } = row.user;
  return safeUser;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Giriş yapmalısın.");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError("Bu işlem için yönetici yetkisi gerekir.");
  return user;
}

export class AuthError extends Error {}

export type SafeUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
