import type { MetadataRoute } from "next";

const SITE_URL = "https://leakedfap.org";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/explore`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/creator-program`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/models`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${SITE_URL}/search`, changeFrequency: "hourly", priority: 0.6 },
    { url: `${SITE_URL}/sss`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
