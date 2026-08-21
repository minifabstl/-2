import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";
import { getDb, likes } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";

/** Beğen/beğenmekten vazgeç — SADECE giriş yapmış kullanıcılar. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;

  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Beğenmek için üye olmalısın." }, { status: 401 });
    }
    throw e;
  }

  const db = getDb();
  const existing = await db
    .select({ id: likes.id })
    .from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, user.id)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(likes).where(eq(likes.id, existing[0].id));
    return NextResponse.json({ liked: false });
  }

  await db.insert(likes).values({ id: nanoid(), postId, userId: user.id, createdAt: new Date() });
  return NextResponse.json({ liked: true });
}
