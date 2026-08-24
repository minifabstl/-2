import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Baseline security headers on every response — defense-in-depth alongside Cloudflare's own
  // edge protections. None of these change app behavior; they just tell browsers to be strict.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stops the site from being iframed elsewhere (clickjacking protection).
          { key: "X-Frame-Options", value: "DENY" },
          // Stops browsers from guessing content types away from what we declare.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak the full referring URL (which can contain post/search content) to
          // other sites when a link is clicked.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features this app never uses.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

// Integrates the local `next dev` server with Cloudflare Pages (so D1/R2 bindings
// are also reachable locally). Does not affect the prod build.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
