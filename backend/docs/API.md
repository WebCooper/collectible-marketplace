# API Reference

Sri Lankan Collectible Marketplace — REST API and live-bidding WebSocket.

| | |
| --- | --- |
| Base URL (local) | `http://localhost:3001` |
| Interactive docs | `GET /api` (Swagger UI) |
| Machine-readable spec | [`openapi.json`](./openapi.json) — OpenAPI 3, generated with `npm run docs:openapi` |
| Format | JSON over HTTP; all bodies are `application/json` |
| Money | LKR, sent as JSON numbers with at most 2 decimals; returned as **decimal strings** (e.g. `"10500"`) |
| Dates | ISO 8601 UTC strings |
| IDs | UUID v4 strings |

This file is the human-readable contract. `openapi.json` is generated from the
controllers and DTOs and is the source for client generators; if the two ever
disagree, the code and `openapi.json` win.

**Contents** — [Conventions](#conventions) · [Enums](#enums) ·
[Auth](#auth) · [Users](#users) · [Listings](#listings) ·
[Certificates & verification](#certificates--verification) ·
[Auctions & bidding](#auctions--bidding) · [Orders & payments](#orders--payments) ·
[Notifications](#notifications) · [Reports & administration](#reports--administration) ·
[Health](#health) · [Live bidding (WebSocket)](#live-bidding-websocket) ·
[Business rules](#business-rules)

---

## Conventions

### Authentication

Every route needs a valid access token **unless its row below says `Public`**.
Send it in either place; the server accepts both:

- `Authorization: Bearer <accessToken>` — used by the admin panel.
- `access_token` httpOnly cookie — set by the server on sign-in, used by the
  client. Call the API with `credentials: 'include'`.

Access tokens last 15 minutes. Renew with [`POST /auth/refresh`](#post-authrefresh).

The **Auth** column in each table uses:

| Value | Meaning |
| --- | --- |
| `Public` | No token needed |
| `Optional` | Works for guests; richer for a signed-in user |
| `Any` | Any signed-in user |
| `BUYER`, `SELLER`, `APPRAISER`, `ADMIN` | That role. **`ADMIN` is allowed on every role-restricted route.** |

### Pagination

List endpoints accept `?page=1&limit=20` (`page` ≥ 1, `limit` 1–100) and return:

```json
{
  "data": [ /* items */ ],
  "meta": { "total": 57, "page": 1, "limit": 20, "totalPages": 3 }
}
```

### Errors

```json
{ "statusCode": 400, "message": "The next bid must be at least LKR 10500.00", "error": "Bad Request" }
```

Validation failures return `400` with `message` as an **array** of strings, one
per failing field. Unknown body properties are rejected (`forbidNonWhitelisted`).

| Status | When |
| --- | --- |
| `400` | Validation failed, or the action is not allowed in the current state |
| `401` | Missing, expired or invalid token; wrong credentials; suspended account |
| `403` | Signed in but the role or ownership does not allow it |
| `404` | Resource does not exist (or is not visible to you) |
| `409` | Conflict — duplicate record, or a race was lost (retry) |
| `429` | Rate limit hit (10 requests/second and 120/minute per client) |
| `500` | Unexpected server error |

---

## Enums

| Enum | Values |
| --- | --- |
| `Role` | `BUYER` `SELLER` `APPRAISER` `ADMIN` |
| `UserStatus` | `PENDING_VERIFICATION` `ACTIVE` `SUSPENDED` |
| `Category` | `OLD_COINS` `PROOF_COINS` `COMMEMORATIVE_COINS` `CURRENCY_NOTES` `STAMPS` `MEDALS` |
| `ItemCondition` | `POOR` `FAIR` `GOOD` `VERY_GOOD` `EXCELLENT` `MINT` |
| `ListingType` | `FIXED_PRICE` `AUCTION` |
| `ListingStatus` | `DRAFT` `UNDER_REVIEW` `ACTIVE` `SOLD` `EXPIRED` `WITHDRAWN` `REMOVED` |
| `CertificateStatus` | `PENDING` `APPROVED` `REJECTED` |
| `VerificationDecision` | `APPROVED` `REJECTED` `MORE_EVIDENCE_REQUESTED` |
| `AuctionStatus` | `SCHEDULED` `ACTIVE` `ENDED` `CANCELLED` |
| `BidStatus` | `ACTIVE` `OUTBID` `WON` `LOST` |
| `OrderStatus` | `PENDING` `PAID` `SHIPPED` `COMPLETED` `CANCELLED` |
| `PaymentStatus` | `INITIATED` `SUCCEEDED` `FAILED` `REFUNDED` |
| `ReportTargetType` | `LISTING` `USER` |
| `ReportStatus` | `OPEN` `REVIEWING` `ACTIONED` `DISMISSED` |
| `DisputeStatus` | `OPEN` `UNDER_REVIEW` `RESOLVED` `REJECTED` |
| `DisputeOrderAction` | `NONE` `REFUND_BUYER` `COMPLETE_ORDER` |
| `NotificationType` | `OTP` `OUTBID` `AUCTION_STARTING` `AUCTION_ENDING` `AUCTION_WON` `AUCTION_CLOSED` `LISTING_APPROVED` `LISTING_REJECTED` `LISTING_FLAGGED` `ORDER_CONFIRMED` `PAYMENT_RECEIVED` `ITEM_SHIPPED` `DISPUTE_UPDATE` |
| `NotificationChannel` | `IN_APP` `EMAIL` `SMS` |

---

## Auth

Base path `/auth`. Passwords must be 8–72 characters with at least one
lowercase letter, one uppercase letter and one digit.

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /auth/register` | Public | Create a buyer or seller account |
| `POST /auth/verify-otp` | Public | Confirm the e-mailed 6-digit code; signs the user in |
| `POST /auth/resend-otp` | Public | Send a fresh code |
| `POST /auth/login` | Public | Sign in |
| `POST /auth/refresh` | Public | Exchange a refresh token for a new session |
| `POST /auth/logout` | Public | Clear the session cookies |
| `POST /auth/forgot-password` | Public | Request a reset link |
| `POST /auth/reset-password` | Public | Choose a new password with a reset token |
| `GET /auth/me` | Any | Identity carried by the current token |

### `POST /auth/register`

```json
{
  "name": "Kamala Silva",
  "email": "kamala@example.lk",
  "phone": "+94771234567",
  "password": "Password123!",
  "role": "BUYER"
}
```

`phone` (Sri Lankan number) and `role` are optional. `role` may only be `BUYER`
(default) or `SELLER`; appraisers and administrators are created by an admin via
[`POST /users/staff`](#post-usersstaff). `name` is 2–100 characters.

**201** — `{ "message": "Account created. Check your e-mail for the 6-digit verification code.", "userId": "…" }`

**409** if the e-mail is already registered. The account stays
`PENDING_VERIFICATION` and **cannot sign in** until the code is confirmed. In
development the code is written to the API log instead of being e-mailed.

### `POST /auth/verify-otp`

`{ "email": "kamala@example.lk", "code": "123456" }` → **200**, a
[session](#session-response). Codes expire after 10 minutes (`OTP_TTL_MINUTES`)
and are single-use; requesting a new code voids earlier ones. **400** if the
code is wrong, expired or used.

### `POST /auth/resend-otp`

`{ "email": "…" }` → **200** `{ "message": "If that account needs verification, a code has been sent." }`
— identical whether or not the account exists.

### `POST /auth/login`

`{ "email": "…", "password": "…" }` → **200**, a [session](#session-response).
**401** for a wrong e-mail or password (the same message for both), a suspended
account, or an account that has not verified its code.

### Session response

Returned by `login`, `verify-otp` and `refresh`:

```json
{
  "accessToken": "eyJ…",
  "refreshToken": "eyJ…",
  "user": { "id": "…", "name": "Kamala Silva", "email": "kamala@example.lk",
            "role": "BUYER", "status": "ACTIVE", "avatarUrl": null }
}
```

The same call also sets two **httpOnly** cookies:

| Cookie | Path | Lifetime | Notes |
| --- | --- | --- | --- |
| `access_token` | `/` | 15 min (`JWT_EXPIRES_IN`) | `SameSite=Lax`; `Secure` in production |
| `refresh_token` | `/auth` | 7 days (`JWT_REFRESH_EXPIRES_IN`) | only sent to `/auth/*` |

Browser clients can ignore the tokens in the body; the admin panel, which uses
a bearer header, reads them from it.

### `POST /auth/refresh`

Body is optional: `{ "refreshToken": "…" }`. With no body the `refresh_token`
cookie is used. **200**, a new [session](#session-response) (cookies re-set).
**401** if there is no token, it is invalid or expired, the account is not
active, or the token was issued before the user's last password change.

### `POST /auth/logout`

→ **200** `{ "message": "Signed out." }` and both cookies cleared. Bearer
tokens already issued remain valid until they expire.

### `POST /auth/forgot-password`

`{ "email": "…" }` → **200** `{ "message": "If that e-mail is registered, a reset link is on its way." }`
(same answer for unknown addresses). The link carries a single-use token valid
for 30 minutes.

### `POST /auth/reset-password`

`{ "token": "…", "password": "NewPassword123!" }` → **200**
`{ "message": "Password updated. You can now sign in." }`. **400** for an
invalid or expired token. All other outstanding reset tokens are burned, and
**every existing session is signed out**.

### `GET /auth/me`

→ **200** `{ "id": "…", "email": "…", "role": "BUYER" }`

---

## Users

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /users/me` | Any | Own full profile |
| `PATCH /users/me` | Any | Update name, phone, avatar, bio |
| `PATCH /users/me/password` | Any | Change password |
| `GET /users/:id` | Public | Public seller profile |
| `POST /users/staff` | ADMIN | Create an appraiser or administrator account |

### `GET /users/me`

→ **200** `{ id, name, email, phone, role, status, emailVerified, phoneVerified, avatarUrl, bio, createdAt }`

### `PATCH /users/me`

All fields optional: `{ "name": "…", "phone": "+94…", "avatarUrl": "https://…", "bio": "≤ 500 chars" }`.
Role, status and e-mail cannot be changed here. → **200**, the updated profile.

### `PATCH /users/me/password`

`{ "currentPassword": "…", "newPassword": "…" }` → **200** `{ "message": "Password updated" }`.
**401** if the current password is wrong; **400** if the new one is the same.
Signs out all existing sessions, **including the caller's**, so send the user
back to the sign-in screen.

### `GET /users/:id`

→ **200** `{ id, name, role, avatarUrl, bio, createdAt, activeListings, completedSales }`.
**404** for unknown IDs and for administrators.

### `POST /users/staff`

`{ "name": "…", "email": "…", "phone": "…", "password": "≥ 8 chars", "role": "APPRAISER" }`
— `role` must be `APPRAISER` or `ADMIN`. → **201**, the created user. **409** if
the e-mail is taken.

---

## Listings

Base path `/listings`.

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /listings` | Public | Search, filter and sort |
| `GET /listings/featured` | Public | Rare and featured items for the home page |
| `GET /listings/categories` | Public | Live count per category |
| `GET /listings/mine` | SELLER | The seller's own listings, any status |
| `POST /listings` | SELLER | Create a listing (enters review) |
| `PATCH /listings/:id` | SELLER | Edit before bidding starts |
| `DELETE /listings/:id` | SELLER | Withdraw before bidding starts |
| `GET /listings/:id` | Optional | Full detail |

### `GET /listings`

Only `ACTIVE` and `SOLD` listings appear.

| Query | Type | Notes |
| --- | --- | --- |
| `q` | string ≤ 100 | Case-insensitive match on title, description, era, denomination |
| `category` | `Category` | |
| `condition` | `ItemCondition` | |
| `listingType` | `ListingType` | |
| `minPrice`, `maxPrice` | number ≥ 0 | Applied to the listing's starting price |
| `verifiedOnly` | boolean | Only appraiser-verified items |
| `featuredOnly` | boolean | |
| `sellerId` | string | |
| `sort` | `newest` (default) · `price_asc` · `price_desc` · `ending_soonest` · `popularity` | |
| `page`, `limit` | integer | See [Pagination](#pagination) |

→ **200** a [paginated](#pagination) list of **listing cards**:

```json
{
  "id": "…", "title": "Ceylon 1 Rupee 1951", "category": "OLD_COINS",
  "condition": "VERY_GOOD", "startingPrice": "10000", "listingType": "AUCTION",
  "status": "ACTIVE", "isVerified": true, "isFeatured": false, "viewCount": 42,
  "createdAt": "2026-10-27T09:00:00.000Z",
  "images": [{ "url": "https://…" }],
  "seller": { "id": "…", "name": "Sunil Fernando", "avatarUrl": null },
  "auction": { "id": "…", "currentPrice": "10500", "endTime": "…",
               "status": "ACTIVE", "bidCount": 2, "buyNowPrice": "35000" }
}
```

`images` holds only the first image; `auction` is `null` for fixed-price items.
`ending_soonest` puts fixed-price items last.

### `GET /listings/featured`

`?limit=8` → **200** an array of listing cards (`ACTIVE` items that are featured
or verified, featured first).

### `GET /listings/categories`

→ **200** `[{ "category": "OLD_COINS", "count": 12 }, …]` (`ACTIVE` listings
only; categories with none are omitted).

### `GET /listings/mine`

Same paging as search; returns the seller's listings in **every** status,
including `UNDER_REVIEW` and `WITHDRAWN`.

### `POST /listings`

```json
{
  "title": "Ceylon 1 Rupee 1951",
  "description": "Silver coin in very good condition, no major scratches.",
  "category": "OLD_COINS",
  "condition": "VERY_GOOD",
  "era": "1951",
  "denomination": "1 Rupee",
  "startingPrice": 10000,
  "listingType": "AUCTION",
  "images": [{ "url": "https://storage.example/coin-front.jpg", "position": 0 }],
  "certificates": [{ "fileUrl": "https://storage.example/cert.pdf", "fileName": "cert.pdf", "issuer": "Numismatic Society" }]
}
```

| Field | Rules |
| --- | --- |
| `title` | 5–150 characters |
| `description` | 20–5000 characters |
| `startingPrice` | number ≥ 1, ≤ 2 decimals |
| `listingType` | optional; defaults to `FIXED_PRICE` |
| `era`, `denomination` | optional, ≤ 50 characters |
| `images` | optional, ≤ 10; each a URL + optional `position` |
| `certificates` | optional, ≤ 5; each `fileUrl` (URL), `fileName` ≤ 255, `issuer` ≤ 150 |

The API stores **URLs only** — upload files straight to cloud storage first and
send the resulting URLs. → **201** the listing with `images` and `certificates`;
`status` is `UNDER_REVIEW`: it is invisible to the public until an appraiser
approves it.

### `PATCH /listings/:id`

Any subset of the create fields except `certificates` (use
[`POST /listings/:id/certificates`](#post-listingsidcertificates)). `images`, if
sent, **replaces the whole gallery**. → **200** the updated listing.

**Any edit sends the listing back to `UNDER_REVIEW` and clears `isVerified`.**
**400** once bidding has started or the auction has ended, or if the listing is
`SOLD` or `WITHDRAWN`. **403** for someone else's listing.

### `DELETE /listings/:id`

→ **200** the listing with `status: "WITHDRAWN"`. **400** once bidding has
started. **403** for someone else's listing.

### `GET /listings/:id`

→ **200** the full listing: all fields plus `images` (ordered), `seller`
`{ id, name, avatarUrl, createdAt }`, `certificates` (`id, fileName, issuer,
status, uploadedAt` — the file URL is not exposed), `verifications` (appraiser
history: `decision, comments, appraisedValue, verifiedAt, appraiser`),
`auction` (full row, or `null`) and `_count.orders`.

Guests and other users only see `ACTIVE` and `SOLD` listings (otherwise
**404**). The owner, appraisers and admins can also see listings under review.
Each view by a non-owner increments `viewCount`.

---

## Certificates & verification

An appraiser reviews listings in `UNDER_REVIEW`. Approval publishes the listing
with a verified badge.

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /listings/:id/certificates` | SELLER | Attach a certificate |
| `GET /listings/:id/certificates` | SELLER, APPRAISER | List certificates (with file URL) |
| `GET /verification/queue` | APPRAISER | Listings awaiting review, oldest first |
| `POST /listings/:id/verification` | APPRAISER | Record a decision |
| `GET /listings/:id/verification` | Public | Verification history |

### `POST /listings/:id/certificates`

`{ "fileUrl": "https://…", "fileName": "cert.pdf", "issuer": "…" }` → **201**
the certificate (`status: "PENDING"`). The listing returns to `UNDER_REVIEW`.
**400** if the listing is `SOLD`; **403** if it belongs to another seller.

### `GET /listings/:id/certificates`

→ **200** an array of certificates, newest first. Sellers see only their own
listings; appraisers and admins see any.

### `GET /verification/queue`

[Paginated](#pagination). Each item: `id, title, category, condition, era,
denomination, startingPrice, description, createdAt, seller {id,name,email},
images [{url}], certificates [...], verifications [last 3 decisions]`.

### `POST /listings/:id/verification`

```json
{ "decision": "APPROVED", "certificateId": "…", "comments": "…", "appraisedValue": 12000 }
```

| Field | Rules |
| --- | --- |
| `decision` | `APPROVED` · `REJECTED` · `MORE_EVIDENCE_REQUESTED` |
| `certificateId` | optional UUID; must belong to this listing |
| `comments` | **required** unless approving; ≤ 1000 characters |
| `appraisedValue` | optional number ≥ 0 |

Outcome:

| Decision | Listing becomes | `isVerified` | Certificate |
| --- | --- | --- | --- |
| `APPROVED` | `ACTIVE` | `true` | `APPROVED` |
| `REJECTED` | `REMOVED` | `false` | `REJECTED` |
| `MORE_EVIDENCE_REQUESTED` | stays `UNDER_REVIEW` | `false` | stays `PENDING` |

→ **201** the verification record. The seller is notified. **400** unless the
listing is currently `UNDER_REVIEW`, or if `certificateId` is not on this
listing. Every decision is kept in an immutable history and the audit log.

### `GET /listings/:id/verification`

→ **200** records newest first: `id, decision, comments, appraisedValue,
verifiedAt, appraiser {id,name}, certificate {id,fileName,issuer}`.

---

## Auctions & bidding

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /listings/:id/auction` | SELLER | Turn a listing into an auction |
| `GET /auctions/:id` | Public | Current state |
| `GET /auctions/:id/bids` | Public | Bid history |
| `POST /auctions/:id/bids` | BUYER, SELLER | Place a bid |
| `POST /auctions/:id/buy-now` | BUYER, SELLER | End the auction at the Buy Now price |
| `GET /bids/mine` | Any | Auctions the current user has bid on |

### `POST /listings/:id/auction`

```json
{
  "startPrice": 10000,
  "minIncrement": 500,
  "startTime": "2026-11-01T09:00:00Z",
  "endTime": "2026-11-08T09:00:00Z",
  "buyNowPrice": 35000
}
```

`startTime` defaults to now; `buyNowPrice` is optional and must exceed
`startPrice`. `endTime` must be after `startTime` and in the future. → **201**
the auction. Status is `ACTIVE` if it has started, otherwise `SCHEDULED` (a job
opens it when the time comes). The listing becomes `AUCTION` type with
`startingPrice` set to `startPrice`. **409** if the listing already has an
auction.

### `GET /auctions/:id`

→ **200** `{ id, listingId, startPrice, minIncrement, currentPrice, buyNowPrice,
startTime, endTime, status, winnerId, bidCount, extensionCount, listing {id,
title, sellerId, status}, winner {id,name} | null }`.

### `GET /auctions/:id/bids`

[Paginated](#pagination), newest first: `{ id, amount, status, placedAt, bidder {id,name} }`.

### `POST /auctions/:id/bids`

`{ "amount": 10500 }` → **201** the bid. Rules:

- The listing must be `ACTIVE` and the auction `ACTIVE` and not yet closed.
- The first bid may equal the opening price; every later bid must be at least
  `currentPrice + minIncrement` (the error states the exact minimum).
- A seller cannot bid on their own item (**403**); the current top bidder cannot
  outbid themselves (**400**).
- A bid inside the last 2 minutes extends the closing time by 2 minutes (see
  [Business rules](#business-rules)).

Side effects after the bid is accepted: the previous top bidder is notified
(`OUTBID`) and a WebSocket event is broadcast. Concurrent bids are serialised;
the loser is re-validated against the new price.

### `POST /auctions/:id/buy-now`

No body. Ends the auction immediately at `buyNowPrice` with the caller as
winner, and marks the listing `SOLD`. → **201** the ended auction. **400** if
there is no Buy Now price, the listing is not live, the auction is closed, or
bidding has already reached the Buy Now price. The winner then completes
[checkout](#post-orderscheckout).

### `GET /bids/mine`

[Paginated](#pagination), newest first: each bid plus `auction { id,
currentPrice, endTime, status, winnerId, listing {id,title} }`.

---

## Orders & payments

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /orders/checkout` | Any | Create an order and start payment |
| `GET /orders` | Any | Orders the user has **bought** |
| `GET /orders/sales` | Any | Orders the user has **sold** |
| `GET /orders/:id` | Any (buyer, seller or ADMIN) | Order detail |
| `PATCH /orders/:id/status` | buyer / seller / ADMIN (see below) | Advance an order |
| `POST /orders/:id/disputes` | buyer or seller | Raise a dispute |
| `POST /payments/callback` | Public (signature-verified) | Payment provider webhook |

### `POST /orders/checkout`

Provide **exactly one** of `auctionId` (you won it) or `listingId` (fixed-price
item), plus shipping details:

```json
{
  "auctionId": "…",
  "shippingName": "Kamala Silva",
  "shippingPhone": "+94771234567",
  "shippingAddress": "12 Galle Road",
  "shippingCity": "Colombo",
  "shippingPostalCode": "00300"
}
```

→ **201** `{ "order": { …, "status": "PENDING", "amount": "10500" }, "payment": { "transactionRef": "…", "redirectUrl"?: "…", "formFields"?: {…} } }`.
Send the buyer to `redirectUrl` / post `formFields` to the provider's hosted
page. The listing is marked `SOLD` immediately so nobody else can buy it.

Errors: **400** (both or neither ID; auction not closed; listing not available
or is an auction item), **403** (not the winner; own item), **409** (auction
already checked out, or two buyers raced for the same item — retry).

### `GET /orders` and `GET /orders/sales`

[Paginated](#pagination); optional `?status=PAID`. Each order includes
`listing {id,title,images[0]}`, `payment {status,provider,transactionRef}`,
`buyer`, `seller`, `dispute {id,status}`, plus the shipping fields and
`trackingNumber`.

### `GET /orders/:id`

→ **200** the order with `listing`, full `payment`, `buyer`/`seller`
`{id,name,email}` and `dispute`. **403** for anyone not involved (admins excepted).

### `PATCH /orders/:id/status`

`{ "status": "SHIPPED", "trackingNumber": "LK123456" }`

Allowed moves, and who may make them:

| From → To | Who |
| --- | --- |
| `PENDING` → `PAID` | the payment callback; ADMIN only by hand (to reconcile a payment). Buyers and sellers get **403** |
| `PAID` → `SHIPPED` | seller (or ADMIN); `trackingNumber` optional |
| `SHIPPED` → `COMPLETED` | buyer (or ADMIN) — confirms receipt |
| `PENDING`/`PAID` → `CANCELLED` | ADMIN only |

Anything else is **400**; the wrong actor is **403**. Cancelling a fixed-price
order puts the listing back on sale; an auction item stays sold. The buyer is
notified when the item ships.

### `POST /orders/:id/disputes`

`{ "reason": "10–200 chars", "details": "≤ 2000 chars (optional)" }` → **201**
the dispute (`OPEN`). One dispute per order (**409**); not on cancelled orders
(**400**). The other party is notified; an admin resolves it
([below](#reports--administration)).

### `POST /payments/callback`

Called by the payment provider, not by a user. The gateway implementation
verifies the provider's signature; an unverifiable payload is rejected with
**400** and nothing is written. Processing is **idempotent on `transactionRef`**,
so retries are harmless (`{ "status": "…", "alreadyProcessed": true }`).

- If the callback reports an amount and it differs from the order amount → **400**.
- Success → payment `SUCCEEDED`, order `PAID`, both parties notified.
- Failure → payment `FAILED`, order `CANCELLED`, and a fixed-price item goes back
  on sale. The buyer starts a new checkout.

**Development:** the default `manual` gateway accepts
`{ "transactionRef": "manual_…", "status": "succeeded" | "failed", "amount"?: 10500 }`
and refuses to run when `NODE_ENV=production`. Take the `transactionRef` from
the checkout response.

---

## Notifications

In-app notification centre. All routes need a signed-in user and only ever touch
that user's own notifications.

| Method & path | Purpose |
| --- | --- |
| `GET /notifications?unreadOnly=true&page=&limit=` | Paginated, newest first |
| `GET /notifications/unread-count` | `{ "count": 3 }` |
| `PATCH /notifications/:id/read` | `{ "updated": 1 }` |
| `PATCH /notifications/read-all` | `{ "updated": 3 }` |

A notification: `{ id, type, title, message, channel, readStatus, payload, sentAt }`.
`payload` carries IDs for deep links, e.g. `{ "auctionId": "…", "listingId": "…" }`
or `{ "orderId": "…" }`. E-mail/SMS copies are delivered in the background with
retries and never slow a request.

---

## Reports & administration

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /reports` | Any | Report a listing or user |
| `GET /admin/users` | ADMIN | List and search users |
| `PATCH /admin/users/:id/suspend` | ADMIN | Suspend an account |
| `PATCH /admin/users/:id/reinstate` | ADMIN | Reinstate an account |
| `PATCH /admin/listings/:id/moderate` | ADMIN | Approve, remove or re-queue a listing |
| `GET /admin/reports` | ADMIN | Reported-content queue |
| `PATCH /admin/reports/:id/resolve` | ADMIN | Action or dismiss a report |
| `GET /admin/disputes` | ADMIN | Dispute queue |
| `PATCH /admin/disputes/:id/resolve` | ADMIN | Resolve a dispute |
| `GET /admin/analytics` | ADMIN | Dashboard figures |
| `GET /admin/audit-log` | ADMIN | Recent administrative activity |

### `POST /reports`

```json
{ "targetType": "LISTING", "reportedListingId": "…", "reason": "Looks like a replica sold as genuine", "details": "…" }
```

For `targetType: "USER"` send `reportedUserId` instead. `reason` is 10–200
characters. → **201** the report (`OPEN`). **404** for an unknown target; **400**
for reporting yourself; **409** if you already have an open report on the same
target.

### `GET /admin/users`

`?role=&status=&q=` (name/e-mail search) + paging → users with `id, name, email,
phone, role, status, emailVerified, createdAt` and `_count { listings,
ordersAsBuyer, reportsAgainst }`.

### `PATCH /admin/users/:id/suspend`

`{ "reason": "10–500 chars" }` → **200** `{ id, name, email, status }`. The
user's `ACTIVE` listings are removed, they are notified, and they are signed out
on their next request. **400** for administrator accounts; **409** if already
suspended.

### `PATCH /admin/users/:id/reinstate`

No body → **200**. **400** if the account is not suspended. Their removed
listings are **not** restored — re-approve them individually.

### `PATCH /admin/listings/:id/moderate`

`{ "status": "REMOVED", "reason": "…" }` — `status` is `ACTIVE`, `REMOVED` or
`UNDER_REVIEW`; `reason` (≤ 500) is **required** for `REMOVED`. → **200** the
listing; the seller is notified. A `SOLD` listing can only be set to `REMOVED`.

### `GET /admin/reports`

`?status=` — defaults to `OPEN` and `REVIEWING`. Oldest first, each with
`reporter`, `reportedListing {id,title,status}` or `reportedUser {…}`.

### `PATCH /admin/reports/:id/resolve`

`{ "status": "ACTIONED" | "DISMISSED" | "REVIEWING", "resolutionNote": "5–1000 chars" }`
→ **200**. **409** if already resolved. Resolving a report does not by itself
remove the listing or suspend the user; use the endpoints above.

### `GET /admin/disputes`

`?status=` — defaults to `OPEN` and `UNDER_REVIEW`. Each dispute includes
`raisedBy` and its `order` (with `listing`, `buyer`, `seller`, `payment`).

### `PATCH /admin/disputes/:id/resolve`

```json
{ "status": "RESOLVED", "resolution": "Refunded the buyer after reviewing photos", "orderAction": "REFUND_BUYER" }
```

`status` is `RESOLVED` or `REJECTED`. `orderAction` is optional and applies only
when `RESOLVED`:

| `orderAction` | Effect |
| --- | --- |
| `NONE` (default) | Record the outcome only |
| `REFUND_BUYER` | Order → `CANCELLED`; a `SUCCEEDED` payment → `REFUNDED` **in our records** (the money itself is returned through the payment provider) |
| `COMPLETE_ORDER` | Order → `COMPLETED` (seller wins) |

→ **200**. Both parties are notified. **409** if already closed; **400** if an
`orderAction` is requested on an order that is already `CANCELLED` or
`COMPLETED`.

### `GET /admin/analytics`

```json
{
  "users":    { "total": 120, "suspended": 2, "newThisMonth": 14 },
  "listings": { "active": 48, "underReview": 6, "byCategory": [{ "category": "OLD_COINS", "count": 20 }] },
  "auctions": { "live": 9 },
  "sales":    { "completed": 31, "grossValue": "845000" },
  "moderation": { "openReports": 3, "openDisputes": 1 }
}
```

`grossValue` sums orders that are `PAID`, `SHIPPED` or `COMPLETED`.

### `GET /admin/audit-log`

`?limit=50` → recent entries: `{ id, actorId, action, entityType, entityId,
metadata, createdAt, actor {id,name,role} }`. Actions include
`VERIFICATION_*`, `USER_SUSPENDED`, `USER_REINSTATED`, `LISTING_*`, `REPORT_*`,
`DISPUTE_*`, `AUCTION_CLOSED`, `PAYMENT_SUCCEEDED`, `PAYMENT_FAILED`.

---

## Health

| Method & path | Auth | Response |
| --- | --- | --- |
| `GET /health` | Public | `{ "status": "ok", "uptime": 123.4 }` — liveness |
| `GET /ready` | Public | `{ "status": "ready", "database": "up" }`, or `{ "status": "degraded", "database": "down" }` — always HTTP 200, so check the body |

---

## Live bidding (WebSocket)

Socket.IO, namespace **`/auctions`**, same origin rules as the REST API (CORS
`credentials: true`). Reading is open to guests; **bids are never placed over the
socket** — use [`POST /auctions/:id/bids`](#post-auctionsidbids).

```ts
import { io } from 'socket.io-client';

const socket = io(`${API_URL}/auctions`, { withCredentials: true });
socket.emit('auction:subscribe', { auctionId }, (ack) => /* { subscribed: auctionId } */);
```

**Client → server**

| Event | Payload | Ack |
| --- | --- | --- |
| `auction:subscribe` | `{ auctionId }` | `{ subscribed }` or `{ error }` |
| `auction:unsubscribe` | `{ auctionId }` | `{ unsubscribed }` or `{ error }` |

**Server → client** (only to sockets subscribed to that auction)

| Event | Payload | When |
| --- | --- | --- |
| `auction:bid` | `{ auctionId, currentPrice, bidCount, endTime, bidder: {id,name}, placedAt }` | A bid is accepted |
| `auction:extended` | `{ auctionId, endTime }` | A late bid pushed the close out |
| `auction:closed` | `{ auctionId, listingId, finalPrice, winner: {id,name} \| null }` | The auction ended (sweep or Buy Now) |

`currentPrice` and `finalPrice` are decimal strings. Always re-sync with
`GET /auctions/:id` after (re)connecting — events missed while offline are not
replayed.

---

## Business rules

| Rule | Value |
| --- | --- |
| New listing status | `UNDER_REVIEW` until an appraiser approves |
| Editing a listing | Re-queues it for review and clears the verified badge; blocked once bidding starts |
| Bidding window | A listing must be `ACTIVE`, the auction `ACTIVE`, and `now < endTime` |
| Minimum bid | First bid ≥ `startPrice`; later bids ≥ `currentPrice + minIncrement` |
| Anti-snipe | A bid within `AUCTION_ANTI_SNIPE_WINDOW_SECONDS` (120 s) of the close sets the close to *bid time + `AUCTION_ANTI_SNIPE_EXTENSION_SECONDS`* (120 s) |
| Auction close | A job runs every 30 s and settles auctions past `endTime`: top bid wins (earliest wins a tie), the listing becomes `SOLD`, or `EXPIRED` if there were no bids |
| Auction open | A job runs every minute and opens `SCHEDULED` auctions whose start time has arrived |
| Closing-soon alert | One reminder to the seller and bidders about 1 hour before the close |
| Order lifecycle | `PENDING → PAID → SHIPPED → COMPLETED`; `CANCELLED` by an admin or a failed payment |
| Passwords | Changing or resetting one signs out all sessions |
| Rate limits | 10 requests/second and 120/minute per client; `429` when exceeded |
| Notifications | In-app plus e-mail/SMS where relevant; delivery is asynchronous with up to 5 retries |
