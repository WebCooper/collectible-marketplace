# Backend — Sri Lankan Collectible Marketplace

NestJS API for the collectible marketplace (EC8208 Software Architecture
prototype): buyers and sellers trade coins, notes, stamps and medals; appraisers
verify authenticity; administrators moderate. REST for everything, plus a
Socket.IO channel for live bidding, on a single PostgreSQL database accessed
through Prisma.

| | |
| --- | --- |
| **API reference** | [`docs/API.md`](docs/API.md) |
| **OpenAPI spec** | [`docs/openapi.json`](docs/openapi.json) (also served at `/api` when running) |
| **Stack** | Node 20+, NestJS 11, Prisma 6, PostgreSQL, Socket.IO, JWT, Jest |
| **Ports** | API `3001` · client (Next.js) `3000` · admin (Vite) `5173` |

## Contents

[Quick start](#quick-start) · [Configuration](#configuration) ·
[Scripts](#scripts) · [Architecture](#architecture) · [Authentication](#authentication) ·
[Domain flows](#domain-flows) · [Live bidding](#live-bidding) ·
[Integration points](#integration-points) · [Deployment](#deployment) ·
[Testing](#testing) · [Design decisions](#design-decisions) ·
[Troubleshooting](#troubleshooting)

---

## Quick start

**Prerequisites:** Node.js 20 or newer and a running PostgreSQL instance.

```bash
cd backend
npm install
cp .env.example .env              # then set DATABASE_URL (and JWT secrets, see below)
npx prisma migrate deploy         # create the schema
npm run prisma:seed               # sample users, listings and a live auction
npm run start:dev                 # http://localhost:3001, docs at /api
```

Seeded accounts all use the password **`Password123!`**:

| Role | E-mail |
| --- | --- |
| Administrator | `admin@marketplace.lk` |
| Appraiser | `appraiser@marketplace.lk` |
| Seller | `seller@marketplace.lk` |
| Buyer | `buyer@marketplace.lk`, `buyer2@marketplace.lk` |

Verify it is up: `curl localhost:3001/health` → `{"status":"ok",…}` and
`curl localhost:3001/ready` → `{"status":"ready","database":"up"}`.

In development no e-mail or SMS is actually sent. Verification codes and
password-reset links are written to the API log; seeded users are already
verified, so you only need this for newly registered accounts.

## Configuration

All settings are environment variables, loaded from `.env` (see
[`.env.example`](.env.example)).

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` enables the safeguards below |
| `PORT` | `3001` | HTTP port |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Comma-separated origins allowed to call the API and open the socket |
| `DATABASE_URL` | — | PostgreSQL connection string (**required**) |
| `JWT_SECRET` | dev fallback | Signs access tokens |
| `JWT_EXPIRES_IN` | `15m` | Access-token lifetime |
| `JWT_REFRESH_SECRET` | dev fallback | Signs refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh-token lifetime |
| `BCRYPT_SALT_ROUNDS` | `10` | Password hashing cost |
| `OTP_TTL_MINUTES` | `10` | Verification-code lifetime |
| `PASSWORD_RESET_TTL_MINUTES` | `30` | Reset-link lifetime |
| `AUCTION_ANTI_SNIPE_WINDOW_SECONDS` | `120` | A bid this close to the end extends the auction |
| `AUCTION_ANTI_SNIPE_EXTENSION_SECONDS` | `120` | New time remaining after an extending bid |
| `PAYMENT_*`, `SMTP_*`, `SMS_API_KEY`, `GCP_*`, `GCS_BUCKET` | empty | External-system settings, consumed by the integration layer (see [Integration points](#integration-points)) |

**Production safeguards.** With `NODE_ENV=production` the API **refuses to start**
unless `JWT_SECRET` and `JWT_REFRESH_SECRET` are unique values of at least 32
characters (the `.env.example` placeholders are rejected), the session cookies
are marked `Secure`, and the development `manual` payment gateway rejects every
callback. Generate secrets with `openssl rand -base64 48`.

## Scripts

| Command | Does |
| --- | --- |
| `npm run start:dev` | Run with file watching |
| `npm run build` / `npm run start:prod` | Compile to `dist/` and run `node dist/main` |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end flow; needs a test database ([below](#testing)) |
| `npm run lint` | ESLint (auto-fixes) |
| `npm run prisma:migrate` | Create/apply a migration while developing |
| `npm run prisma:deploy` | Apply committed migrations (CI, production) |
| `npm run prisma:seed` | Load sample data |
| `npm run db:reset` | **Destroys** the database, re-migrates and re-seeds |
| `npm run prisma:studio` | Browse the database in a web UI |
| `npm run docs:openapi` | Regenerate `docs/openapi.json` (no database needed) |

## Architecture

A modular monolith: one deployable, one database, one module per business
capability. Modules talk through injected services, never through each other's
tables.

```
src/
├── main.ts                 bootstrap: cookies, CORS, validation, Swagger
├── app.module.ts           wires modules and the global guards
├── swagger.ts              OpenAPI document (shared by /api and docs:openapi)
├── auth/                   register, OTP, login, refresh, password reset, JWT + role guards
├── users/                  profile, public seller profile, staff accounts
├── listings/               create/edit/withdraw, search, filters, featured, categories
├── certificates/           certificate upload, appraiser queue, decisions, history
├── auctions/               auctions, bidding, Buy Now, closing jobs, WebSocket gateway
├── orders/                 checkout, order tracking, disputes, payment callback
│   └── payments/           PaymentGateway interface + development gateway
├── notifications/          in-app records, async e-mail/SMS dispatch with retries
│   └── transports/         NotificationTransport implementations
├── admin/                  user management, moderation, reports, disputes, analytics
├── health/                 /health and /ready
├── prisma/                 PrismaService
└── common/                 decorators, pagination, Prisma error filter
prisma/                     schema.prisma, migrations/, seed.ts
docs/                       API.md, openapi.json
test/                       end-to-end suite
```

**Request path:** `ConfigModule → global guards (JwtAuthGuard → RolesGuard →
ThrottlerGuard) → ValidationPipe → controller → service → Prisma`. Errors from
Prisma are translated by `PrismaExceptionFilter`.

### Data model

Fourteen tables in [`prisma/schema.prisma`](prisma/schema.prisma), mirroring the
design report's class diagram:

```
User ─┬─< Listing ─┬─< ListingImage
      │            ├─< Certificate ─< VerificationRecord >─ User (appraiser)
      │            ├── Auction ─< Bid >─ User (bidder)
      │            └─< Order ─┬── Payment
      │                       └── Dispute
      ├─< Notification        ├─< AuthToken (OTP · verification · reset, hashed)
      └─< Report / AuditLog
```

Money is `Decimal(12,2)`; nothing in the API ever does floating-point
arithmetic on prices. Enumerations (roles, statuses, categories) are Postgres
enums, listed in [`docs/API.md`](docs/API.md#enums).

## Authentication

- **Closed by default.** `JwtAuthGuard` and `RolesGuard` are global; a route is
  protected unless it carries `@Public()`, and restricted to roles with
  `@Roles(...)`. The `ADMIN` role passes every role check.
- **Two ways to present the token:** `Authorization: Bearer <token>` (admin
  panel) or the `access_token` httpOnly cookie (client). Browser clients call the
  API with `credentials: 'include'` and never handle the token themselves.
- **Sessions.** Sign-in returns `{ accessToken, refreshToken, user }` and also
  sets `access_token` (15 min, path `/`) and `refresh_token` (7 days, path
  `/auth`) cookies. `POST /auth/refresh` renews from the cookie; `POST
  /auth/logout` clears them.
- **Live checks.** The JWT strategy re-reads the account on every request, so a
  suspended user loses access immediately, not when their token expires.
- **Passwords.** bcrypt-hashed. Changing or resetting one stamps
  `User.passwordChangedAt`, which invalidates every earlier access *and* refresh
  token.
- **Account lifecycle.** Registration creates a `PENDING_VERIFICATION` account;
  the 6-digit code (stored only as a SHA-256 hash, single-use, 10 minutes) must
  be confirmed before sign-in. Appraiser and administrator accounts can only be
  created by an admin (`POST /users/staff`).
- **No account enumeration.** Login, resend-code and forgot-password give the
  same answer, and take comparable time, whether or not the e-mail exists.
- **Rate limiting.** 10 requests/second and 120/minute per client.

## Domain flows

```
Seller                 Appraiser               Buyer                 Admin
  │ POST /listings        │                       │                     │
  ├──► UNDER_REVIEW ─────►│ POST …/verification   │                     │
  │ (+ certificate)       │ APPROVED              │                     │
  │                       ├──► ACTIVE + verified  │                     │
  │ POST …/auction        │                       │ POST /auctions/:id/bids
  │                       │                       │ (WebSocket: auction:bid)
  │          job: auction ends ──► winner, listing SOLD, notifications  │
  │                       │                       │ POST /orders/checkout
  │                       │                       │ ──► payment ──► PAID│
  │ PATCH …/status SHIPPED│                       │ PATCH …/status COMPLETED
  │                       │                       │ POST …/disputes ───►│ resolve
```

1. **Listing review.** Every new or edited listing is `UNDER_REVIEW` and hidden
   from the public. An appraiser approves (`ACTIVE`, verified badge), rejects
   (`REMOVED`) or asks for more evidence. Each decision is stored in an immutable
   history.
2. **Auctions.** Bids are validated and written in a *serializable* transaction;
   a bid in the final two minutes extends the close (anti-snipe); a scheduled
   job settles ended auctions every 30 seconds. Bidding requires the listing to
   be `ACTIVE`, so unreviewed or removed items cannot be bid on.
3. **Checkout & payment.** The winner (or a fixed-price buyer) checks out; the
   listing is taken off the market in the same transaction, so two buyers cannot
   claim the same item. The payment callback is signature-verified, amount-checked
   and idempotent on `transactionRef`. A failed payment cancels the order and
   relists a fixed-price item.
4. **Order tracking.** `PENDING → PAID → SHIPPED → COMPLETED`. Only the payment
   callback (or an admin) marks an order paid, only the seller ships, only the
   buyer confirms receipt.
5. **Disputes & moderation.** Either party can dispute an order; admins resolve
   it and may refund the buyer or complete the order for the seller. Admins also
   suspend users, remove listings and work the reported-content queue. All
   administrative actions are written to the audit log.

Full request/response detail for every step: [`docs/API.md`](docs/API.md).

## Live bidding

Socket.IO namespace `/auctions`. Clients subscribe to an auction and receive
`auction:bid`, `auction:extended` and `auction:closed` events. **Bids are placed
over REST**, never the socket, so the rules are enforced in one place.

```ts
const socket = io(`${API_URL}/auctions`, { withCredentials: true });
socket.emit('auction:subscribe', { auctionId });
socket.on('auction:bid', (e) => /* e.currentPrice, e.bidCount, e.endTime */);
```

Payloads and semantics: [`docs/API.md`](docs/API.md#live-bidding-websocket).

## Integration points

Three seams keep third-party services out of the business modules.

**Payments.** Implement `PaymentGateway`
([`src/orders/payments/payment-gateway.ts`](src/orders/payments/payment-gateway.ts))
for PayHere or Stripe and register it in `src/orders/orders.module.ts`:

```ts
{ provide: PAYMENT_GATEWAY, useClass: PayHereGateway }
```

`createPayment` returns the provider reference (and a redirect URL or form
fields). `verifyCallback` **must** verify the provider's signature and return
`null` on failure — an unverified callback would let anyone mark an order paid.
Return the collected `amount` so it is checked against the order. Idempotency,
state changes and notifications are already handled by the order module. A
provider-side **refund** is not yet part of the interface; the dispute flow only
marks payments `REFUNDED` in our records.

**E-mail and SMS.** Implement `NotificationTransport`
([`src/notifications/notification-dispatcher.ts`](src/notifications/notification-dispatcher.ts))
and register it in `src/notifications/notifications.module.ts`:

```ts
{ provide: EMAIL_TRANSPORT, useClass: NodemailerTransport },
{ provide: SMS_TRANSPORT, useClass: TwilioTransport }
```

Delivery runs off the request path with exponential-backoff retries (5
attempts), so a slow provider never delays bidding or checkout. The queue is
in-memory; replacing it with Bull/Redis is local to `NotificationsService`.

**Cloud storage.** The API stores object **URLs**, never file bytes. The intended
flow: the client obtains a signed upload URL, uploads straight to the bucket,
then sends the resulting URL to `POST /listings` or
`POST /listings/:id/certificates`. A signed-URL endpoint is the storage
integration's responsibility and is not implemented here.

## Deployment

```bash
npm ci
npx prisma generate
npm run build
npx prisma migrate deploy      # before the new revision takes traffic
node dist/main
```

- **Probes:** `/health` for liveness, `/ready` for readiness. `/ready` returns
  HTTP 200 even when degraded — read `status` in the body. The process starts
  even if the database is briefly unreachable, so the platform can retry.
- **Required environment:** `NODE_ENV=production`, `DATABASE_URL`, strong
  `JWT_SECRET` / `JWT_REFRESH_SECRET`, `CORS_ORIGINS` listing both deployed
  frontend origins, and a real `PAYMENT_GATEWAY` provider (the development
  gateway refuses to run in production).
- **Cookies** are `Secure`, so the API and frontends must be served over HTTPS.
  They are `SameSite=Lax`: keep the client and API on the same site (for example
  behind one load balancer) or cookie sign-in will not work cross-site.
- **Scaling.** The auction jobs run in-process. With more than one instance,
  every instance runs the same sweep. This is safe — settlement re-checks state
  inside a transaction — but wasteful; pin the scheduler to one instance or move
  it to Cloud Scheduler if you scale out.

## Testing

```bash
npm test             # 75 unit tests, no database needed
npm run test:e2e     # needs a database; skipped otherwise
```

**Unit tests** cover the services where a mistake is most expensive: bidding
(validation, increments, anti-snipe, Buy Now, listing-status guard),
authentication (registration, OTP, login, refresh, reset, session invalidation,
cookies, production secrets), checkout and payment handling, appraiser
decisions, and dispute resolution.

**End-to-end** (`test/app.e2e-spec.ts`) drives a real flow over HTTP: sign in →
create listing → appraiser approval → auction → bids. It **truncates every
table**, so it needs its own database, and refuses to run unless the name
contains "test":

```bash
createdb collectible_marketplace_test
DATABASE_URL=postgresql://…/collectible_marketplace_test npx prisma migrate deploy
DATABASE_URL_TEST=postgresql://…/collectible_marketplace_test npm run test:e2e
```

## Design decisions

- **One database, ACID transactions.** Bidding, settlement and checkout each run
  in a serializable transaction. Two simultaneous bids cannot both be accepted
  and two buyers cannot take the same item; Postgres aborts the loser, which is
  retried against the new state (a lost checkout race that exhausts its retries
  returns `409`).
- **Bids over REST, events over WebSocket.** One enforcement path for bid rules;
  the socket only reports what already happened.
- **Side effects never block the request.** Notifications, broadcasts and the
  view counter run after the transaction commits; a failure there cannot undo an
  accepted bid or a completed checkout.
- **Secrets are never stored in the clear.** Passwords are bcrypt-hashed; OTP
  codes and reset tokens are stored as SHA-256 hashes.
- **Auditability.** Appraiser decisions, moderation actions, auction settlement
  and payments write immutable `AuditLog`/`VerificationRecord` rows.
- **Provider-agnostic edges.** Payments and notifications sit behind interfaces,
  so swapping a provider changes one class.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| API exits at start-up with `JWT_SECRET must be set…` | `NODE_ENV=production` with a missing, short or placeholder secret |
| `/ready` says `"database":"down"` | Wrong `DATABASE_URL`, database not running, or migrations not applied |
| `401` on every call from the browser | Missing `credentials: 'include'`, an origin not in `CORS_ORIGINS`, or HTTP with a production (`Secure`) cookie |
| Cannot sign in after registering | Account is `PENDING_VERIFICATION` — confirm the code (see the API log in development) |
| `429 Too Many Requests` | Rate limit (10/s, 120/min); back off |
| Signed out after changing password | Intended: all sessions are invalidated, sign in again |
| Checkout/payment never completes locally | The development gateway waits for you to `POST /payments/callback` with the `transactionRef` from the checkout response |
| Schema errors after pulling | Run `npx prisma migrate deploy` and `npx prisma generate` |
