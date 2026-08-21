import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";

/** Kullanıcının kendi Bitcoin cüzdan adresini günceller. */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => null);
  const bitcoinAddress = (body?.bitcoinAddress ?? "").trim();

  const db = getDb();
  await db.update(users).set({ bitcoinAddress: bitcoinAddress || null }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
