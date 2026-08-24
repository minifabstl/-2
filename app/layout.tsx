import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import { count, eq } from "drizzle-orm";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/storage";
import { getDb, posts } from "@/db";
import { getTrendingSearches } from "@/lib/search";
import AppShell from "@/components/AppShell";

const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = IBM_Plex_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600"] });

const SITE_URL = "https://leakedfap.org";
const SITE_DESCRIPTION = "A video and photo sharing platform. Earn per view, get paid straight to your wallet.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "LeakedFap — Share and Earn", template: "%s — LeakedFap" },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "LeakedFap — Share and Earn",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "LeakedFap",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeakedFap — Share and Earn",
    description: SITE_DESCRIPTION,
  },
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LeakedFap",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const avatarUrl = user?.avatarKey ? mediaUrl(user.avatarKey) : null;

  let hasUploaded = false;
  if (user) {
    const db = getDb();
    const [{ n }] = await db.select({ n: count() }).from(posts).where(eq(posts.userId, user.id));
    hasUploaded = n > 0;
  }

  const trending = await getTrendingSearches();

  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }} />
        <AppShell user={user} avatarUrl={avatarUrl} hasUploaded={hasUploaded} trending={trending}>{children}</AppShell>
      </body>
    </html>
  );
}
