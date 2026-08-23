import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * Connects to the D1 database with Drizzle in the Cloudflare Pages/Workers environment.
 * The [[d1_databases]] binding name in `wrangler.toml` must be "DB".
 */
export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

export * from "./schema";
