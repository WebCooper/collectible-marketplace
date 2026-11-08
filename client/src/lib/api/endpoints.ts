/**
 * One typed function per operation in backend/docs/openapi.json, grouped by
 * the spec's tags. Paths, methods and bodies match the spec exactly; the
 * comment on each function names its operationId.
 *
 * Every call sends the session cookies (`credentials: "include"`), so routes
 * marked `security: bearer` in the spec work as soon as the user signs in.
 */
import { request } from "./http";
import type {
  AdminDispute,
  AdminDisputesQuery,
  AdminReportsQuery,
  AdminUser,
  AdminUsersQuery,
  Analytics,
  AuditLogEntry,
  Auction,
  AuctionRow,
  Bid,
  CategoryCount,
  Certificate,
  CertificateInput,
  ChangePasswordRequest,
  CheckoutRequest,
  CheckoutResponse,
  CreateAuctionRequest,
  CreateListingRequest,
  CreateReportRequest,
  CreateStaffUserRequest,
  Dispute,
  EmailRequest,
  HealthResponse,
  ListingCard,
  ListingDetail,
  LoginRequest,
  ManualPaymentCallback,
  MessageResponse,
  ModerateListingRequest,
  MyBid,
  Notification,
  NotificationsQuery,
  Order,
  OrdersQuery,
  PageQuery,
  Paginated,
  PlaceBidRequest,
  PlacedBid,
  PublicProfile,
  RaiseDisputeRequest,
  ReadinessResponse,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse,
  Report,
  ResetPasswordRequest,
  ResolveDisputeRequest,
  ResolveReportRequest,
  ReviewQueueItem,
  SearchListingsQuery,
  Session,
  SuspendUserRequest,
  TokenIdentity,
  UpdateListingRequest,
  UpdateOrderStatusRequest,
  UpdateProfileRequest,
  UserProfile,
  VerificationDecisionRequest,
  VerificationRecord,
  VerifyOtpRequest,
} from "./types";

const id = (value: string) => encodeURIComponent(value);

// --- health ----------------------------------------------------------------

export const healthApi = {
  /** HealthController_health - GET /health */
  health: () => request<HealthResponse>("/health"),
  /** HealthController_ready - GET /ready (always 200; check `status`) */
  ready: () => request<ReadinessResponse>("/ready"),
};

// --- auth ------------------------------------------------------------------

export const authApi = {
  /** AuthController_register - POST /auth/register */
  register: (body: RegisterRequest) =>
    request<RegisterResponse>("/auth/register", { method: "POST", body }),
  /** AuthController_verifyOtp - POST /auth/verify-otp (signs the user in) */
  verifyOtp: (body: VerifyOtpRequest) =>
    request<Session>("/auth/verify-otp", { method: "POST", body }),
  /** AuthController_resendOtp - POST /auth/resend-otp */
  resendOtp: (body: EmailRequest) =>
    request<MessageResponse>("/auth/resend-otp", { method: "POST", body }),
  /** AuthController_login - POST /auth/login */
  login: (body: LoginRequest) =>
    request<Session>("/auth/login", { method: "POST", body }),
  /** AuthController_refresh - POST /auth/refresh (uses the cookie when body is empty) */
  refresh: (body: RefreshTokenRequest = {}) =>
    request<Session>("/auth/refresh", { method: "POST", body }),
  /** AuthController_logout - POST /auth/logout */
  logout: () => request<MessageResponse>("/auth/logout", { method: "POST" }),
  /** AuthController_forgotPassword - POST /auth/forgot-password */
  forgotPassword: (body: EmailRequest) =>
    request<MessageResponse>("/auth/forgot-password", { method: "POST", body }),
  /** AuthController_resetPassword - POST /auth/reset-password */
  resetPassword: (body: ResetPasswordRequest) =>
    request<MessageResponse>("/auth/reset-password", { method: "POST", body }),
  /** AuthController_me - GET /auth/me */
  me: () => request<TokenIdentity>("/auth/me"),
};

// --- users -----------------------------------------------------------------

export const usersApi = {
  /** UsersController_findMe - GET /users/me */
  me: () => request<UserProfile>("/users/me"),
  /** UsersController_updateProfile - PATCH /users/me */
  updateProfile: (body: UpdateProfileRequest) =>
    request<UserProfile>("/users/me", { method: "PATCH", body }),
  /** UsersController_changePassword - PATCH /users/me/password (signs out every session) */
  changePassword: (body: ChangePasswordRequest) =>
    request<MessageResponse>("/users/me/password", { method: "PATCH", body }),
  /** UsersController_findPublicProfile - GET /users/{id} */
  publicProfile: (userId: string) => request<PublicProfile>(`/users/${id(userId)}`),
  /** UsersController_createStaffUser - POST /users/staff (ADMIN) */
  createStaff: (body: CreateStaffUserRequest) =>
    request<UserProfile>("/users/staff", { method: "POST", body }),
};

// --- listings --------------------------------------------------------------

export const listingsApi = {
  /** ListingsController_search - GET /listings */
  search: (query: SearchListingsQuery = {}) =>
    request<Paginated<ListingCard>>("/listings", { query }),
  /** ListingsController_featured - GET /listings/featured */
  featured: (limit = 8) =>
    request<ListingCard[]>("/listings/featured", { query: { limit } }),
  /** ListingsController_categories - GET /listings/categories */
  categories: () => request<CategoryCount[]>("/listings/categories"),
  /** ListingsController_findMine - GET /listings/mine (SELLER) */
  mine: (query: SearchListingsQuery = {}) =>
    request<Paginated<ListingCard>>("/listings/mine", { query }),
  /** ListingsController_findOne - GET /listings/{id} */
  get: (listingId: string) => request<ListingDetail>(`/listings/${id(listingId)}`),
  /** ListingsController_create - POST /listings (SELLER; enters review) */
  create: (body: CreateListingRequest) =>
    request<ListingDetail>("/listings", { method: "POST", body }),
  /** ListingsController_update - PATCH /listings/{id} (SELLER; re-enters review) */
  update: (listingId: string, body: UpdateListingRequest) =>
    request<ListingDetail>(`/listings/${id(listingId)}`, { method: "PATCH", body }),
  /** ListingsController_withdraw - DELETE /listings/{id} (SELLER) */
  withdraw: (listingId: string) =>
    request<ListingDetail>(`/listings/${id(listingId)}`, { method: "DELETE" }),
};

// --- certificates & verification -------------------------------------------

export const certificatesApi = {
  /** CertificatesController_upload - POST /listings/{id}/certificates (SELLER) */
  upload: (listingId: string, body: CertificateInput) =>
    request<Certificate>(`/listings/${id(listingId)}/certificates`, {
      method: "POST",
      body,
    }),
  /** CertificatesController_findForListing - GET /listings/{id}/certificates */
  forListing: (listingId: string) =>
    request<Certificate[]>(`/listings/${id(listingId)}/certificates`),
  /** CertificatesController_reviewQueue - GET /verification/queue (APPRAISER) */
  reviewQueue: (query: PageQuery = {}) =>
    request<Paginated<ReviewQueueItem>>("/verification/queue", { query }),
  /** CertificatesController_decide - POST /listings/{id}/verification (APPRAISER) */
  decide: (listingId: string, body: VerificationDecisionRequest) =>
    request<VerificationRecord>(`/listings/${id(listingId)}/verification`, {
      method: "POST",
      body,
    }),
  /** CertificatesController_history - GET /listings/{id}/verification */
  history: (listingId: string) =>
    request<VerificationRecord[]>(`/listings/${id(listingId)}/verification`),
};

// --- auctions & bidding ----------------------------------------------------

export const auctionsApi = {
  /** AuctionsController_create - POST /listings/{id}/auction (SELLER) */
  create: (listingId: string, body: CreateAuctionRequest) =>
    request<AuctionRow>(`/listings/${id(listingId)}/auction`, {
      method: "POST",
      body,
    }),
  /** AuctionsController_findOne - GET /auctions/{id} */
  get: (auctionId: string) => request<Auction>(`/auctions/${id(auctionId)}`),
  /** AuctionsController_bidHistory - GET /auctions/{id}/bids */
  bids: (auctionId: string, query: PageQuery = {}) =>
    request<Paginated<Bid>>(`/auctions/${id(auctionId)}/bids`, { query }),
  /** AuctionsController_placeBid - POST /auctions/{id}/bids (BUYER, SELLER) */
  placeBid: (auctionId: string, body: PlaceBidRequest) =>
    request<PlacedBid>(`/auctions/${id(auctionId)}/bids`, { method: "POST", body }),
  /** AuctionsController_buyNow - POST /auctions/{id}/buy-now (BUYER, SELLER) */
  buyNow: (auctionId: string) =>
    request<AuctionRow>(`/auctions/${id(auctionId)}/buy-now`, { method: "POST" }),
  /** AuctionsController_myBids - GET /bids/mine */
  myBids: (query: PageQuery = {}) =>
    request<Paginated<MyBid>>("/bids/mine", { query }),
};

// --- transactions & orders -------------------------------------------------

export const ordersApi = {
  /** OrdersController_checkout - POST /orders/checkout */
  checkout: (body: CheckoutRequest) =>
    request<CheckoutResponse>("/orders/checkout", { method: "POST", body }),
  /** OrdersController_findMine - GET /orders (purchases) */
  purchases: (query: OrdersQuery = {}) =>
    request<Paginated<Order>>("/orders", { query }),
  /** OrdersController_findSales - GET /orders/sales */
  sales: (query: OrdersQuery = {}) =>
    request<Paginated<Order>>("/orders/sales", { query }),
  /** OrdersController_findOne - GET /orders/{id} */
  get: (orderId: string) => request<Order>(`/orders/${id(orderId)}`),
  /** OrdersController_updateStatus - PATCH /orders/{id}/status */
  updateStatus: (orderId: string, body: UpdateOrderStatusRequest) =>
    request<Order>(`/orders/${id(orderId)}/status`, { method: "PATCH", body }),
  /** OrdersController_raiseDispute - POST /orders/{id}/disputes */
  raiseDispute: (orderId: string, body: RaiseDisputeRequest) =>
    request<Dispute>(`/orders/${id(orderId)}/disputes`, { method: "POST", body }),
  /**
   * OrdersController_paymentCallback - POST /payments/callback.
   * Normally called by the payment provider, not the browser. Exposed for the
   * development `manual` gateway, which the API refuses in production.
   */
  paymentCallback: (body: ManualPaymentCallback) =>
    request<{ status: string; alreadyProcessed?: boolean }>("/payments/callback", {
      method: "POST",
      body,
    }),
};

// --- notifications ---------------------------------------------------------

export const notificationsApi = {
  /** NotificationsController_list - GET /notifications */
  list: (query: NotificationsQuery = {}) =>
    request<Paginated<Notification>>("/notifications", { query }),
  /** NotificationsController_unreadCount - GET /notifications/unread-count */
  unreadCount: () => request<{ count: number }>("/notifications/unread-count"),
  /** NotificationsController_markRead - PATCH /notifications/{id}/read */
  markRead: (notificationId: string) =>
    request<{ updated: number }>(`/notifications/${id(notificationId)}/read`, {
      method: "PATCH",
    }),
  /** NotificationsController_markAllRead - PATCH /notifications/read-all */
  markAllRead: () =>
    request<{ updated: number }>("/notifications/read-all", { method: "PATCH" }),
};

// --- reports ---------------------------------------------------------------

export const reportsApi = {
  /** ReportsController_createReport - POST /reports */
  create: (body: CreateReportRequest) =>
    request<Report>("/reports", { method: "POST", body }),
};

// --- administration & moderation (ADMIN; used by the admin/ panel) ----------

export const adminApi = {
  /** AdminController_listUsers - GET /admin/users */
  users: (query: AdminUsersQuery = {}) =>
    request<Paginated<AdminUser>>("/admin/users", { query }),
  /** AdminController_suspendUser - PATCH /admin/users/{id}/suspend */
  suspendUser: (userId: string, body: SuspendUserRequest) =>
    request<AdminUser>(`/admin/users/${id(userId)}/suspend`, { method: "PATCH", body }),
  /** AdminController_reinstateUser - PATCH /admin/users/{id}/reinstate */
  reinstateUser: (userId: string) =>
    request<AdminUser>(`/admin/users/${id(userId)}/reinstate`, { method: "PATCH" }),
  /** AdminController_moderateListing - PATCH /admin/listings/{id}/moderate */
  moderateListing: (listingId: string, body: ModerateListingRequest) =>
    request<ListingDetail>(`/admin/listings/${id(listingId)}/moderate`, {
      method: "PATCH",
      body,
    }),
  /** AdminController_listReports - GET /admin/reports */
  reports: (query: AdminReportsQuery = {}) =>
    request<Paginated<Report>>("/admin/reports", { query }),
  /** AdminController_resolveReport - PATCH /admin/reports/{id}/resolve */
  resolveReport: (reportId: string, body: ResolveReportRequest) =>
    request<Report>(`/admin/reports/${id(reportId)}/resolve`, { method: "PATCH", body }),
  /** AdminController_listDisputes - GET /admin/disputes */
  disputes: (query: AdminDisputesQuery = {}) =>
    request<Paginated<AdminDispute>>("/admin/disputes", { query }),
  /** AdminController_resolveDispute - PATCH /admin/disputes/{id}/resolve */
  resolveDispute: (disputeId: string, body: ResolveDisputeRequest) =>
    request<Dispute>(`/admin/disputes/${id(disputeId)}/resolve`, {
      method: "PATCH",
      body,
    }),
  /** AdminController_analytics - GET /admin/analytics */
  analytics: () => request<Analytics>("/admin/analytics"),
  /** AdminController_auditLog - GET /admin/audit-log */
  auditLog: (limit = 50) =>
    request<AuditLogEntry[]>("/admin/audit-log", { query: { limit } }),
};
