import { AwsClient } from "aws4fetch";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Presigned-URL uploads for R2, using its S3-compatible API.
 *
 * Why this exists: the normal upload path (browser -> our Worker -> R2, via
 * lib/storage.ts#uploadMedia) buffers the whole file in the Worker's memory
 * (formData() parsing + our own copy), and Cloudflare Workers have a fixed 128MB
 * memory ceiling per request regardless of plan. That's fine for small files (photos,
 * thumbnails) but crashes ("Error 1102: Worker exceeded resource limits") on anything
 * close to that ceiling — which is exactly what happened with the old 95MB video limit.
 *
 * The fix: for videos, the browser uploads the file bytes directly to R2 over a
 * short-lived, single-object presigned PUT URL that this module generates. The file
 * never passes through the Worker at all, so there's no Worker-side size ceiling —
 * only R2's own (much larger, effectively multi-GB) limits apply.
 *
 * Requires three secrets/vars on the Worker (see cloudflare-env.d.ts for how to set them):
 * R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY — from an R2 API Token scoped to
 * "Object Read & Write" on just this project's bucket (Cloudflare dashboard -> R2 -> Manage
 * R2 API Tokens). These are separate from the R2Bucket binding used elsewhere and are only
 * used to *sign* URLs — the actual PUT request goes straight from the visitor's browser to R2.
 */

const PRESIGN_EXPIRY_SECONDS = 10 * 60; // 10 minutes — plenty for an upload to start

export class R2NotConfiguredError extends Error {
  constructor() {
    super("Direct video upload isn't configured yet (missing R2 API credentials).");
    this.name = "R2NotConfiguredError";
  }
}

/**
 * Returns a presigned PUT URL for `key` in the project's R2 bucket. The URL is valid for
 * PRESIGN_EXPIRY_SECONDS and locked to `contentType` (R2 rejects a PUT whose Content-Type
 * header doesn't match what was signed) so a caller can't reuse it to upload something else.
 */
export async function createPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const { env } = getCloudflareContext();
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new R2NotConfiguredError();
  }

  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const bucket = "video-app-media"; // must match wrangler.toml's [[r2_buckets]] bucket_name
  // X-Amz-Expires must be set on the URL *before* signing — aws4fetch only fills in its own
  // 86400s (1 day) default when the query string doesn't already have it (see its signer
  // source), it has no separate "expiresIn" option to pass through `aws: {...}`.
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURIComponent(key)}?X-Amz-Expires=${PRESIGN_EXPIRY_SECONDS}`;

  const signed = await client.sign(
    new Request(endpoint, {
      method: "PUT",
      headers: { "Content-Type": contentType },
    }),
    { aws: { signQuery: true } }
  );

  return signed.url;
}
