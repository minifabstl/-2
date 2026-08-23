import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";

/** Returns the current user's notification preferences. */
export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  return NextResponse.json({
    notifyOnApproval: user.notifyOnApproval,
    notifyOnRejection: user.notifyOnRejection,
    notifyOnComment: user.notifyOnComment,
  });
}

/** Updates the current user's notification preferences. */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const update: Partial<{ notifyOnApproval: boolean; notifyOnRejection: boolean; notifyOnComment: boolean }> = {};
  if (typeof body.notifyOnApproval === "boolean") update.notifyOnApproval = body.notifyOnApproval;
  if (typeof body.notifyOnRejection === "boolean") update.notifyOnRejection = body.notifyOnRejection;
  if (typeof body.notifyOnComment === "boolean") update.notifyOnComment = body.notifyOnComment;

  const db = getDb();
  await db.update(users).set(update).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
