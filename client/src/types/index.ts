export type SriLankanEra = 
  | "Anuradhapura & Polonnaruwa (377 BC – 1310 AD)"
  | "Kotte & Kandy Kingdom (1412 – 1815 AD)"
  | "Portuguese & Dutch Ceylon (1505 – 1796 AD)"
  | "British Ceylon (1796 – 1948 AD)"
  | "Dominion & Republic of Sri Lanka (1948 – Present)";

export type CategorySlug = 
  | "ancient-coins"
  | "proof-commemoratives"
  | "currency-notes"
  | "stamps"
  | "medals";

export interface Category {
  id: string;
  slug: CategorySlug;
  name: string;
  sinhalaName: string;
  itemCount: number;
  description: string;
  eraRange: string;
  icon: string;
  tag: string;
  accentColor: string;
}

export type GradingService = "PCGS" | "NGC" | "PMG" | "SLNS" | "ANACS" | "Spink";

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: "collector" | "verified_dealer" | "numismatic_expert" | "admin";
  rating: number;
  salesCount: number;
  isVerifiedCollector: boolean;
  isKycVerified: boolean;
  memberSince: string;
  location: string;
  badges: string[];
}

export interface Bid {
  id: string;
  listingId: string;
  bidderId: string;
  bidderName: string;
  bidderAvatar?: string;
  amount: number; // In LKR
  placedAt: string; // ISO date string
  isWinning: boolean;
  verifiedBid: boolean;
}

export interface Listing {
  id: string;
  title: string;
  sinhalaTitle?: string;
  slug: string;
  category: CategorySlug;
  era: SriLankanEra;
  year: number | string;
  monarchOrAuthority: string; // e.g., "King Parakramabahu I", "Dutch East India Co. (VOC)", "King George VI", "CBSL"
  denomination: string; // e.g., "1 Massa (Kahavanu)", "1 Stuiver Dump", "5 Rupees Crown", "1000 Rupees"
  metalOrMaterial?: string; // e.g., "Gold-Plated Bronze", "0.925 Sterling Silver", "Copper Dump", "Watermarked Banknote Rag"
  condition: string;
  gradingService?: GradingService;
  grade?: string; // e.g., "PCGS MS-66", "Choice Very Fine 35", "PMG Choice UNC 64 EPQ"
  certificationNumber?: string;
  startingBid: number; // In LKR
  currentBid: number; // In LKR
  buyNowPrice?: number; // In LKR
  reservePrice?: number; // In LKR
  reserveMet: boolean;
  bidCount: number;
  endsAt: string; // ISO date string
  imageUrl: string;
  secondaryImages?: string[];
  rarityLevel: "High Heritage" | "Extremely Rare" | "Museum Grade" | "Uncirculated Proof" | "Commemorative Issue";
  provenance: string;
  historicalContext: string;
  seller: User;
  bids?: Bid[];
  isLive: boolean;
  isFeatured?: boolean;
  isHot?: boolean;
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
