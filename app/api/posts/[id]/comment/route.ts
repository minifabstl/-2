import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { desc, eq } from "drizzle-orm";
import { getDb, comments, users, posts } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";
import { sendNewCommentEmail } from "@/lib/email";

/** Lists the comments on a post — visible to everyone. */
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

/** Add a comment — logged-in users ONLY. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;

  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "You must be a member to comment." }, { status: 401 });
    }
    throw e;
  }

  const body = await req.json().catch(() => null);
  const text = (body?.text ?? "").trim();
  if (!text || text.length > 500) {
    return NextResponse.json({ error: "Comment must be 1-500 characters." }, { status: 400 });
  }

  const db = getDb();
  const id = nanoid();
  await db.insert(comments).values({ id, postId, userId: user.id, text, createdAt: new Date() });

  // Notify the post's owner by email, unless they're commenting on their own post or have this notification off.
  const ownerRows = await db
    .select({ userId: posts.userId, title: posts.title, email: users.email, notifyOnComment: users.notifyOnComment })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, postId))
    .limit(1);
  const owner = ownerRows[0];
  if (owner && owner.userId !== user.id && owner.notifyOnComment) {
    await sendNewCommentEmail(owner.email, owner.title, user.username).catch(() => {});
  }

  return NextResponse.json({ ok: true, id, username: user.username });
}
