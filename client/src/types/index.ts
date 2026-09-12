export type CategorySlug = 
  | "coins"
  | "stamps"
  | "banknotes"
  | "antiquities"
  | "comics"
  | "watches";

export interface Category {
  id: string;
  slug: CategorySlug;
  name: string;
  itemCount: number;
  description: string;
  accentColor: string;
  icon: string;
  tag: string;
}

export type GradingService = "PCGS" | "NGC" | "PMG" | "CGC" | "PSA" | "ANACS";

export interface Seller {
  name: string;
  handle: string;
  avatar: string;
  rating: number;
  salesCount: number;
  isVerifiedDealer: boolean;
}

export interface CollectibleItem {
  id: string;
  title: string;
  slug: string;
  category: CategorySlug;
  year: number | string;
  origin: string;
  gradingService?: GradingService;
  grade?: string; // e.g., "MS-67+", "GEM UNC 68 EPQ", "VF 30"
  certificationNumber?: string;
  currentBid: number;
  buyNowPrice?: number;
  reserveMet: boolean;
  bidCount: number;
  endsAt: string; // ISO date string
  imageUrl: string;
  secondaryImages?: string[];
  rarityLevel: "Historical" | "Extremely Rare" | "Museum Grade" | "Uncirculated" | "Unique Specimen";
  provenance: string;
  seller: Seller;
  isFeatured?: boolean;
  isHot?: boolean;
}

export interface Testimonial {
  id: string;
  quote: string;
  collectorName: string;
  role: string;
  location: string;
  avatar: string;
  verifiedPiece: string;
  rating: number;
  memberSince: string;
}

export interface MarketplaceStat {
  label: string;
  value: string;
  subtext: string;
  trend?: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  badge: string;
}
