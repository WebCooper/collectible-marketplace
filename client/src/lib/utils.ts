import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts an API money value to a number. The API returns LKR amounts as
 * decimal strings ("10500.50") so nothing is lost in transit.
 */
export function toAmount(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

/**
 * Format currency in Sri Lankan Rupees (LKR / රු). Accepts the API's decimal
 * strings as well as numbers; shows cents only when there are any.
 */
export function formatLKR(amount: number | string, symbol: string = "රු"): string {
  const value = toAmount(amount);
  const formatted = new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
  return `${symbol} ${formatted}`;
}

/**
 * Only follow same-site relative paths after sign-in, so a crafted
 * `?next=https://evil.example` link cannot bounce the user off-site.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}

/** Builds `/login?next=<current path>` so the user comes back after signing in. */
export function loginHref(returnTo: string): string {
  return `/login?next=${encodeURIComponent(returnTo)}`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatCurrency(
  amount: number,
  currency: string = "LKR"
): string {
  if (currency === "LKR") {
    return formatLKR(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-LK").format(num);
}

export function getTimeRemaining(endsAt: string) {
  const total = Date.parse(endsAt) - Date.now();
  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds, isEnded: false };
}
