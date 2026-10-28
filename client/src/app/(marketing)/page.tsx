import { Metadata } from "next";
import { HeroSection } from "@/components/marketing/hero-section";
import { StatsSection } from "@/components/marketing/stats-section";
import { CategoriesSection } from "@/components/marketing/categories-section";
import { FeaturedListingsSection } from "@/components/marketing/featured-listings-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE_NAME} | ${SITE_TAGLINE}`,
  description:
    "The world's premier digital bourse for authenticated high-value rare coins, vintage philately, paper money, and historic antiquities with 100% escrow protection.",
  keywords: [
    "rare coins",
    "numismatics",
    "vintage stamps",
    "philately",
    "PCGS certified",
    "NGC ancients",
    "PMG banknotes",
    "high relief double eagle",
    "penny black",
    "escrow auction",
  ],
};

export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <CategoriesSection />
      <FeaturedListingsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}
