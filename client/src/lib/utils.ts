import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Sri Lankan Rupees (LKR / රු)
 */
export function formatLKR(amount: number, symbol: string = "රු"): string {
  const formatted = new Intl.NumberFormat("en-LK", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${symbol} ${formatted}`;
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
