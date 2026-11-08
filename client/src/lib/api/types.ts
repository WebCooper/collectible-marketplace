/**
 * Types for the Sri Lankan Collectible Marketplace API (backend/).
 *
 * Request bodies mirror the DTO schemas in backend/docs/openapi.json.
 * Response shapes come from backend/docs/API.md, because the generated
 * OpenAPI file does not describe response bodies. If the two ever disagree,
 * the backend code wins - update this file to match it.
 *
 * Conventions shared by every endpoint:
 * - Money is sent as a JSON number but returned as a decimal string ("10500").
 * - Dates are ISO 8601 UTC strings; IDs are UUID v4 strings.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type Role = "BUYER" | "SELLER" | "APPRAISER" | "ADMIN";
export type SelfRegisterableRole = Extract<Role, "BUYER" | "SELLER">;
export type StaffRole = Extract<Role, "APPRAISER" | "ADMIN">;
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
export type ListingSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "ending_soonest"
  | "popularity";

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

export type ReportTargetType = "LISTING" | "USER";
export type ReportStatus = "OPEN" | "REVIEWING" | "ACTIONED" | "DISMISSED";
export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
export type DisputeOrderAction = "NONE" | "REFUND_BUYER" | "COMPLETE_ORDER";

export type NotificationType =
  | "OTP"
  | "OUTBID"
  | "AUCTION_STARTING"
  | "AUCTION_ENDING"
  | "AUCTION_WON"
  | "AUCTION_CLOSED"
  | "LISTING_APPROVED"
  | "LISTING_REJECTED"
  | "LISTING_FLAGGED"
  | "ORDER_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "ITEM_SHIPPED"
  | "DISPUTE_UPDATE";
export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS";

// ---------------------------------------------------------------------------
// Shared shapes
// ---------------------------------------------------------------------------

/** LKR amount as returned by the API, e.g. "10500" or "10500.5". */
export type Money = string;

export interface PageQuery {
  page?: number;
  limit?: number;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface MessageResponse {
  message: string;
}

/** Minimal user reference embedded in other resources. */
export interface UserRef {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Auth  (tag: auth)
// ---------------------------------------------------------------------------

/** RegisterDto */
export interface RegisterRequest {
  name: string;
  email: string;
  /** Sri Lankan number, e.g. +94771234567 */
  phone?: string;
  /** 8-72 chars with a lowercase letter, an uppercase letter and a digit */
  password: string;
  role?: SelfRegisterableRole;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

/** VerifyOtpDto */
export interface VerifyOtpRequest {
  email: string;
  code: string;
}

/** ResendOtpDto / ForgotPasswordDto */
export interface EmailRequest {
  email: string;
}

/** LoginDto */
export interface LoginRequest {
  email: string;
  password: string;
}

/** RefreshTokenDto - browser clients omit it and rely on the cookie. */
export interface RefreshTokenRequest {
  refreshToken?: string;
}

/** ResetPasswordDto */
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/** The user object embedded in a session response. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
}

/** Returned by login, verify-otp and refresh (cookies are also set). */
export interface Session {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

/** GET /auth/me - identity carried by the token. */
export interface TokenIdentity {
  id: string;
  email: string;
  role: Role;
}

// ---------------------------------------------------------------------------
// Users  (tag: users)
// ---------------------------------------------------------------------------

/** GET /users/me */
export interface UserProfile extends SessionUser {
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  bio: string | null;
  createdAt: string;
}

/** UpdateProfileDto */
export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
}

/** ChangePasswordDto */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** GET /users/:id */
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

/** CreateStaffUserDto */
export interface CreateStaffUserRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: StaffRole;
}

// ---------------------------------------------------------------------------
// Listings  (tag: listings)
// ---------------------------------------------------------------------------

/** ListingImageDto */
export interface ListingImageInput {
  url: string;
  /** Display order, 0 is the cover image */
  position?: number;
}

/** CertificateInputDto / UploadCertificateDto */
export interface CertificateInput {
  fileUrl: string;
  fileName: string;
  issuer?: string;
}

/** CreateListingDto */
export interface CreateListingRequest {
  title: string;
  description: string;
  category: Category;
  condition: ItemCondition;
  era?: string;
  denomination?: string;
  startingPrice: number;
  listingType?: ListingType;
  images?: ListingImageInput[];
  certificates?: CertificateInput[];
}

/** UpdateListingDto - certificates are added via POST /listings/:id/certificates */
export type UpdateListingRequest = Partial<
  Omit<CreateListingRequest, "certificates">
>;

/** Query for GET /listings and GET /listings/mine */
export interface SearchListingsQuery extends PageQuery {
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
}

/** Auction summary embedded in a listing card. */
export interface ListingCardAuction {
  id: string;
  currentPrice: Money;
  endTime: string;
  status: AuctionStatus;
  bidCount: number;
  buyNowPrice: Money | null;
}

/** Item of GET /listings, /listings/featured and /listings/mine */
export interface ListingCard {
  id: string;
  title: string;
  category: Category;
  condition: ItemCondition;
  startingPrice: Money;
  listingType: ListingType;
  status: ListingStatus;
  isVerified: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  /** Only the cover image */
  images: { url: string }[];
  seller: { id: string; name: string; avatarUrl: string | null };
  /** null for fixed-price items */
  auction: ListingCardAuction | null;
}

export interface ListingImage {
  id: string;
  url: string;
  position: number;
}

/** Certificate as exposed on the public listing detail (no file URL). */
export interface ListingCertificateSummary {
  id: string;
  fileName: string;
  issuer: string | null;
  status: CertificateStatus;
  uploadedAt: string;
}

export interface ListingVerificationSummary {
  id: string;
  decision: VerificationDecision;
  comments: string | null;
  appraisedValue: Money | null;
  verifiedAt: string;
  appraiser: UserRef;
}

/** Full auction row as embedded in listing detail. */
export interface AuctionRow {
  id: string;
  listingId: string;
  startPrice: Money;
  minIncrement: Money;
  currentPrice: Money;
  buyNowPrice: Money | null;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  winnerId: string | null;
  bidCount: number;
  extensionCount: number;
}

/** GET /listings/:id */
export interface ListingDetail {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: Category;
  condition: ItemCondition;
  era: string | null;
  denomination: string | null;
  startingPrice: Money;
  listingType: ListingType;
  status: ListingStatus;
  isVerified: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  images: ListingImage[];
  seller: { id: string; name: string; avatarUrl: string | null; createdAt: string };
  certificates: ListingCertificateSummary[];
  verifications: ListingVerificationSummary[];
  auction: AuctionRow | null;
  _count: { orders: number };
}

/** GET /listings/categories */
export interface CategoryCount {
  category: Category;
  count: number;
}

// ---------------------------------------------------------------------------
// Certificates & verification  (tag: certificates & verification)
// ---------------------------------------------------------------------------

/** Certificate as returned to the owner / appraiser (with file URL). */
export interface Certificate {
  id: string;
  listingId: string;
  fileUrl: string;
  fileName: string;
  issuer: string | null;
  status: CertificateStatus;
  uploadedAt: string;
}

/** VerificationDecisionDto */
export interface VerificationDecisionRequest {
  decision: VerificationDecision;
  certificateId?: string;
  /** Required when rejecting or requesting more evidence */
  comments?: string;
  appraisedValue?: number;
}

/** GET /listings/:id/verification and POST response */
export interface VerificationRecord {
  id: string;
  decision: VerificationDecision;
  comments: string | null;
  appraisedValue: Money | null;
  verifiedAt: string;
  appraiser: UserRef;
  certificate: { id: string; fileName: string; issuer: string | null } | null;
}

/** Item of GET /verification/queue */
export interface ReviewQueueItem {
  id: string;
  title: string;
  category: Category;
  condition: ItemCondition;
  era: string | null;
  denomination: string | null;
  startingPrice: Money;
  description: string;
  createdAt: string;
  seller: { id: string; name: string; email: string };
  images: { url: string }[];
  certificates: Certificate[];
  verifications: VerificationRecord[];
}

// ---------------------------------------------------------------------------
// Auctions & bidding  (tag: auctions & bidding)
// ---------------------------------------------------------------------------

/** CreateAuctionDto */
export interface CreateAuctionRequest {
  startPrice: number;
  minIncrement: number;
  /** ISO date; defaults to now */
  startTime?: string;
  endTime: string;
  buyNowPrice?: number;
}

/** GET /auctions/:id */
export interface Auction extends AuctionRow {
  listing: { id: string; title: string; sellerId: string; status: ListingStatus };
  winner: UserRef | null;
}

/** PlaceBidDto */
export interface PlaceBidRequest {
  amount: number;
}

/** Item of GET /auctions/:id/bids */
export interface Bid {
  id: string;
  amount: Money;
  status: BidStatus;
  placedAt: string;
  bidder: UserRef;
}

interface BidRow {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: Money;
  status: BidStatus;
  placedAt: string;
}

/** POST /auctions/:id/bids response */
export interface PlacedBid extends BidRow {
  bidder: UserRef;
}

/** Item of GET /bids/mine */
export interface MyBid extends BidRow {
  auction: {
    id: string;
    currentPrice: Money;
    endTime: string;
    status: AuctionStatus;
    winnerId: string | null;
    listing: { id: string; title: string };
  };
}

// ---------------------------------------------------------------------------
// Orders & payments  (tag: transactions & orders)
// ---------------------------------------------------------------------------

/** CheckoutDto - send exactly one of auctionId or listingId. */
export interface CheckoutRequest {
  auctionId?: string;
  listingId?: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
}

export interface OrderParty {
  id: string;
  name: string;
  email?: string;
}

export interface Payment {
  id?: string;
  status: PaymentStatus;
  provider: string;
  transactionRef: string;
  amount?: Money;
}

export interface Order {
  id: string;
  listingId: string;
  auctionId: string | null;
  buyerId: string;
  sellerId: string;
  amount: Money;
  status: OrderStatus;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  listing?: { id: string; title: string; images?: { url: string }[] };
  payment?: Payment | null;
  buyer?: OrderParty;
  seller?: OrderParty;
  dispute?: { id: string; status: DisputeStatus } | null;
}

export interface OrdersQuery extends PageQuery {
  status?: OrderStatus;
}

/** POST /orders/checkout response */
export interface CheckoutResponse {
  order: Order;
  payment: {
    transactionRef: string;
    /** Send the buyer here, when the provider uses a hosted page */
    redirectUrl?: string;
    /** Or POST these fields to the provider */
    formFields?: Record<string, string>;
  };
}

/** UpdateOrderStatusDto */
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  trackingNumber?: string;
}

/** RaiseDisputeDto */
export interface RaiseDisputeRequest {
  reason: string;
  details?: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  raisedById: string;
  reason: string;
  details: string | null;
  status: DisputeStatus;
  resolution: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

/**
 * Body accepted by the development `manual` payment gateway only.
 * Real providers post their own signed payloads to /payments/callback.
 */
export interface ManualPaymentCallback {
  transactionRef: string;
  status: "succeeded" | "failed";
  amount?: number;
}

// ---------------------------------------------------------------------------
// Notifications  (tag: notifications)
// ---------------------------------------------------------------------------

export interface NotificationsQuery extends PageQuery {
  unreadOnly?: boolean;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  readStatus: boolean;
  /** IDs for deep links, e.g. { auctionId, listingId } or { orderId } */
  payload: Record<string, string> | null;
  sentAt: string;
}

// ---------------------------------------------------------------------------
// Reports & administration  (tags: reports, administration & moderation)
// ---------------------------------------------------------------------------

/** CreateReportDto */
export interface CreateReportRequest {
  targetType: ReportTargetType;
  reportedListingId?: string;
  reportedUserId?: string;
  reason: string;
  details?: string;
}

export interface Report {
  id: string;
  targetType: ReportTargetType;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter?: UserRef & { email?: string };
  reportedListing?: { id: string; title: string; status: ListingStatus } | null;
  reportedUser?: (UserRef & { email?: string }) | null;
}

export interface AdminUsersQuery extends PageQuery {
  role?: Role;
  status?: UserStatus;
  q?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  _count: { listings: number; ordersAsBuyer: number; reportsAgainst: number };
}

/** SuspendUserDto */
export interface SuspendUserRequest {
  reason: string;
}

/** ModerateListingDto */
export interface ModerateListingRequest {
  status: Extract<ListingStatus, "ACTIVE" | "REMOVED" | "UNDER_REVIEW">;
  /** Required when removing */
  reason?: string;
}

/** ResolveReportDto */
export interface ResolveReportRequest {
  status: Extract<ReportStatus, "ACTIONED" | "DISMISSED" | "REVIEWING">;
  resolutionNote: string;
}

/** ResolveDisputeDto */
export interface ResolveDisputeRequest {
  status: Extract<DisputeStatus, "RESOLVED" | "REJECTED">;
  resolution: string;
  orderAction?: DisputeOrderAction;
}

export interface AdminReportsQuery extends PageQuery {
  status?: ReportStatus;
}

export interface AdminDisputesQuery extends PageQuery {
  status?: DisputeStatus;
}

export interface AdminDispute extends Dispute {
  raisedBy: OrderParty;
  order: Order;
}

export interface Analytics {
  users: { total: number; suspended: number; newThisMonth: number };
  listings: { active: number; underReview: number; byCategory: CategoryCount[] };
  auctions: { live: number };
  sales: { completed: number; grossValue: Money };
  moderation: { openReports: number; openDisputes: number };
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: (UserRef & { role: Role }) | null;
}

// ---------------------------------------------------------------------------
// Health  (tag: health)
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: "ok";
  uptime: number;
}

/** Always HTTP 200 - read `status` to tell ready from degraded. */
export interface ReadinessResponse {
  status: "ready" | "degraded";
  database: "up" | "down";
}

// ---------------------------------------------------------------------------
// Live bidding - Socket.IO namespace /auctions
// ---------------------------------------------------------------------------

export interface BidPlacedEvent {
  auctionId: string;
  currentPrice: Money;
  bidCount: number;
  endTime: string;
  bidder: UserRef;
  placedAt: string;
}

export interface AuctionExtendedEvent {
  auctionId: string;
  endTime: string;
}

export interface AuctionClosedEvent {
  auctionId: string;
  listingId: string;
  finalPrice: Money;
  winner: UserRef | null;
}
