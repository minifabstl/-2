import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Cloudflare R2'deki medya dosyasını doğrudan yayınlar. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { env } = getCloudflareContext();
  const object = await env.BUCKET.get(key);

  if (!object) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body as ReadableStream, { headers });
}
