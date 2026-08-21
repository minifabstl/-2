import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, posts } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";

/** İçeriği kaldırır / geri yükler. Sadece admin. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const { id } = await params;
  const db = getDb();
  const rows = await db.select({ status: posts.status }).from(posts).where(eq(posts.id, id)).limit(1);
  const target = rows[0];
  if (!target) return NextResponse.json({ error: "İçerik bulunamadı." }, { status: 404 });

  const nextStatus = target.status === "removed" ? "live" : "removed";
  await db.update(posts).set({ status: nextStatus }).where(eq(posts.id, id));
  return NextResponse.json({ ok: true, status: nextStatus });
}
