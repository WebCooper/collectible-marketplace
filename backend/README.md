# Backend — Sri Lankan Collectible Marketplace

NestJS API backing the marketplace: REST endpoints plus a WebSocket channel for
live bidding, on a single PostgreSQL database accessed through Prisma.

Owned by **Member 3**. This README is the contract the other members build
against.

## Running it locally

```bash
npm install
cp .env.example .env          # then set DATABASE_URL
npx prisma migrate deploy     # or `npm run prisma:migrate` while developing
npm run prisma:seed           # sample users, listings and a live auction
npm run start:dev
```

The API listens on **3001** (the Next.js client owns 3000, the Vite admin panel
5173). Interactive API docs are at <http://localhost:3001/api>.

Seeded accounts all use the password `Password123!`:

| Role | E-mail |
| --- | --- |
| Administrator | `admin@marketplace.lk` |
| Appraiser | `appraiser@marketplace.lk` |
| Seller | `seller@marketplace.lk` |
| Buyer | `buyer@marketplace.lk`, `buyer2@marketplace.lk` |

## How authentication works

Every route requires a valid JWT unless it is marked `@Public()`. Send it either
as `Authorization: Bearer <token>` or in an `access_token` cookie — the strategy
accepts both, so the admin panel can use a header and the client an httpOnly
cookie.

`POST /auth/login` (and `verify-otp` / `refresh`) returns
`{ accessToken, refreshToken, user }` **and** sets two httpOnly cookies:
`access_token` (path `/`) and `refresh_token` (path `/auth`, `Secure` in
production). Browser clients should call the API with `credentials: 'include'`
and never touch the tokens. Access tokens expire in 15 minutes; call
`POST /auth/refresh` with an empty body to renew from the cookie (the admin
panel can send `{ refreshToken }` instead). `POST /auth/logout` clears both
cookies.

Changing or resetting a password signs out every other session: tokens issued
before `User.passwordChangedAt` are rejected.

With `NODE_ENV=production` the API refuses to start unless `JWT_SECRET` and
`JWT_REFRESH_SECRET` are unique values of at least 32 characters (the
`.env.example` placeholders are rejected).

A newly registered account is `PENDING_VERIFICATION` and cannot sign in until it
confirms the 6-digit code sent to its e-mail. In development the code is written
to the API log rather than actually e-mailed.

## Endpoints

### Auth (`/auth`)
`POST register` · `POST verify-otp` · `POST resend-otp` · `POST login` ·
`POST refresh` · `POST forgot-password` · `POST reset-password` · `GET me`

### Users (`/users`)
`GET me` · `PATCH me` · `PATCH me/password` · `GET :id` (public seller profile) ·
`POST staff` (admin only — creates appraiser and administrator accounts)

### Listings (`/listings`)
`GET /` — search and filtering. Query parameters: `q`, `category`, `condition`,
`listingType`, `minPrice`, `maxPrice`, `verifiedOnly`, `featuredOnly`,
`sellerId`, `sort` (`newest` · `price_asc` · `price_desc` · `ending_soonest` ·
`popularity`), `page`, `limit`.

`GET featured` · `GET categories` · `GET mine` (seller) · `POST /` ·
`PATCH :id` · `DELETE :id` (withdraw) · `GET :id`

Listing search and detail are open to guests; the detail route also returns the
seller their own listing while it is still under review.

### Certificates and verification
`POST listings/:id/certificates` (seller) ·
`GET listings/:id/certificates` (seller, appraiser) ·
`GET verification/queue` (appraiser) ·
`POST listings/:id/verification` (appraiser) ·
`GET listings/:id/verification` (public history)

### Auctions and bidding
`POST listings/:id/auction` (seller) · `GET auctions/:id` ·
`GET auctions/:id/bids` · `POST auctions/:id/bids` ·
`POST auctions/:id/buy-now` · `GET bids/mine`

### Orders and payments
`POST orders/checkout` · `GET orders` · `GET orders/sales` · `GET orders/:id` ·
`PATCH orders/:id/status` · `POST orders/:id/disputes` ·
`POST payments/callback` (public; the provider's signature is its
authentication)

### Notifications
`GET notifications` · `GET notifications/unread-count` ·
`PATCH notifications/:id/read` · `PATCH notifications/read-all`

### Administration
`POST reports` (any signed-in user) · `GET admin/users` ·
`PATCH admin/users/:id/suspend` · `PATCH admin/users/:id/reinstate` ·
`PATCH admin/listings/:id/moderate` · `GET admin/reports` ·
`PATCH admin/reports/:id/resolve` · `GET admin/disputes` ·
`PATCH admin/disputes/:id/resolve` · `GET admin/analytics` · `GET admin/audit-log`

### Health
`GET /health` (liveness) · `GET /ready` (liveness plus a database round-trip).
The container starts even when the database is briefly unreachable, so `/ready`
can report the real state and Cloud Run can retry.

## Live bidding over WebSocket — for Member 2

Socket.IO namespace `/auctions`.

```ts
const socket = io(`${API_URL}/auctions`);
socket.emit('auction:subscribe', { auctionId });

socket.on('auction:bid', (e) => /* e.currentPrice, e.bidCount, e.bidder, e.endTime */);
socket.on('auction:extended', (e) => /* e.endTime — anti-snipe pushed the close out */);
socket.on('auction:closed', (e) => /* e.finalPrice, e.winner */);
```

Bids are **placed over REST** (`POST /auctions/:id/bids`), not over the socket,
so bid rules are enforced in exactly one place. The socket only reports what
already happened. Subscribing is open to guests, so a visitor comparing prices
sees the counter move without signing in.

## Where Member 4 plugs in

Two interfaces are the seams for the external systems; neither needs any change
to a business module.

**Payments** — implement `PaymentGateway`
(`src/orders/payments/payment-gateway.ts`) for PayHere or Stripe and swap the
provider in `src/orders/orders.module.ts`:

```ts
{ provide: PAYMENT_GATEWAY, useClass: PayHereGateway }
```

`verifyCallback` must verify the provider's signature and return `null` when it
fails — an unverified callback would let anyone mark an order as paid. The order
module already makes the update idempotent on `transactionRef`, so a provider
retrying a callback cannot double-charge a buyer. When the callback carries an
amount it must equal the order amount, and a failed payment cancels the order
(a fixed-price item goes back on sale; the buyer checks out again).

Resolving a dispute (`PATCH /admin/disputes/:id/resolve`) accepts an optional
`orderAction`: `REFUND_BUYER` cancels the order and marks its payment refunded
in our records (the provider refund itself is Member 4's gateway), and
`COMPLETE_ORDER` closes it in the seller's favour.

**E-mail and SMS** — implement `NotificationTransport`
(`src/notifications/notification-dispatcher.ts`) and swap the transports in
`src/notifications/notifications.module.ts`:

```ts
{ provide: EMAIL_TRANSPORT, useClass: NodemailerTransport },
{ provide: SMS_TRANSPORT, useClass: TwilioTransport }
```

Delivery already runs off the request path with exponential-backoff retries, so
a slow provider never adds latency to bidding or checkout. Replacing the
in-memory retry queue in `NotificationsService` with Bull/Redis is a change
local to that file.

**Storage** — the API stores object *URLs*, never file bytes. Have the client
request a signed upload URL, upload straight to GCS, and post the resulting URL
to `POST /listings` or `POST /listings/:id/certificates`. Large files never pass
through NestJS.

## Where Member 5 plugs in

- Build: `npm ci && npx prisma generate && npm run build`, start with
  `node dist/main.js`. `npx prisma migrate deploy` must run against the database
  before the new revision takes traffic.
- Probes: `/health` for liveness, `/ready` for readiness.
- Required environment variables are listed in `.env.example`. `CORS_ORIGINS` is
  a comma-separated list and must include both deployed frontend origins.
- The scheduled auction jobs run in-process. If the backend is scaled to more
  than one instance, either pin the scheduler to a single revision or move the
  sweep to Cloud Scheduler calling an internal endpoint — otherwise every
  instance runs the same sweep. The settlement transaction re-checks state, so
  duplicate runs are safe, just wasteful.

## Design decisions worth knowing

**One database, ACID transactions.** Bidding, auction settlement and checkout
each run inside a serializable transaction. Two people bidding at the same
instant cannot both be accepted, and two buyers cannot check out the same item.
Postgres aborts the losing transaction and the bid is retried against the newer
price, which the bidder never sees.

**Closed by default.** `JwtAuthGuard` and `RolesGuard` are global. A new route is
protected unless it explicitly opts out with `@Public()`. The JWT strategy
re-reads the account on each request, so suspending a user revokes access
immediately rather than whenever their token happens to expire.

**Side effects never block the request.** Notifications, the popularity counter
and socket broadcasts all happen after the transaction commits, and a failure in
any of them cannot undo an accepted bid or a completed checkout.

## Tests

```bash
npm test           # unit tests
npm run test:e2e   # needs a running database
```

The unit tests cover the two services where a mistake is most expensive: bid
validation, the anti-snipe extension and Buy Now in `AuctionsService`, and
registration, login, OTP verification and password reset in `AuthService`.
