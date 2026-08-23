import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";
import { uploadMedia } from "@/lib/storage";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

/** Uploads (or replaces) the current user's profile photo. */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: "The image must be 5MB or smaller." }, { status: 400 });
  }

  const db = getDb();
  const rows = await db.select({ avatarKey: users.avatarKey }).from(users).where(eq(users.id, user.id)).limit(1);
  const previousKey = rows[0]?.avatarKey;

  const key = await uploadMedia(file);
  await db.update(users).set({ avatarKey: key }).where(eq(users.id, user.id));

  if (previousKey) {
    const { env } = getCloudflareContext();
    await env.BUCKET.delete(previousKey).catch(() => {});
  }

  return NextResponse.json({ ok: true, avatarKey: key });
}

/** Removes the current user's profile photo. */
export async function DELETE() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const db = getDb();
  const rows = await db.select({ avatarKey: users.avatarKey }).from(users).where(eq(users.id, user.id)).limit(1);
  const previousKey = rows[0]?.avatarKey;

  await db.update(users).set({ avatarKey: null }).where(eq(users.id, user.id));

  if (previousKey) {
    const { env } = getCloudflareContext();
    await env.BUCKET.delete(previousKey).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
