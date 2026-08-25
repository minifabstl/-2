import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { createModel, MODEL_NAME_MAX_LENGTH } from "@/lib/models";
import { uploadMedia } from "@/lib/storage";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB — same ceiling as avatars/thumbnails, well under the Worker's memory limit

/** Creates a new model (directory entry) — any logged-in user can add one. */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const form = await req.formData().catch(() => null);
  const name = form?.get("name");
  const file = form?.get("photo");

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "A name is required." }, { status: 400 });
  }
  if (name.trim().length > MODEL_NAME_MAX_LENGTH) {
    return NextResponse.json({ error: `Name must be ${MODEL_NAME_MAX_LENGTH} characters or fewer.` }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A photo is required." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed for the photo." }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "The photo must be 5MB or smaller." }, { status: 400 });
  }

  const photoKey = await uploadMedia(file);
  const model = await createModel({ name, photoKey, createdByUserId: user.id });

  return NextResponse.json({ ok: true, model });
}
