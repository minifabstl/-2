import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq, or } from "drizzle-orm";
import { getDb, users } from "@/db";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = (body?.username ?? "").trim().toLowerCase();
  const email = (body?.email ?? "").trim().toLowerCase();
  const password = body?.password ?? "";
  const bitcoinAddress = (body?.bitcoinAddress ?? "").trim() || null;

  if (!/^[a-z0-9_.]{3,24}$/.test(username)) {
    return NextResponse.json({ error: "Username must be 3-24 characters (letters, numbers, . _)." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "This username or email is already registered." }, { status: 409 });
  }

  const { hash, salt } = await hashPassword(password);
  const id = nanoid();
  await db.insert(users).values({
    id,
    username,
    email,
    passwordHash: hash,
    passwordSalt: salt,
    role: "user",
    status: "active",
    bitcoinAddress,
    createdAt: new Date(),
  });

  await createSession(id);
  return NextResponse.json({ ok: true, username });
}
