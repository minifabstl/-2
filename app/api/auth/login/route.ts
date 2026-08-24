import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { getDb, users } from "@/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";
import { clearAttempts, isRateLimited, recordAttempt } from "@/lib/rateLimit";

// Locks out further attempts against the SAME identifier for a while after too many wrong
// passwords in a row — slows down brute-force password guessing against one account. See
// lib/rateLimit.ts for why this isn't the full story (an edge-level rule is the real defense
// against distributed/scripted abuse).
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const identifier = (body?.identifier ?? "").trim().toLowerCase();
  const password = body?.password ?? "";

  if (!identifier || !password) {
    return NextResponse.json({ error: "Username/email and password are required." }, { status: 400 });
  }

  const attemptKey = `login:${identifier}`;
  if (await isRateLimited(attemptKey, LOCKOUT_WINDOW_MS, MAX_ATTEMPTS)) {
    return NextResponse.json(
      { error: "Too many attempts for this account. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)))
    .limit(1);
  const user = rows[0];

  // Return the same error whether or not the user is found (prevents username enumeration)
  const genericError = async () => {
    await recordAttempt(attemptKey);
    return NextResponse.json({ error: "Incorrect username/email or password." }, { status: 401 });
  };

  if (!user) return genericError();

  const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!valid) return genericError();

  if (user.status === "suspended") {
    return NextResponse.json({ error: "Your account has been suspended. Please contact support." }, { status: 403 });
  }

  await clearAttempts(attemptKey);
  await createSession(user.id);
  return NextResponse.json({ ok: true, username: user.username, role: user.role });
}
