import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, or } from "drizzle-orm";
import { getDb, users } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";

/** Updates the current user's username and/or email. */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => null);
  const username = (body?.username ?? "").trim().toLowerCase();
  const email = (body?.email ?? "").trim().toLowerCase();

  if (username && !/^[a-z0-9_.]{3,24}$/.test(username)) {
    return NextResponse.json({ error: "Username must be 3-24 characters (letters, numbers, . _)." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const db = getDb();

  const nextUsername = username || user.username;
  const nextEmail = email || user.email;

  if (nextUsername !== user.username || nextEmail !== user.email) {
    const conflict = await db
      .select({ id: users.id })
      .from(users)
      .where(and(ne(users.id, user.id), or(eq(users.username, nextUsername), eq(users.email, nextEmail))))
      .limit(1);
    if (conflict.length > 0) {
      return NextResponse.json({ error: "This username or email is already in use." }, { status: 409 });
    }
  }

  await db.update(users).set({ username: nextUsername, email: nextEmail }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true, username: nextUsername, email: nextEmail });
}
