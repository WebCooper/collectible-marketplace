export interface Staff {
  id: string;
  name?: string;
  email: string;
  role: "ADMIN" | "APPRAISER";
}
export interface Page<T> {
  data: T[];
  meta: { total: number; page: number; totalPages: number; limit: number };
}
export interface Person {
  id: string;
  name: string;
  email?: string;
  role?: string;
  status?: string;
  createdAt?: string;
}
export interface VerificationRecord {
  id: string;
  decision: string;
  comments?: string | null;
  appraisedValue: string | number | null;
  verifiedAt: string;
  appraiser: { name: string };
  certificate?: { fileName: string } | null;
}
export interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  startingPrice: string;
  status?: string;
  seller: Person;
  images: { url: string }[];
  certificates?: {
    id: string;
    fileName: string;
    fileUrl: string;
    issuer?: string;
    status: string;
  }[];
  verifications?: {
    decision: string;
    comments?: string;
    verifiedAt: string;
    appraiser: { name: string };
  }[];
}
export interface Report {
  id: string;
  reason: string;
  details?: string;
  status: string;
  reporter: Person;
  reportedListing?: { id: string; title: string; status: string };
  reportedUser?: Person;
}
export interface Dispute {
  id: string;
  reason: string;
  details?: string;
  status: string;
  raisedBy: Person;
  order: {
    id: string;
    amount: string;
    status: string;
    listing: { title: string };
    buyer: Person;
    seller: Person;
    payment?: { status: string; transactionRef: string };
  };
}
export interface Analytics {
  users: { total: number; suspended: number; newThisMonth: number };
  listings: {
    active: number;
    underReview: number;
    byCategory: { category: string; count: number }[];
  };
  auctions: { live: number };
  sales: { completed: number; grossValue: string };
  moderation: { openReports: number; openDisputes: number };
}
export interface Audit {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  actor?: Person;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/$/, "");
let refresh: Promise<void> | undefined;
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
  retry = true,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error(
      "Cannot reach the API. Check the backend and VITE_API_URL, then retry.",
    );
  }
  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    refresh ??= request("/auth/refresh", "POST", {}, false)
      .then(() => {})
      .finally(() => {
        refresh = undefined;
      });
    try {
      await refresh;
    } catch {
      window.dispatchEvent(new Event("session-expired"));
      throw new ApiError(401, "Session expired. Please sign in again.");
    }
    return request<T>(path, method, body, false);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("session-expired"));
    throw new ApiError(
      response.status,
      Array.isArray(data.message)
        ? data.message.join("; ")
        : data.message || `Request failed (${response.status})`,
    );
  }
  return data as T;
}
export const api = {
  me: () => request<Staff>("/users/me"),
  login: (email: string, password: string) =>
    request<{ user: Staff }>("/auth/login", "POST", { email, password }),
  logout: () => request("/auth/logout", "POST"),
  analytics: () => request<Analytics>("/admin/analytics"),
  audit: () => request<Audit[]>("/admin/audit-log?limit=8"),
  users: (page: number, q: string, status: string) =>
    request<Page<Person>>(
      `/admin/users?${new URLSearchParams({ page: String(page), limit: "12", ...(q ? { q } : {}), ...(status ? { status } : {}) })}`,
    ),
  listings: (page: number, review: boolean) =>
    request<Page<Listing>>(
      review
        ? `/verification/queue?page=${page}&limit=12`
        : `/listings?page=${page}&limit=12`,
    ),
  verificationHistory: (id: string) =>
    request<VerificationRecord[]>(`/listings/${id}/verification`),
  listing: (id: string) => request<Listing>(`/listings/${id}`),
  reports: (page: number, status: string) =>
    request<Page<Report>>(
      `/admin/reports?page=${page}&limit=12${status ? `&status=${status}` : ""}`,
    ),
  disputes: (page: number, status: string) =>
    request<Page<Dispute>>(
      `/admin/disputes?page=${page}&limit=12${status ? `&status=${status}` : ""}`,
    ),
  suspend: (id: string, reason: string) =>
    request(`/admin/users/${id}/suspend`, "PATCH", { reason }),
  reinstate: (id: string) => request(`/admin/users/${id}/reinstate`, "PATCH"),
  moderate: (id: string, status: string, reason: string) =>
    request(`/admin/listings/${id}/moderate`, "PATCH", { status, reason }),
  resolveReport: (id: string, status: string, resolutionNote: string) =>
    request(`/admin/reports/${id}/resolve`, "PATCH", {
      status,
      resolutionNote,
    }),
  resolveDispute: (
    id: string,
    status: string,
    resolution: string,
    orderAction: string,
  ) =>
    request(`/admin/disputes/${id}/resolve`, "PATCH", {
      status,
      resolution,
      orderAction,
    }),
  verify: (
    id: string,
    body: {
      decision: string;
      comments: string;
      certificateId?: string;
      appraisedValue?: number;
    },
  ) => request(`/listings/${id}/verification`, "POST", body),
};
