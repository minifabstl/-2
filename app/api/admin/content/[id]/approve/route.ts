import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, posts, users } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";
import { sendContentApprovedEmail } from "@/lib/email";

/** Approves a pending (or flagged) piece of content and publishes it. Admin only. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const { id } = await params;
  const db = getDb();
  const rows = await db
    .select({ status: posts.status, title: posts.title, email: users.email, notifyOnApproval: users.notifyOnApproval })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, id))
    .limit(1);
  const target = rows[0];
  if (!target) return NextResponse.json({ error: "Content not found." }, { status: 404 });

  await db.update(posts).set({ status: "live" }).where(eq(posts.id, id));

  if (target.notifyOnApproval) {
    await sendContentApprovedEmail(target.email, target.title).catch(() => {});
  }

  return NextResponse.json({ ok: true, status: "live" });
}
