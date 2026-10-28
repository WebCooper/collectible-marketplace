import type { Category, ItemCondition } from "./types";

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "OLD_COINS", label: "Old Coins", icon: "🪙" },
  { value: "PROOF_COINS", label: "Proof Coins", icon: "✨" },
  { value: "COMMEMORATIVE_COINS", label: "Commemorative Coins", icon: "🏅" },
  { value: "CURRENCY_NOTES", label: "Currency Notes", icon: "💵" },
  { value: "STAMPS", label: "Stamps", icon: "📮" },
  { value: "MEDALS", label: "Medals", icon: "🎖️" },
];

export const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: "MINT", label: "Mint" },
  { value: "EXCELLENT", label: "Excellent" },
  { value: "VERY_GOOD", label: "Very Good" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

/** OLD_COINS → "Old Coins" */
export function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? humanize(value);
}

const lkr = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function money(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  return lkr.format(Number(value));
}

export function date(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value: string) {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date(value);
}

/** Milliseconds → "2d 4h", "3h 12m", "4m 09s" */
export function countdown(ms: number) {
  if (ms <= 0) return "Ended";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
