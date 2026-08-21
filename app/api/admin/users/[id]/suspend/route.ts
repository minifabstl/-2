import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";

/** Kullanıcıyı askıya alır / tekrar aktif eder. Sadece admin. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const { id } = await params;
  const db = getDb();
  const rows = await db.select({ status: users.status }).from(users).where(eq(users.id, id)).limit(1);
  const target = rows[0];
  if (!target) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  const nextStatus = target.status === "active" ? "suspended" : "active";
  await db.update(users).set({ status: nextStatus }).where(eq(users.id, id));
  return NextResponse.json({ ok: true, status: nextStatus });
}
