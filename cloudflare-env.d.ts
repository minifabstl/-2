// Cloudflare binding types — must match the binding names in wrangler.toml.
export {};

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    BUCKET: R2Bucket;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    // R2 S3-compatible API credentials — used only to sign short-lived, scoped presigned PUT
    // URLs (lib/r2Presign.ts) so large video uploads go straight from the browser to R2 instead
    // of being buffered through the Worker (which has a fixed 128MB memory ceiling). Set with:
    //   npx wrangler secret put R2_ACCESS_KEY_ID
    //   npx wrangler secret put R2_SECRET_ACCESS_KEY
    R2_ACCOUNT_ID?: string;
    R2_ACCESS_KEY_ID?: string;
    R2_SECRET_ACCESS_KEY?: string;
  }
}
