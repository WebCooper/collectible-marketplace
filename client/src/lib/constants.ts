import type {
  CategoryInfo,
  HowItWorksStep,
  MarketplaceStat,
  Testimonial,
} from "@/types";
import type { Category, ItemCondition, ListingSort } from "@/lib/api";

export const SITE_NAME = "LankaNumis";
export const SITE_TAGLINE = "Sri Lanka's Premier Bourse for Rare Coins, Currency Notes & Philately";

export const NAV_LINKS = [
  { name: "Explore Auctions", href: "/listings?listingType=AUCTION" },
  { name: "Curated Eras", href: "/#categories" },
  { name: "Live Lots", href: "/#featured" },
  { name: "Authentication Protocol", href: "/#how-it-works" },
  { name: "Curator Reviews", href: "/#testimonials" },
];

/**
 * Presentation copy for each backend `Category` enum value. The live item
 * counts come from GET /listings/categories.
 */
export const CATEGORIES: CategoryInfo[] = [
  {
    category: "OLD_COINS",
    name: "Ancient & Colonial Coins",
    sinhalaName: "පුරාණ කාසි සහ කහවනු",
    description:
      "Anuradhapura & Polonnaruwa gold Kahavanu, Parakramabahu I Massa, Dutch VOC duits and British Ceylon copper issues.",
    eraRange: "377 BC – 1948 AD",
    icon: "Coins",
    tag: "Heritage Treasure",
  },
  {
    category: "PROOF_COINS",
    name: "CBSL Proof Coins",
    sinhalaName: "මහ බැංකු සහතික කාසි",
    description:
      "Central Bank of Sri Lanka proof sets and gold proofs, including the 1998 50th Independence 5,000 Rupees.",
    eraRange: "1970 – Present",
    icon: "Award",
    tag: "High Demand",
  },
  {
    category: "COMMEMORATIVE_COINS",
    name: "Commemorative Crowns",
    sinhalaName: "සමරු කාසි",
    description:
      "1957 Buddha Jayanthi silver crowns and limited commemorative issues marking national milestones.",
    eraRange: "1957 – Present",
    icon: "Crown",
    tag: "Collector Favourite",
  },
  {
    category: "CURRENCY_NOTES",
    name: "Historic Ceylon Currency Notes",
    sinhalaName: "ඓතිහාසික ලංකා මුදල් නෝට්ටු",
    description:
      "British Ceylon King George VI pictorials, Queen Elizabeth II 1952 series and Central Bank of Ceylon notes.",
    eraRange: "1885 – 1991 AD",
    icon: "Banknote",
    tag: "Museum Grade",
  },
  {
    category: "STAMPS",
    name: "Ceylon Philately & Vintage Stamps",
    sinhalaName: "ලංකා පැරණි මුද්දර",
    description:
      "1857 Chalon Head imperforates, 1935 Silver Jubilee issues and 1948 Independence first-day covers.",
    eraRange: "1857 – 1972 AD",
    icon: "Stamp",
    tag: "Rare Specimens",
  },
  {
    category: "MEDALS",
    name: "Sri Lankan Medals & Militaria",
    sinhalaName: "ලංකා පදක්කම් සහ සම්මාන",
    description:
      "1948 Ceylon Police Independence Medals, Volunteer Medical Corps crosses and state orders of honour.",
    eraRange: "1914 – Present",
    icon: "Shield",
    tag: "Certified Historic",
  },
];

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c.category, c.name]),
) as Record<Category, string>;

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  POOR: "Poor",
  FAIR: "Fair",
  GOOD: "Good",
  VERY_GOOD: "Very Good",
  EXCELLENT: "Excellent",
  MINT: "Mint",
};

export const SORT_OPTIONS: { value: ListingSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "ending_soonest", label: "Ending soonest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "popularity", label: "Most viewed" },
];

/** Used when a listing has no image, or its image fails to load. */
export const PLACEHOLDER_IMAGE = "/coin-crest.svg";

export const MARKETPLACE_STATS: MarketplaceStat[] = [
  {
    label: "Authenticated Realization Volume",
    sinhalaLabel: "සත්‍යාපිත වටිනාකම",
    value: "රු 385M+",
    subtext: "Secured transactions via registered escrow and verified provenance",
    trend: "+28% YoY Growth",
  },
  {
    label: "Certified Sri Lankan Specimens",
    sinhalaLabel: "සහතික කළ කාසි සහ මුදල් නෝට්ටු",
    value: "18,400+",
    subtext: "Inspected by PCGS, NGC, PMG, and Sri Lanka Numismatic Society experts",
    trend: "99.98% Provenance Accuracy",
  },
  {
    label: "Registered Connoisseurs & Curators",
    sinhalaLabel: "ලියාපදිංචි එකතුකරන්නන්",
    value: "6,800+",
    subtext: "Across Sri Lanka, the UK, Australia, Singapore, and 40+ countries",
    trend: "+1,400 in 2026",
  },
  {
    label: "Counterfeit Tolerance",
    sinhalaLabel: "ව්‍යාජ විරෝධී සහතිකය",
    value: "0.0%",
    subtext: "Lifetime 100% money-back bond backed by our numismatic indemnity reserve",
    trend: "Full Buyback Guarantee",
  },
];

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: "01",
    title: "Dual Lab & SLNS Physical Authentication",
    description:
      "Every Ceylon specimen is physically inspected by Sri Lanka Numismatic Society certified examiners, tested via XRF non-destructive spectroscopy, and verified against international registries (PCGS, NGC, PMG).",
    badge: "Vault Inspection",
  },
  {
    step: "02",
    title: "Central Bank Regulated Escrow",
    description:
      "Bidding is conducted in Sri Lankan Rupees (LKR) with deposits held in regulated commercial bank escrow accounts in Colombo. Consignors only receive payout after you receive and inspect your slab.",
    badge: "100% Escrow Safeguard",
  },
  {
    step: "03",
    title: "Insured Armored Island-Wide Transit",
    description:
      "Direct hand-delivery across Colombo, Kandy, Galle, Jaffna, and Kurunegala via specialized armored courier with full 100% value insurance coverage, or DHL Express insured for international collectors.",
    badge: "Armored Logistics",
  },
  {
    step: "04",
    title: "Cryptographic Certificate of Provenance",
    description:
      "Receive an indelible digital certificate of ownership cross-referenced with Codrington & British Ceylon numismatic registries, with optional zero-fee climate-vault custody in Colombo.",
    badge: "Provenance Certificate",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "test-sl-1",
    quote:
      "Finding an authentic 1957 Buddha Jayanthi Crown in MS-66 Proof-like condition with full original luster in Sri Lanka was nearly impossible until LankaNumis. The piece arrived in sealed PCGS encapsulation with tamper-evident inspection report.",
    collectorName: "Prof. Chandana Jayasuriya",
    role: "Senior Numismatist & Historian",
    institution: "Sri Lanka Numismatic Society",
    location: "Colombo, Sri Lanka",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    verifiedAcquisition: "1957 Buddha Jayanthi Crown (PCGS MS-66)",
    rating: 5,
    memberSince: "2021",
  },
  {
    id: "test-sl-2",
    quote:
      "As a specialist in 19th-century Ceylon postal history, the provenance diligence LankaNumis provided on the 1857 6d Chalon Head exceeded standard auction house documentation in London. The escrow bidding experience was seamless.",
    collectorName: "Dr. Alistair MacIntyre",
    role: "Fellow & British Empire Specialist",
    institution: "Royal Philatelic Society London",
    location: "Edinburgh / Colombo",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    verifiedAcquisition: "1857 Ceylon 6d Chalon Head Imperf",
    rating: 5,
    memberSince: "2022",
  },
  {
    id: "test-sl-3",
    quote:
      "The King Parakramabahu I Massa coin I consigned realized 35% above traditional local auctions. The high-resolution macro photography and international buyer reach make LankaNumis the premier bourse for Sri Lankan heritage.",
    collectorName: "Asoka Wijesinghe",
    role: "Private Vault Curator & Antiquarian",
    institution: "Central Province Cultural Society",
    location: "Kandy, Sri Lanka",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    verifiedAcquisition: "Polonnaruwa Gold Kahavanu",
    rating: 5,
    memberSince: "2020",
  },
];
