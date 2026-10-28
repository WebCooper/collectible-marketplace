// Shapes returned by the marketplace API (see backend/docs/API.md).
// Money comes back as decimal strings, dates as ISO strings.

export type Role = "BUYER" | "SELLER" | "APPRAISER" | "ADMIN";
export type UserStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED";
export type Category =
  | "OLD_COINS"
  | "PROOF_COINS"
  | "COMMEMORATIVE_COINS"
  | "CURRENCY_NOTES"
  | "STAMPS"
  | "MEDALS";
export type ItemCondition =
  | "POOR"
  | "FAIR"
  | "GOOD"
  | "VERY_GOOD"
  | "EXCELLENT"
  | "MINT";
export type ListingType = "FIXED_PRICE" | "AUCTION";
export type ListingStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "ACTIVE"
  | "SOLD"
  | "EXPIRED"
  | "WITHDRAWN"
  | "REMOVED";
export type CertificateStatus = "PENDING" | "APPROVED" | "REJECTED";
export type VerificationDecision =
  | "APPROVED"
  | "REJECTED"
  | "MORE_EVIDENCE_REQUESTED";
export type AuctionStatus = "SCHEDULED" | "ACTIVE" | "ENDED" | "CANCELLED";
export type BidStatus = "ACTIVE" | "OUTBID" | "WON" | "LOST";
export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";
export type PaymentStatus = "INITIATED" | "SUCCEEDED" | "FAILED" | "REFUNDED";
export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
export type ListingSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "ending_soonest"
  | "popularity";

export interface Page<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export interface Profile extends SessionUser {
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  bio: string | null;
  createdAt: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  activeListings: number;
  completedSales: number;
}

export interface UserRef {
  id: string;
  name: string;
  avatarUrl?: string | null;
  email?: string;
  createdAt?: string;
}

export interface AuctionSummary {
  id: string;
  currentPrice: string;
  endTime: string;
  status: AuctionStatus;
  bidCount: number;
  buyNowPrice: string | null;
}

export interface ListingCard {
  id: string;
  title: string;
  category: Category;
  condition: ItemCondition;
  startingPrice: string;
  listingType: ListingType;
  status: ListingStatus;
  isVerified: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  images: { url: string }[];
  seller: UserRef;
  auction: AuctionSummary | null;
}

export interface ListingImage {
  id?: string;
  url: string;
  position?: number;
}

export interface Certificate {
  id: string;
  fileName: string;
  fileUrl?: string;
  issuer: string | null;
  status: CertificateStatus;
  uploadedAt: string;
}

export interface VerificationRecord {
  id: string;
  decision: VerificationDecision;
  comments: string | null;
  appraisedValue: string | null;
  verifiedAt: string;
  appraiser: { id?: string; name: string };
  certificate?: { id: string; fileName: string; issuer: string | null } | null;
}

export interface Auction {
  id: string;
  listingId: string;
  startPrice: string;
  minIncrement: string;
  currentPrice: string;
  buyNowPrice: string | null;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  winnerId: string | null;
  bidCount: number;
  extensionCount: number;
  listing?: { id: string; title: string; sellerId: string; status: ListingStatus };
  winner?: { id: string; name: string } | null;
}

export interface ListingDetail {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: Category;
  condition: ItemCondition;
  era: string | null;
  denomination: string | null;
  startingPrice: string;
  listingType: ListingType;
  status: ListingStatus;
  isVerified: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  images: ListingImage[];
  seller: UserRef;
  certificates: Certificate[];
  verifications: VerificationRecord[];
  auction: Auction | null;
  _count?: { orders: number };
}

export interface Bid {
  id: string;
  amount: string;
  status: BidStatus;
  placedAt: string;
  bidder: { id: string; name: string };
}

export interface MyBid {
  id: string;
  amount: string;
  status: BidStatus;
  placedAt: string;
  auction: {
    id: string;
    currentPrice: string;
    endTime: string;
    status: AuctionStatus;
    winnerId: string | null;
    listing: { id: string; title: string };
  };
}

export interface Payment {
  status: PaymentStatus;
  provider: string;
  transactionRef: string;
  amount?: string;
}

export interface Dispute {
  id: string;
  status: DisputeStatus;
  reason?: string;
  details?: string | null;
  resolution?: string | null;
  createdAt?: string;
}

export interface Order {
  id: string;
  listingId: string;
  auctionId: string | null;
  buyerId: string;
  sellerId: string;
  amount: string;
  status: OrderStatus;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  listing: { id: string; title: string; images?: { url: string }[] };
  payment: Payment | null;
  buyer: UserRef;
  seller: UserRef;
  dispute: Dispute | null;
}

export interface CheckoutResult {
  order: Order;
  payment: {
    transactionRef: string;
    redirectUrl?: string;
    formFields?: Record<string, string>;
  };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  readStatus: boolean;
  payload: Record<string, string> | null;
  sentAt: string;
}

export interface ListingFilters {
  q?: string;
  category?: Category;
  condition?: ItemCondition;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  featuredOnly?: boolean;
  sellerId?: string;
  sort?: ListingSort;
  page?: number;
  limit?: number;
}

export interface ListingInput {
  title: string;
  description: string;
  category: Category;
  condition: ItemCondition;
  era?: string;
  denomination?: string;
  startingPrice: number;
  listingType?: ListingType;
  images?: { url: string; position?: number }[];
  certificates?: { fileUrl: string; fileName: string; issuer?: string }[];
}
