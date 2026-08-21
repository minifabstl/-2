import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { desc, eq } from "drizzle-orm";
import { getDb, posts, users } from "@/db";
import { getCurrentUser, AuthError, requireUser } from "@/lib/auth";
import { uploadMedia, mediaUrl } from "@/lib/storage";

/** Herkese açık akış — giriş yapmadan da görüntülenebilir. */
export async function GET() {
  const db = getDb();
  const currentUser = await getCurrentUser();

  const rows = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      category: posts.category,
      mediaKey: posts.mediaKey,
      thumbnailKey: posts.thumbnailKey,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      username: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.status, "live"))
    .orderBy(desc(posts.createdAt))
    .limit(60);

  return NextResponse.json({
    isLoggedIn: !!currentUser,
    posts: rows.map((p) => ({
      ...p,
      mediaUrl: mediaUrl(p.mediaKey),
      thumbnailUrl: p.thumbnailKey ? mediaUrl(p.thumbnailKey) : null,
    })),
  });
}

/** Yeni gönderi oluşturma — sadece giriş yapmış kullanıcılar. multipart/form-data bekler. */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const form = await req.formData();
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const type = form.get("type") === "photo" ? "photo" : "video";
  const category = (form.get("category") as string) || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Medya dosyası gerekli." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Başlık gerekli." }, { status: 400 });
  }

  const mediaKey = await uploadMedia(file);
  const db = getDb();
  const id = nanoid();
  await db.insert(posts).values({
    id,
    userId: user.id,
    type,
    title,
    category,
    mediaKey,
    status: "live",
    viewCount: 0,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true, id });
}
