import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private/hidden pages should not be indexed by search engines.
        disallow: ["/admin", "/api", "/profile", "/upload", "/login", "/reset-password", "/forgot-password"],
      },
    ],
    sitemap: "https://leakedfap.org/sitemap.xml",
  };
}
