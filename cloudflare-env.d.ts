// Cloudflare binding types — must match the binding names in wrangler.toml.
export {};

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    BUCKET: R2Bucket;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
  }
}
