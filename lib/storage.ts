import { getCloudflareContext } from "@opennextjs/cloudflare";
import { nanoid } from "nanoid";

/** Uploads a video/photo file to Cloudflare R2, returns its unique key. */
export async function uploadMedia(file: File): Promise<string> {
  const { env } = getCloudflareContext();
  const ext = file.name.split(".").pop() || "bin";
  const key = `${nanoid(24)}.${ext}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  return key;
}

/** URL produced by the API route (app/api/media/[key]/route.ts) that reads the media from R2. */
export function mediaUrl(key: string): string {
  return `/api/media/${key}`;
}
