# Client — LankaNumis marketplace (Next.js)

Buyer and seller web app for the Sri Lankan Collectible Marketplace. It talks to
the NestJS API in [`../backend`](../backend) over REST, plus Socket.IO for live
bidding.

| | |
| --- | --- |
| **Stack** | Next.js 16 (App Router, Turbopack), React 19, Tailwind 4, Zod, socket.io-client |
| **Port** | `3000` (API `3001`, admin panel `5173`) |
| **API contract** | [`../backend/docs/openapi.json`](../backend/docs/openapi.json) and [`API.md`](../backend/docs/API.md) |

## Quick start

1. Start the backend first ([backend README](../backend/README.md#quick-start)):
   PostgreSQL, `npx prisma migrate deploy`, `npm run prisma:seed`,
   `npm run start:dev`. Check it with `curl localhost:3001/ready`.
2. Configure and run the client:

   ```bash
   cd client
   npm install
   cp .env.example .env.local   # defaults point at http://localhost:3001
   npm run dev                  # http://localhost:3000
   ```

3. Sign in with a seeded account (password `Password123!`):
   `buyer@marketplace.lk` or `seller@marketplace.lk`. With
   `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=true` the sign-in page has buttons that
   fill these in.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | API base URL. Its origin must be in the backend's `CORS_ORIGINS`. |
| `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS` | `false` | Show the seeded-account helpers on `/login`. Turn it off for shared deployments. |

`NEXT_PUBLIC_*` values are inlined at **build** time, so rebuild after changing them.

## How the client talks to the API

```
src/lib/api/
├── config.ts      API_URL, socket URL, flags from the environment
├── http.ts        fetch wrapper: cookies, timeout, ApiError, refresh-on-401
├── types.ts       request/response types for every schema in openapi.json
├── endpoints.ts   one typed function per operationId, grouped by OpenAPI tag
├── socket.ts      shared Socket.IO connection to the /auctions namespace
└── index.ts       public exports (import from "@/lib/api")
```

- **Sessions use httpOnly cookies.** `POST /auth/login` and
  `POST /auth/verify-otp` set `access_token` and `refresh_token` cookies; every
  request is sent with `credentials: "include"`. The browser never stores the
  tokens itself.
- **Expiry is handled for you.** A `401` on a protected call triggers one shared
  `POST /auth/refresh`, then the original request is replayed. If the refresh
  fails, `AuthProvider` drops back to the signed-out state.
- **`AuthProvider`** ([`src/providers/auth-provider.tsx`](src/providers/auth-provider.tsx))
  restores the session with `GET /users/me` and exposes `useAuth()`:
  `user`, `status`, `signIn`, `signOut`, `acceptSession`.
- **Live bidding:** `useLiveAuction` subscribes to `auction:bid`,
  `auction:extended` and `auction:closed` and re-syncs over REST after a
  reconnect. Bids are always placed over REST (`auctionsApi.placeBid`).
- **Errors:** every failure throws `ApiError` (`status`, `messages`). `status`
  is `0` when the API cannot be reached. Validation messages are mapped onto
  form fields by `apiFormErrors` in `src/lib/form-errors.ts`.
- **Money** arrives as decimal strings (`"10500"`). Format with `formatLKR`, or
  convert with `toAmount`; never use `parseFloat` arithmetic on prices.

```ts
import { listingsApi, auctionsApi, ApiError } from "@/lib/api";

const page = await listingsApi.search({ category: "STAMPS", sort: "price_asc" });
try {
  await auctionsApi.placeBid(auctionId, { amount: 20000 });
} catch (e) {
  if (e instanceof ApiError && e.status === 400) console.warn(e.message); // e.g. minimum bid
}
```

## Pages

| Route | Backend calls |
| --- | --- |
| `/` | `GET /listings/featured`, `GET /listings/categories`, live socket on featured auctions |
| `/listings` | `GET /listings` (keyword, category, type, condition, verified, sort, paging; all kept in the URL) |
| `/listings/[id]` | `GET /listings/:id`, `GET /auctions/:id`, `GET /auctions/:id/bids`, `POST /auctions/:id/bids`, `POST /auctions/:id/buy-now`, `POST /orders/checkout` |
| `/login` | `POST /auth/login` (supports `?next=`) |
| `/signup` → OTP step | `POST /auth/register`, `POST /auth/verify-otp`, `POST /auth/resend-otp` |
| `/verify` | Verify an account that was registered earlier |
| `/forgot-password`, `/reset-password?token=` | `POST /auth/forgot-password`, `POST /auth/reset-password` |

`endpoints.ts` also covers the endpoints with no screen yet: profile, orders and
disputes, notifications, reports, seller listing management, appraiser review
and the admin routes. The admin routes are used by the separate `admin/` panel.

## Development notes

- **No e-mail is sent in development.** Verification codes appear in the
  backend log (`Your verification code is 123456`). Password-reset tokens are
  only stored in the user's in-app notification `payload`; browse them with
  `npm run prisma:studio` in `backend/`.
- **Payments:** the backend's `manual` gateway waits for a callback. In
  development the order confirmation has a *Simulate successful payment* button
  that posts it for you.
- **Rate limit:** the API allows 10 requests/second and 120/minute per client.
  Identical GETs that are in flight at the same time are de-duplicated, so
  React Strict Mode's double effects don't count twice.
- **Listing images** are arbitrary storage URLs, so the app uses `<img>` with a
  local fallback instead of `next/image`.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
