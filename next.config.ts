import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Integrates the local `next dev` server with Cloudflare Pages (so D1/R2 bindings
// are also reachable locally). Does not affect the prod build.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
