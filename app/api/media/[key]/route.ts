import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Serves media files directly from Cloudflare R2.
 *
 * Mobile browsers (Safari on iOS in particular, and many Android builds) refuse to load or
 * play a <video> at all unless the server honors HTTP Range requests (206 Partial Content) —
 * without that, the element never gets a first frame either, which is why thumbnails were
 * blank on mobile too. This handler parses the `Range` header and serves a partial R2 object
 * when present, falling back to the full object otherwise.
 */
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { env } = getCloudflareContext();

  const rangeHeader = req.headers.get("range");

  if (rangeHeader) {
    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    if (match) {
      const head = await env.BUCKET.head(key);
      if (!head) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const size = head.size;
      const start = Number(match[1]);
      const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;

      if (start >= size || start > end) {
        return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
      }

      const length = end - start + 1;
      const object = await env.BUCKET.get(key, { range: { offset: start, length } });
      if (!object) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("accept-ranges", "bytes");
      headers.set("content-range", `bytes ${start}-${end}/${size}`);
      headers.set("content-length", String(length));
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      return new Response(object.body as ReadableStream, { status: 206, headers });
    }
  }

  const object = await env.BUCKET.get(key);

  if (!object) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("content-length", String(object.size));
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body as ReadableStream, { headers });
}
