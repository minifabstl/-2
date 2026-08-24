import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, posts } from "@/db";
import { uploadMedia } from "@/lib/storage";

/**
 * Best-effort backfill for posts uploaded before thumbnail capture existed (see
 * app/upload/page.tsx and app/api/posts/route.ts). components/PostCard.tsx calls this once,
 * client-side, the first time any visitor's browser successfully decodes a frame from a video
 * that has no thumbnailKey yet — so older content quietly gains a real poster image over time
 * without needing a server-side video pipeline (Cloudflare Workers can't run ffmpeg).
 *
 * No auth required (any visitor's browser can trigger this) — it's harmless: it only ever
 * writes a thumbnail for a post that doesn't already have one.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;

  const form = await req.formData();
  const thumbnail = form.get("thumbnail");
  if (!(thumbnail instanceof File)) {
    return NextResponse.json({ error: "A thumbnail file is required." }, { status: 400 });
  }

  const db = getDb();
  const [target] = await db.select({ id: posts.id }).from(posts).where(and(eq(posts.id, postId), isNull(posts.thumbnailKey))).limit(1);

  if (!target) {
    // Either the post doesn't exist, or it already has a thumbnail — nothing to do.
    return NextResponse.json({ ok: true, skipped: true });
  }

  const thumbnailKey = await uploadMedia(thumbnail);
  await db.update(posts).set({ thumbnailKey }).where(and(eq(posts.id, postId), isNull(posts.thumbnailKey)));

  return NextResponse.json({ ok: true });
}
