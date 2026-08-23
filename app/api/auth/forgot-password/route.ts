import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb, users, passwordResetCodes } from "@/db";
import { sendPasswordResetCodeEmail } from "@/lib/email";

const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function generateCode() {
  // 6 digits, may start with zero (000000-999999), stored as a string.
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

/**
 * User-initiated password reset — the user enters their email, and if it's
 * registered, a 6-digit code is sent to that email. To avoid leaking whether
 * a username/email exists, this endpoint always returns the same success
 * message regardless of whether the email is registered.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const db = getDb();
  const rows = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email)).limit(1);
  const target = rows[0];

  // We return the same response whether or not the email is registered — to
  // avoid making it externally detectable whether an email exists in the system.
  if (target) {
    const code = generateCode();
    const now = new Date();
    await db.insert(passwordResetCodes).values({
      id: nanoid(),
      userId: target.id,
      code,
      createdAt: now,
      expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      usedAt: null,
    });
    await sendPasswordResetCodeEmail(target.email, code);
  }

  return NextResponse.json({
    ok: true,
    message: "If this email is registered in the system, a reset code has been sent.",
  });
}
