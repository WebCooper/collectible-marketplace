import type {
  Auction,
  Bid,
  Certificate,
  CheckoutResult,
  ListingCard,
  ListingDetail,
  ListingFilters,
  ListingInput,
  MyBid,
  Notification,
  Order,
  OrderStatus,
  Page,
  Profile,
  PublicProfile,
  Session,
  VerificationRecord,
  Category,
} from "./types";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

/** Fired when the session cannot be renewed, so the UI can sign the user out. */
export const SESSION_EXPIRED_EVENT = "session-expired";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function toQuery(params?: Query) {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

async function readError(res: Response) {
  try {
    const body = await res.json();
    const message = Array.isArray(body.message)
      ? body.message.join(". ")
      : body.message;
    return new ApiError(res.status, message || res.statusText);
  } catch {
    return new ApiError(res.status, res.statusText || "Request failed");
  }
}

// Concurrent 401s share a single refresh call.
let refreshing: Promise<boolean> | null = null;

function refreshSession() {
  refreshing ??= fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Query;
  /** Skip the refresh-and-retry dance (auth endpoints, guest probes). */
  noRefresh?: boolean;
}

export async function request<T>(
  path: string,
  { method = "GET", body, query, noRefresh }: RequestOptions = {},
): Promise<T> {
  const send = () =>
    fetch(`${API_URL}${path}${toQuery(query)}`, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let res = await send();
  if (res.status === 401 && !noRefresh) {
    if (await refreshSession()) {
      res = await send();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  }
  if (!res.ok) throw await readError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

type Message = { message: string };

export const api = {
  auth: {
    register: (body: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      role: "BUYER" | "SELLER";
    }) =>
      request<Message & { userId: string }>("/auth/register", {
        method: "POST",
        body,
        noRefresh: true,
      }),
    verifyOtp: (email: string, code: string) =>
      request<Session>("/auth/verify-otp", {
        method: "POST",
        body: { email, code },
        noRefresh: true,
      }),
    resendOtp: (email: string) =>
      request<Message>("/auth/resend-otp", {
        method: "POST",
        body: { email },
        noRefresh: true,
      }),
    login: (email: string, password: string) =>
      request<Session>("/auth/login", {
        method: "POST",
        body: { email, password },
        noRefresh: true,
      }),
    logout: () =>
      request<Message>("/auth/logout", { method: "POST", noRefresh: true }),
    forgotPassword: (email: string) =>
      request<Message>("/auth/forgot-password", {
        method: "POST",
        body: { email },
        noRefresh: true,
      }),
    resetPassword: (token: string, password: string) =>
      request<Message>("/auth/reset-password", {
        method: "POST",
        body: { token, password },
        noRefresh: true,
      }),
  },

  users: {
    me: () => request<Profile>("/users/me"),
    update: (body: {
      name?: string;
      phone?: string;
      avatarUrl?: string;
      bio?: string;
    }) => request<Profile>("/users/me", { method: "PATCH", body }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<Message>("/users/me/password", {
        method: "PATCH",
        body: { currentPassword, newPassword },
      }),
    publicProfile: (id: string) => request<PublicProfile>(`/users/${id}`),
  },

  listings: {
    search: (filters: ListingFilters = {}) =>
      request<Page<ListingCard>>("/listings", { query: { ...filters } }),
    featured: (limit = 8) =>
      request<ListingCard[]>("/listings/featured", { query: { limit } }),
    categories: () =>
      request<{ category: Category; count: number }[]>("/listings/categories"),
    mine: (filters: ListingFilters = {}) =>
      request<Page<ListingCard>>("/listings/mine", { query: { ...filters } }),
    get: (id: string) => request<ListingDetail>(`/listings/${id}`),
    create: (body: ListingInput) =>
      request<ListingDetail>("/listings", { method: "POST", body }),
    update: (id: string, body: Partial<Omit<ListingInput, "certificates">>) =>
      request<ListingDetail>(`/listings/${id}`, { method: "PATCH", body }),
    withdraw: (id: string) =>
      request<ListingDetail>(`/listings/${id}`, { method: "DELETE" }),
    certificates: (id: string) =>
      request<Certificate[]>(`/listings/${id}/certificates`),
    addCertificate: (
      id: string,
      body: { fileUrl: string; fileName: string; issuer?: string },
    ) =>
      request<Certificate>(`/listings/${id}/certificates`, {
        method: "POST",
        body,
      }),
    verificationHistory: (id: string) =>
      request<VerificationRecord[]>(`/listings/${id}/verification`),
    createAuction: (
      id: string,
      body: {
        startPrice: number;
        minIncrement: number;
        startTime?: string;
        endTime: string;
        buyNowPrice?: number;
      },
    ) => request<Auction>(`/listings/${id}/auction`, { method: "POST", body }),
  },

  auctions: {
    get: (id: string) => request<Auction>(`/auctions/${id}`),
    bids: (id: string, page = 1, limit = 20) =>
      request<Page<Bid>>(`/auctions/${id}/bids`, { query: { page, limit } }),
    placeBid: (id: string, amount: number) =>
      request<Bid>(`/auctions/${id}/bids`, { method: "POST", body: { amount } }),
    buyNow: (id: string) =>
      request<Auction>(`/auctions/${id}/buy-now`, { method: "POST" }),
    myBids: (page = 1, limit = 20) =>
      request<Page<MyBid>>("/bids/mine", { query: { page, limit } }),
  },

  orders: {
    checkout: (body: {
      auctionId?: string;
      listingId?: string;
      shippingName: string;
      shippingPhone: string;
      shippingAddress: string;
      shippingCity: string;
      shippingPostalCode: string;
    }) =>
      request<CheckoutResult>("/orders/checkout", { method: "POST", body }),
    purchases: (page = 1, status?: OrderStatus) =>
      request<Page<Order>>("/orders", { query: { page, limit: 10, status } }),
    sales: (page = 1, status?: OrderStatus) =>
      request<Page<Order>>("/orders/sales", {
        query: { page, limit: 10, status },
      }),
    get: (id: string) => request<Order>(`/orders/${id}`),
    updateStatus: (id: string, status: OrderStatus, trackingNumber?: string) =>
      request<Order>(`/orders/${id}/status`, {
        method: "PATCH",
        body: { status, trackingNumber: trackingNumber || undefined },
      }),
    raiseDispute: (id: string, reason: string, details?: string) =>
      request(`/orders/${id}/disputes`, {
        method: "POST",
        body: { reason, details: details || undefined },
      }),
  },

  notifications: {
    list: (page = 1, unreadOnly = false) =>
      request<Page<Notification>>("/notifications", {
        query: { page, limit: 20, unreadOnly: unreadOnly || undefined },
      }),
    unreadCount: () =>
      request<{ count: number }>("/notifications/unread-count", {
        noRefresh: true,
      }),
    markRead: (id: string) =>
      request<{ updated: number }>(`/notifications/${id}/read`, {
        method: "PATCH",
      }),
    markAllRead: () =>
      request<{ updated: number }>("/notifications/read-all", {
        method: "PATCH",
      }),
  },

  reports: {
    create: (body: {
      targetType: "LISTING" | "USER";
      reportedListingId?: string;
      reportedUserId?: string;
      reason: string;
      details?: string;
    }) => request("/reports", { method: "POST", body }),
  },
};
