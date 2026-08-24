import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { AuthError, requireUser } from "@/lib/auth";
import { createPresignedUploadUrl, R2NotConfiguredError } from "@/lib/r2Presign";

// Kept far below R2's own object-size ceiling (effectively multi-GB) — this is just a sane
// product limit for a "short clip" style upload, not a technical constraint like the old
// Worker-memory-driven 20MB cap. Because the file goes straight from the browser to R2 (see
// lib/r2Presign.ts), the Worker never buffers it, so raising this doesn't risk Error 1102.
const MAX_VIDEO_BYTES = 300 * 1024 * 1024; // 300MB
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

/**
 * Step 1 of the direct-to-R2 video upload flow: mints a short-lived presigned PUT URL for a
 * new object key. The browser then PUTs the raw file bytes straight to that URL (see
 * app/upload/page.tsx), and only afterward calls POST /api/posts with the resulting key —
 * the actual video bytes never pass through this Worker.
 */
export async function POST(req: NextRequest) {
  try {
    await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  let body: { filename?: string; contentType?: string; size?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { filename, contentType, size } = body;
  if (!contentType || !ALLOWED_VIDEO_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: `That file type isn't supported for a video. Allowed: ${ALLOWED_VIDEO_TYPES.join(", ")}.` },
      { status: 400 }
    );
  }
  if (typeof size !== "number" || size <= 0 || size > MAX_VIDEO_BYTES) {
    return NextResponse.json(
      { error: `File is too large — the maximum is ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))}MB.` },
      { status: 400 }
    );
  }

  let uploadUrl: string;
  const ext = (filename ?? "").split(".").pop()?.slice(0, 8) || "mp4";
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
