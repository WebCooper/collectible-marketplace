# API Sample Requests

Copy-paste JSON for every endpoint, in an order you can run top to bottom
against a freshly seeded database (`npm run prisma:seed`). Field rules and
responses are in [`API.md`](API.md).

**Setup**

- Base URL: `http://localhost:3001`. Every request with a body needs
  `Content-Type: application/json`.
- Seeded password for every account: `Password123!`
- Authenticated calls need `Authorization: Bearer <accessToken>` (in Postman /
  Insomnia / curl). Log in as each role once and keep the four tokens:
  **ADMIN**, **APPRAISER**, **SELLER**, **BUYER**. Access tokens last 15 minutes;
  log in again (or call `/auth/refresh`) when you get a `401`.
- `<placeholders>` such as `<listingId>` are IDs returned by an earlier step.
- Each step is labelled with who calls it. Steps marked **(optional)** can be
  skipped.
- Sending a property that is not shown here returns `400` (unknown fields are
  rejected).

**Curl shape**

```bash
curl -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"buyer@marketplace.lk","password":"Password123!"}'

curl http://localhost:3001/users/me -H "Authorization: Bearer $BUYER"
```

---

## 0. Health — no auth

```
GET /health
GET /ready
```

## 1. Auth

### 1.1 Register — `POST /auth/register` (public)

```json
{
  "name": "Test Buyer",
  "email": "test.buyer@example.lk",
  "phone": "+94771234567",
  "password": "Password123!",
  "role": "BUYER"
}
```

Use `"role": "SELLER"` for a seller. `phone` and `role` are optional.
`"role": "ADMIN"` or `"APPRAISER"` must return `400`.

### 1.2 Verify OTP — `POST /auth/verify-otp` (public)

The 6-digit code is printed in the API's console log (nothing is e-mailed in
development).

```json
{ "email": "test.buyer@example.lk", "code": "123456" }
```

### 1.3 Resend OTP — `POST /auth/resend-otp` (public)

```json
{ "email": "test.buyer@example.lk" }
```

### 1.4 Login — `POST /auth/login` (public)

Run once per seeded role and keep each `accessToken`:

```json
{ "email": "admin@marketplace.lk", "password": "Password123!" }
```
```json
{ "email": "appraiser@marketplace.lk", "password": "Password123!" }
```
```json
{ "email": "seller@marketplace.lk", "password": "Password123!" }
```
```json
{ "email": "buyer@marketplace.lk", "password": "Password123!" }
```
```json
{ "email": "buyer2@marketplace.lk", "password": "Password123!" }
```

Expect `200` with `accessToken`, `refreshToken`, `user`, and `Set-Cookie` for
`access_token` and `refresh_token`. Negative test — wrong password → `401`:

```json
{ "email": "buyer@marketplace.lk", "password": "WrongPassword1" }
```

### 1.5 Refresh — `POST /auth/refresh` (public)

```json
{ "refreshToken": "<refreshToken from login>" }
```

With an empty body `{}` it reads the `refresh_token` cookie instead (use a
client that keeps cookies).

### 1.6 Logout — `POST /auth/logout` (public)

No body. Clears the cookies.

### 1.7 Forgot password — `POST /auth/forgot-password` (public)

```json
{ "email": "buyer@marketplace.lk" }
```

The reset token appears in the API log (as `payload.token`). Unknown e-mails get
the same `200` reply.

### 1.8 Reset password — `POST /auth/reset-password` (public)

```json
{ "token": "<token from the log>", "password": "NewPassword123!" }
```

### 1.9 Who am I — `GET /auth/me` (any signed-in user)

No body.

## 2. Users

### 2.1 `GET /users/me` — any user. No body.

### 2.2 Update profile — `PATCH /users/me` — any user

All fields optional:

```json
{
  "name": "Kamala Silva",
  "phone": "+94771234567",
  "avatarUrl": "https://example.com/avatars/kamala.png",
  "bio": "Collector of Ceylon coins since 1998."
}
```

### 2.3 Change password — `PATCH /users/me/password` — any user

```json
{ "currentPassword": "Password123!", "newPassword": "Another123Pass" }
```

All sessions (including this one) are signed out afterwards.

### 2.4 Public profile — `GET /users/<sellerId>` (public). No body.

### 2.5 Create staff — `POST /users/staff` — ADMIN

```json
{
  "name": "New Appraiser",
  "email": "appraiser2@marketplace.lk",
  "phone": "+94771234568",
  "password": "Password123!",
  "role": "APPRAISER"
}
```

`role` is `APPRAISER` or `ADMIN`.

## 3. Listings

### 3.1 Search — `GET /listings` (public)

```
GET /listings
GET /listings?q=rupee
GET /listings?category=OLD_COINS&condition=VERY_GOOD
GET /listings?listingType=AUCTION&verifiedOnly=true
GET /listings?minPrice=1000&maxPrice=50000&sort=price_asc
GET /listings?sort=ending_soonest&page=1&limit=10
```

`sort`: `newest` · `price_asc` · `price_desc` · `ending_soonest` · `popularity`.

### 3.2 Home page data (public)

```
GET /listings/featured?limit=8
GET /listings/categories
```

### 3.3 Create a fixed-price listing — `POST /listings` — SELLER

```json
{
  "title": "Ceylon 50 Cents 1963 Coin",
  "description": "Nickel-brass 50 cent coin from 1963, light wear, clear details.",
  "category": "OLD_COINS",
  "condition": "GOOD",
  "era": "1963",
  "denomination": "50 Cents",
  "startingPrice": 2500,
  "listingType": "FIXED_PRICE",
  "images": [
    { "url": "https://example.com/img/50c-front.jpg", "position": 0 },
    { "url": "https://example.com/img/50c-back.jpg", "position": 1 }
  ],
  "certificates": [
    {
      "fileUrl": "https://example.com/certs/50c.pdf",
      "fileName": "50c-certificate.pdf",
      "issuer": "Ceylon Numismatic Society"
    }
  ]
}
```

Returns `status: "UNDER_REVIEW"`. Save the `id` as `<fixedListingId>`.

### 3.4 Create an auction listing — `POST /listings` — SELLER

```json
{
  "title": "Ceylon 1 Rupee 1951 Silver Proof",
  "description": "Rare silver proof rupee from 1951 in excellent condition, with case.",
  "category": "PROOF_COINS",
  "condition": "EXCELLENT",
  "era": "1951",
  "denomination": "1 Rupee",
  "startingPrice": 10000,
  "listingType": "AUCTION",
  "images": [{ "url": "https://example.com/img/proof-1951.jpg" }]
}
```

Save the `id` as `<auctionListingId>`.

### 3.5 My listings — `GET /listings/mine` — SELLER. No body.

### 3.6 Listing detail — `GET /listings/<listingId>` (public for live
listings; the owner also sees it while under review). No body.

### 3.7 Edit — `PATCH /listings/<listingId>` — SELLER

Any subset of the create fields, except `certificates`. An edit sends the
listing back to review.

```json
{
  "title": "Ceylon 50 Cents 1963 Coin (Cleaned)",
  "startingPrice": 2800,
  "images": [{ "url": "https://example.com/img/50c-new-front.jpg" }]
}
```

### 3.8 Withdraw — `DELETE /listings/<listingId>` — SELLER. No body.

## 4. Certificates and verification

### 4.1 Attach a certificate — `POST /listings/<listingId>/certificates` — SELLER

```json
{
  "fileUrl": "https://example.com/certs/proof-1951.pdf",
  "fileName": "proof-1951.pdf",
  "issuer": "Royal Mint Appraisals"
}
```

### 4.2 List certificates — `GET /listings/<listingId>/certificates` — SELLER
(own listing) or APPRAISER. No body.

### 4.3 Review queue — `GET /verification/queue?page=1&limit=20` — APPRAISER

### 4.4 Decide — `POST /listings/<listingId>/verification` — APPRAISER

Approve (publishes the listing with a verified badge):

```json
{
  "decision": "APPROVED",
  "certificateId": "<certificateId>",
  "appraisedValue": 12000
}
```

Reject (`comments` required):

```json
{
  "decision": "REJECTED",
  "comments": "The certificate does not match the coin in the photos."
}
```

Ask for more evidence (`comments` required, listing stays in the queue):

```json
{
  "decision": "MORE_EVIDENCE_REQUESTED",
  "comments": "Please upload a clearer photo of the edge and the date."
}
```

### 4.5 History — `GET /listings/<listingId>/verification` (public). No body.

## 5. Auctions and bidding

Approve `<auctionListingId>` first (step 4.4) — bids on unapproved listings are
rejected.

### 5.1 Create the auction — `POST /listings/<auctionListingId>/auction` — SELLER

Starts immediately, closes in the future (edit the date to be later than now):

```json
{
  "startPrice": 10000,
  "minIncrement": 500,
  "endTime": "2026-12-31T18:00:00.000Z",
  "buyNowPrice": 35000
}
```

Scheduled start:

```json
{
  "startPrice": 10000,
  "minIncrement": 500,
  "startTime": "2026-12-01T09:00:00.000Z",
  "endTime": "2026-12-08T09:00:00.000Z"
}
```

Save the `id` as `<auctionId>`.

### 5.2 Read — public

```
GET /auctions/<auctionId>
GET /auctions/<auctionId>/bids?page=1&limit=20
```

### 5.3 Place a bid — `POST /auctions/<auctionId>/bids` — BUYER

First bid (may equal the opening price):

```json
{ "amount": 10000 }
```

Then, as **buyer2**, the next bid must be at least the current price plus the
increment:

```json
{ "amount": 10500 }
```

Expected failures: `{ "amount": 10100 }` → `400` (below the increment); the
same buyer bidding twice in a row → `400`; the seller bidding → `403`.

### 5.4 Buy now — `POST /auctions/<auctionId>/buy-now` — BUYER. No body.

Ends the auction at `buyNowPrice` (only when one was set).

### 5.5 My bids — `GET /bids/mine` — BUYER. No body.

## 6. Orders and payments

### 6.1 Checkout a won auction — `POST /orders/checkout` — the winning BUYER

(After the auction ended — via Buy Now, or wait for the closing job.)

```json
{
  "auctionId": "<auctionId>",
  "shippingName": "Kamala Silva",
  "shippingPhone": "+94771234567",
  "shippingAddress": "12 Galle Road, Bambalapitiya",
  "shippingCity": "Colombo",
  "shippingPostalCode": "00400"
}
```

### 6.2 Checkout a fixed-price item — `POST /orders/checkout` — BUYER

(The listing must be approved and `ACTIVE`.)

```json
{
  "listingId": "<fixedListingId>",
  "shippingName": "Kamala Silva",
  "shippingPhone": "+94771234567",
  "shippingAddress": "12 Galle Road, Bambalapitiya",
  "shippingCity": "Colombo",
  "shippingPostalCode": "00400"
}
```

Sending both `auctionId` and `listingId`, or neither → `400`. Save
`order.id` as `<orderId>` and `payment.transactionRef` as `<transactionRef>`.

### 6.3 Simulate the payment — `POST /payments/callback` (public)

Development gateway only. Success:

```json
{ "transactionRef": "<transactionRef>", "status": "succeeded", "amount": 10500 }
```

`amount` must equal the order amount (or be left out). Failure (cancels the
order):

```json
{ "transactionRef": "<transactionRef>", "status": "failed" }
```

Posting the same success again returns `{ "alreadyProcessed": true }`.

### 6.4 Read orders

```
GET /orders?status=PAID           (BUYER — items I bought)
GET /orders/sales                 (SELLER — items I sold)
GET /orders/<orderId>             (buyer, seller or ADMIN)
```

### 6.5 Move an order along — `PATCH /orders/<orderId>/status`

Seller ships (order must be `PAID`):

```json
{ "status": "SHIPPED", "trackingNumber": "LK1234567890" }
```

Buyer confirms receipt (order must be `SHIPPED`):

```json
{ "status": "COMPLETED" }
```

Admin cancels:

```json
{ "status": "CANCELLED" }
```

Expected failures: on a `PENDING` order, a buyer or seller sending
`{ "status": "PAID" }` → `403`, and sending `COMPLETED` → `400` (not an allowed
move). On a `PAID` order, a buyer sending `SHIPPED` → `403`.

### 6.6 Raise a dispute — `POST /orders/<orderId>/disputes` — buyer or seller

```json
{
  "reason": "Item received does not match the listing description",
  "details": "The coin is visibly cleaned; the listing said uncleaned with original patina."
}
```

Save the `id` as `<disputeId>`.

## 7. Notifications — any signed-in user

```
GET   /notifications?page=1&limit=20
GET   /notifications?unreadOnly=true
GET   /notifications/unread-count
PATCH /notifications/<notificationId>/read
PATCH /notifications/read-all
```

No bodies. Try these as the seller after step 5.3 (outbid / new-bid events) and
as the buyer after 6.3.

## 8. Reports and administration

### 8.1 Report a listing — `POST /reports` — any signed-in user

```json
{
  "targetType": "LISTING",
  "reportedListingId": "<listingId>",
  "reason": "Photos look copied from another website",
  "details": "The same images appear on a coin dealer's page."
}
```

### 8.2 Report a user — `POST /reports`

```json
{
  "targetType": "USER",
  "reportedUserId": "<userId>",
  "reason": "Asked me to pay outside the platform"
}
```

Reporting the same target twice while the first is open → `409`.

### 8.3 Users — `GET /admin/users` — ADMIN

```
GET /admin/users
GET /admin/users?role=SELLER&status=ACTIVE
GET /admin/users?q=kamala&page=1&limit=20
```

### 8.4 Suspend — `PATCH /admin/users/<userId>/suspend` — ADMIN

```json
{ "reason": "Repeated reports of listing counterfeit items" }
```

`reason` must be at least 10 characters. After this the user's next request
returns `401`.

### 8.5 Reinstate — `PATCH /admin/users/<userId>/reinstate` — ADMIN. No body.

### 8.6 Moderate a listing — `PATCH /admin/listings/<listingId>/moderate` — ADMIN

```json
{ "status": "REMOVED", "reason": "Counterfeit item" }
```
```json
{ "status": "ACTIVE" }
```
```json
{ "status": "UNDER_REVIEW" }
```

### 8.7 Report queue — ADMIN

```
GET /admin/reports
GET /admin/reports?status=ACTIONED
```

### 8.8 Resolve a report — `PATCH /admin/reports/<reportId>/resolve` — ADMIN

```json
{
  "status": "ACTIONED",
  "resolutionNote": "Listing removed and the seller was warned."
}
```
```json
{ "status": "DISMISSED", "resolutionNote": "No evidence of a policy violation." }
```

### 8.9 Dispute queue — ADMIN

```
GET /admin/disputes
GET /admin/disputes?status=RESOLVED
```

### 8.10 Resolve a dispute — `PATCH /admin/disputes/<disputeId>/resolve` — ADMIN

Buyer wins — cancel the order and mark the payment refunded:

```json
{
  "status": "RESOLVED",
  "resolution": "Refunded the buyer in full after reviewing the photos.",
  "orderAction": "REFUND_BUYER"
}
```

Seller wins — close the order as completed:

```json
{
  "status": "RESOLVED",
  "resolution": "Item matches the listing; closing the order.",
  "orderAction": "COMPLETE_ORDER"
}
```

Record the outcome only, or reject the dispute:

```json
{ "status": "RESOLVED", "resolution": "Parties agreed a partial refund directly." }
```
```json
{ "status": "REJECTED", "resolution": "No evidence supplied by the buyer." }
```

### 8.11 Analytics and audit log — ADMIN

```
GET /admin/analytics
GET /admin/audit-log?limit=50
```

## 9. Live bidding (WebSocket)

Not an HTTP call — use a Socket.IO client (or Postman's Socket.IO request type)
on `http://localhost:3001/auctions`.

Send:

```json
{ "event": "auction:subscribe", "payload": { "auctionId": "<auctionId>" } }
```

Then place a bid over REST (step 5.3) and watch for `auction:bid`. Inside the
last 2 minutes of an auction a bid also emits `auction:extended`; when the
auction ends, `auction:closed`. Stop listening with `auction:unsubscribe` and
the same payload.

---

## Role and negative-path checks worth running

| Call | As | Expect |
| --- | --- | --- |
| `GET /admin/analytics` | BUYER | `403` |
| `POST /listings` | BUYER | `403` |
| `POST /listings/<id>/verification` | SELLER | `403` |
| `GET /users/me` | no token | `401` |
| `POST /auctions/<id>/bids` on an unapproved listing | BUYER | `400` |
| `POST /auth/register` with `"role": "ADMIN"` | public | `400` |
| `POST /auth/register` with `"password": "weak"` | public | `400` (message lists the failing rules) |
| `PATCH /listings/<id>` after a bid exists | SELLER | `400` |
| `POST /orders/checkout` for someone else's auction | BUYER | `403` |
