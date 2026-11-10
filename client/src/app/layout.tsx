import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SITE_NAME } from "@/lib/constants";
import { AuthProvider } from "@/providers/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${SITE_NAME} | Sri Lankan Rare Collectibles Bourse`,
  description:
    "Sri Lanka's premier marketplace for ancient Kahavanu coins, Ceylon Dutch VOC duits, British Ceylon elephant dump coins, CBSL gold proof sets, and historic currency notes with 100% escrow protection.",
  keywords: [
    "Sri Lanka coins",
    "Kahavanu",
    "Massa coins",
    "Ceylon Dutch VOC duits",
    "Buddha Jayanthi 1957 crown",
    "British Ceylon dump coins",
    "Ceylon banknotes",
    "Ceylon stamps Chalon head",
    "Sri Lankan numismatics",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${display.variable} antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
