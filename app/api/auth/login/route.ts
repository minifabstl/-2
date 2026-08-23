import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { getDb, users } from "@/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const identifier = (body?.identifier ?? "").trim().toLowerCase();
  const password = body?.password ?? "";

  if (!identifier || !password) {
    return NextResponse.json({ error: "Username/email and password are required." }, { status: 400 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)))
    .limit(1);
  const user = rows[0];

  // Return the same error whether or not the user is found (prevents username enumeration)
  const genericError = () => NextResponse.json({ error: "Incorrect username/email or password." }, { status: 401 });

  if (!user) return genericError();

  const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!valid) return genericError();

  if (user.status === "suspended") {
    return NextResponse.json({ error: "Your account has been suspended. Please contact support." }, { status: 403 });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, username: user.username, role: user.role });
}
