import type { Metadata } from "next";
import { Geist, Cinzel } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
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
      className={`${geistSans.variable} ${cinzel.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#0a0e17] text-zinc-100 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
