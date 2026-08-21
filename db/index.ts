import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * Cloudflare Pages/Workers ortamında D1 veritabanına Drizzle ile bağlanır.
 * `wrangler.toml` içindeki [[d1_databases]] binding adı "DB" olmalı.
 */
export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

export * from "./schema";
