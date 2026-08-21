import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { desc, eq } from "drizzle-orm";
import { getDb, comments, users } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";

/** Bir gönderinin yorumlarını listeler — herkes görebilir. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const db = getDb();
  const rows = await db
    .select({ id: comments.id, text: comments.text, createdAt: comments.createdAt, username: users.username })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))
    .limit(100);
  return NextResponse.json({ comments: rows });
}

/** Yorum ekle — SADECE giriş yapmış kullanıcılar. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;

  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Yorum yapmak için üye olmalısın." }, { status: 401 });
    }
    throw e;
  }

  const body = await req.json().catch(() => null);
  const text = (body?.text ?? "").trim();
  if (!text || text.length > 500) {
    return NextResponse.json({ error: "Yorum 1-500 karakter olmalı." }, { status: 400 });
  }

  const db = getDb();
  const id = nanoid();
  await db.insert(comments).values({ id, postId, userId: user.id, text, createdAt: new Date() });
  return NextResponse.json({ ok: true, id, username: user.username });
}
