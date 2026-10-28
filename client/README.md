# CeylonCollect — client

Buyer and seller web app for the Sri Lankan Collectible Marketplace. Built with Next.js 16
(App Router), React 19 and Tailwind CSS 4. The pages talk to the NestJS API described in
[`backend/docs/API.md`](../backend/docs/API.md) and `backend/docs/openapi.json`.

## Running it

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, defaults to http://localhost:3001
npm install
npm run dev                  # http://localhost:3000
```

The API must allow `http://localhost:3000` in `CORS_ORIGINS`. That is its default.

## How it works

- **Session**: the API sets httpOnly `access_token` / `refresh_token` cookies, and every call
  sends `credentials: 'include'`. A `401` triggers one shared `POST /auth/refresh` and a retry.
  If that fails, the user is signed out. Tokens are never stored in browser storage.
- **API layer**: all endpoints are in [`lib/api.ts`](lib/api.ts), with types in
  [`lib/types.ts`](lib/types.ts).
- **Live bidding**: [`lib/socket.ts`](lib/socket.ts) connects to the `/auctions` Socket.IO
  namespace. [`AuctionPanel`](components/AuctionPanel.tsx) subscribes and handles
  `auction:bid`, `auction:extended` and `auction:closed`, and re-syncs over REST on every
  reconnect.

## Pages

| Route | What it does | Endpoints |
| --- | --- | --- |
| `/` | Hero, category counts, auctions ending soon, featured items | `GET /listings/featured`, `/listings/categories`, `/listings` |
| `/listings` | Search, filters, sorting, pagination | `GET /listings` |
| `/listings/[id]` | Gallery, details, certificates, review history, buy or bid live, report | `GET /listings/:id`, `/auctions/:id`, `/auctions/:id/bids`, `POST /auctions/:id/bids`, `/auctions/:id/buy-now`, `/reports` |
| `/checkout` | Shipping form, order, payment handoff | `POST /orders/checkout` |
| `/orders`, `/orders/[id]` | Purchases and sales, progress, ship, confirm receipt, dispute | `GET /orders`, `/orders/sales`, `/orders/:id`, `PATCH /orders/:id/status`, `POST /orders/:id/disputes` |
| `/bids` | Every auction the user has bid on | `GET /bids/mine` |
| `/notifications` | Notification centre with deep links (unread badge in the header) | `GET /notifications`, `/notifications/unread-count`, `PATCH …/read`, `…/read-all` |
| `/account` | Profile and password change | `GET/PATCH /users/me`, `PATCH /users/me/password` |
| `/users/[id]` | Public seller profile and listings, report user | `GET /users/:id`, `GET /listings?sellerId=` |
| `/sell` | Seller dashboard | `GET /listings/mine`, `/orders/sales` |
| `/sell/new` | Create a listing with images and certificates | `POST /listings` |
| `/sell/[id]` | Review feedback, edit, certificates, schedule an auction, withdraw | `GET/PATCH/DELETE /listings/:id`, `GET/POST /listings/:id/certificates`, `POST /listings/:id/auction` |
| `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password` | Account flows | `/auth/*` |

Staff-only endpoints (`/admin/*`, `/verification/queue`, `POST /listings/:id/verification`,
`POST /users/staff`) are used by the separate `admin/` app. `/payments/callback` is called
by the payment provider, not by a browser.

## Notes

- The API stores URLs only. Sellers paste image and certificate URLs until a storage upload
  service exists.
- In development the `manual` payment gateway returns only a `transactionRef`. To confirm a
  payment, post it to `/payments/callback` (see API.md). For a real provider, the checkout
  page follows `redirectUrl`, or auto-posts `formFields` to it.
