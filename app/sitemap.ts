import type { MetadataRoute } from "next";

const SITE_URL = "https://leakedfap.org";
const CATEGORIES = ["muzik", "oyun", "egitim", "spor", "teknoloji", "komedi"];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/explore`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/sss`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((slug) => ({
    url: `${SITE_URL}/explore?kategori=${slug}`,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes];
}
