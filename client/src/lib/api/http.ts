import { API_URL, REQUEST_TIMEOUT_MS } from "./config";

/**
 * Error thrown for every failed API call.
 *
 * `status` is the HTTP status, or 0 when the API could not be reached at all.
 * `messages` holds every validation message the API returned (NestJS sends an
 * array of strings for a 400 validation failure, one per failing field).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.messages = messages.length ? messages : [this.message];
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

/** Fired on `window` when the session can no longer be renewed. */
export const SESSION_EXPIRED_EVENT = "lankanumis:session-expired";

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: object;
}

/** Builds `?a=1&b=2`, skipping empty values. */
export function toQueryString(query?: object): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query) as [string, QueryValue][]) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Auth routes whose 401 means "wrong credentials / bad token", never
 * "access token expired" - so they must not trigger a refresh-and-retry.
 */
const NO_REFRESH_PATHS =
  /^\/auth\/(login|register|verify-otp|resend-otp|refresh|logout|forgot-password|reset-password)\b/;

/** One refresh at a time, shared by every request that hit a 401. */
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= send("/auth/refresh", { method: "POST", body: {} })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/** Identical GETs already on the wire share one response. */
const inFlightGets = new Map<string, Promise<unknown>>();

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = "GET", body } = options;
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      // The API keeps the session in httpOnly cookies; the browser attaches
      // them only when credentials are included.
      credentials: "include",
      cache: "no-store",
      headers:
        body === undefined
          ? { Accept: "application/json" }
          : { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(0, [
      `Cannot reach the marketplace API at ${API_URL}. Check that the backend is running and NEXT_PUBLIC_API_URL is correct.`,
    ]);
  }
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? (data as { message: unknown }).message
        : undefined;
    const messages = Array.isArray(message)
      ? message.map(String)
      : typeof message === "string"
        ? [message]
        : response.status === 429
          ? ["Too many requests - please wait a moment and try again."]
          : [`Request failed (${response.status})`];
    throw new ApiError(response.status, messages);
  }
  return data as T;
}

async function execute<T>(path: string, options: RequestOptions): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && !NO_REFRESH_PATHS.test(path)) {
    // The 15-minute access token probably expired: renew it from the
    // refresh cookie once, then replay the original request.
    if (await refreshSession()) {
      response = await send(path, options);
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  }

  return parse<T>(response);
}

/** Calls the API and returns the parsed JSON body, or throws `ApiError`. */
export function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${path}${toQueryString(options.query)}`;
  const method = options.method ?? "GET";

  if (method !== "GET") return execute<T>(url, options);

  const existing = inFlightGets.get(url);
  if (existing) return existing as Promise<T>;

  const pending = execute<T>(url, options).finally(() => {
    inFlightGets.delete(url);
  });
  inFlightGets.set(url, pending);
  return pending;
}

/** Human-readable text for any thrown value. */
export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof ApiError) return error.messages.join(" ");
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
