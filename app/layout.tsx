import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";

const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = IBM_Plex_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "LeakedFap — Paylaştıkça Kazan",
  description: "Video ve fotoğraf paylaşım platformu. İzlenme başına kazanç, Bitcoin ile ödeme.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html lang="tr" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
