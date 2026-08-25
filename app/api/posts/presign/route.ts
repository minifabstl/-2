import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { AuthError, requireUser } from "@/lib/auth";
import { createPresignedUploadUrl, R2NotConfiguredError } from "@/lib/r2Presign";

// Regular members keep sane per-type caps (not a Worker-memory constraint anymore — this is a
// straight-to-R2 upload — just a product limit). Admins get a effectively-unlimited ceiling
// instead (see ADMIN_MAX_BYTES below), for the bulk upload tool (app/admin/bulk-upload/page.tsx).
const USER_MAX_BYTES: Record<"video" | "photo", number> = {
  video: 100 * 1024 * 1024, // 100MB
  photo: 5 * 1024 * 1024, // 5MB
};
// Not literally infinite (a single broken upload could otherwise balloon storage costs
// unnoticed), but far above any real photo/video — effectively no limit for admin use.
const ADMIN_MAX_BYTES = 5 * 1024 * 1024 * 1024; // 5GB

const ALLOWED_TYPES: Record<"video" | "photo", string[]> = {
  video: ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"],
  photo: ["image/png", "image/jpeg", "image/webp"],
};

/**
 * Step 1 of the direct-to-R2 upload flow (used for both video and photo): mints a short-lived
 * presigned PUT URL for a new object key. The browser then PUTs the raw file bytes straight to
 * that URL (see app/upload/page.tsx and app/admin/bulk-upload/page.tsx), and only afterward
 * calls POST /api/posts (or /api/admin/bulk-upload) with the resulting key — the actual file
 * bytes never pass through this Worker, regardless of size.
 */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  let body: { filename?: string; contentType?: string; size?: number; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { filename, contentType, size } = body;
  const mediaType: "video" | "photo" = body.type === "photo" ? "photo" : "video";
  const allowed = ALLOWED_TYPES[mediaType];
  const maxBytes = user.role === "admin" ? ADMIN_MAX_BYTES : USER_MAX_BYTES[mediaType];

  if (!contentType || !allowed.includes(contentType)) {
    return NextResponse.json(
      { error: `That file type isn't supported for a ${mediaType}. Allowed: ${allowed.join(", ")}.` },
      { status: 400 }
    );
  }
  if (typeof size !== "number" || size <= 0 || size > maxBytes) {
    const label =
      maxBytes >= 1024 * 1024 * 1024
        ? `${Math.round(maxBytes / (1024 * 1024 * 1024))}GB`
        : `${Math.round(maxBytes / (1024 * 1024))}MB`;
    return NextResponse.json({ error: `File is too large — the maximum is ${label}.` }, { status: 400 });
  }

  let uploadUrl: string;
  const ext = (filename ?? "").split(".").pop()?.slice(0, 8) || (mediaType === "photo" ? "jpg" : "mp4");
  const key = `${nanoid(24)}.${ext}`;
  try {
    uploadUrl = await createPresignedUploadUrl(key, contentType);
  } catch (e) {
    if (e instanceof R2NotConfiguredError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    throw e;
  }

  return NextResponse.json({ key, uploadUrl });
}
