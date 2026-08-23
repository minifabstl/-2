import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";

/** Grants or revokes the "Verified Content Creator" Creator Program tier. Admin only. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const { id } = await params;
  const db = getDb();
  const rows = await db.select({ verifiedCreator: users.verifiedCreator }).from(users).where(eq(users.id, id)).limit(1);
  const target = rows[0];
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const next = !target.verifiedCreator;
  await db.update(users).set({ verifiedCreator: next }).where(eq(users.id, id));
  return NextResponse.json({ ok: true, verifiedCreator: next });
}
