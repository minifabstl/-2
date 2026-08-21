import { getCloudflareContext } from "@opennextjs/cloudflare";
import { nanoid } from "nanoid";

/** Video/fotoğraf dosyasını Cloudflare R2'ye yükler, benzersiz anahtarı döndürür. */
export async function uploadMedia(file: File): Promise<string> {
  const { env } = getCloudflareContext();
  const ext = file.name.split(".").pop() || "bin";
  const key = `${nanoid(24)}.${ext}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  return key;
}

/** Medyayı R2'den okuyan API route'unun (app/api/media/[key]/route.ts) ürettiği URL. */
export function mediaUrl(key: string): string {
  return `/api/media/${key}`;
}
