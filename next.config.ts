import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Cloudflare Pages ile yerel `next dev` sunucusunu entegre eder (D1/R2 binding'lerine
// yerelde de erişebilmek için). Prod build'ini etkilemez.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
