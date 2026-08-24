import { getCloudflareContext } from "@opennextjs/cloudflare";
import { nanoid } from "nanoid";

/** Uploads a video/photo file to Cloudflare R2, returns its unique key. */
export async function uploadMedia(file: File): Promise<string> {
  const { env } = getCloudflareContext();
  const ext = file.name.split(".").pop() || "bin";
  const key = `${nanoid(24)}.${ext}`;
  // Stream straight to R2 instead of buffering the whole file into a second in-memory
  // ArrayBuffer (file.arrayBuffer()) — halves peak memory in the Worker, which matters since
  // formData() upstream already holds the file in memory once and Workers have a fixed 128MB
  // per-request ceiling (see the MEDIA_LIMITS comment in app/api/posts/route.ts).
  await env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });
  return key;
}

/** URL produced by the API route (app/api/media/[key]/route.ts) that reads the media from R2. */
export function mediaUrl(key: string): string {
  return `/api/media/${key}`;
}
