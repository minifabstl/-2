import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";

const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = IBM_Plex_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600"] });

const SITE_URL = "https://leakedfap.org";
const SITE_DESCRIPTION = "Video ve fotoğraf paylaşım platformu. İzlenme başına kazanç, Bitcoin ile ödeme.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "LeakedFap — Paylaştıkça Kazan", template: "%s — LeakedFap" },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "LeakedFap — Paylaştıkça Kazan",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "LeakedFap",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeakedFap — Paylaştıkça Kazan",
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

  return (
    <html lang="tr" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }} />
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
