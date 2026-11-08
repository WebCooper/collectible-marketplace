/**
 * Where the NestJS API lives. Configure it in `.env.local` (see `.env.example`).
 *
 * `process.env.NEXT_PUBLIC_API_URL` must be written out literally so Next.js
 * can inline it into the browser bundle at build time.
 */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

/** Socket.IO namespace that broadcasts live bidding events. */
export const AUCTIONS_SOCKET_URL = `${API_URL}/auctions`;

/** Seeded demo accounts are only offered when explicitly enabled. */
export const DEMO_ACCOUNTS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === "true";

/** Requests that take longer than this are abandoned with a network error. */
export const REQUEST_TIMEOUT_MS = 20_000;
