import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Özel/gizli sayfalar arama motorlarında indekslenmesin.
        disallow: ["/admin", "/api", "/profile", "/upload", "/login", "/reset-password", "/forgot-password"],
      },
    ],
    sitemap: "https://leakedfap.org/sitemap.xml",
  };
}
