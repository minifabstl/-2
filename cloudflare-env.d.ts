// Cloudflare binding tipleri — wrangler.toml içindeki binding adlarıyla eşleşmeli.
export {};

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    BUCKET: R2Bucket;
  }
}
