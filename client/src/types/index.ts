/**
 * Presentation-only types for static marketing content.
 *
 * Marketplace data (listings, auctions, users, orders...) comes from the API;
 * its types live in `@/lib/api/types`.
 */
import type { Category } from "@/lib/api";

export type CategoryIcon = "Coins" | "Award" | "Crown" | "Banknote" | "Stamp" | "Shield";

export interface CategoryInfo {
  category: Category;
  name: string;
  sinhalaName: string;
  description: string;
  eraRange: string;
  icon: CategoryIcon;
  tag: string;
}

export interface MarketplaceStat {
  label: string;
  sinhalaLabel?: string;
  value: string;
  subtext: string;
  trend?: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  collectorName: string;
  role: string;
  institution: string;
  location: string;
  avatar: string;
  verifiedAcquisition: string;
  rating: number;
  memberSince: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  badge: string;
}
