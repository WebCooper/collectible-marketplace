/**
 * Typed client for the marketplace API (backend/).
 *
 *   import { listingsApi, ApiError } from "@/lib/api";
 *   const featured = await listingsApi.featured(6);
 *
 * Base URL: NEXT_PUBLIC_API_URL (see .env.example).
 */
export { API_URL, AUCTIONS_SOCKET_URL, DEMO_ACCOUNTS_ENABLED } from "./config";
export { ApiError, SESSION_EXPIRED_EVENT, errorMessage, request, toQueryString } from "./http";
export {
  adminApi,
  auctionsApi,
  authApi,
  certificatesApi,
  healthApi,
  listingsApi,
  notificationsApi,
  ordersApi,
  reportsApi,
  usersApi,
} from "./endpoints";
export type * from "./types";
