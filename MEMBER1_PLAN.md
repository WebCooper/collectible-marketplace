# Member 1 implementation plan

Scope: admin/ only, plus this plan. The report and group task division are requirements context; the running backend is the integration contract.

## Delivery sequence

1. Replace the vanilla scaffold with React, TypeScript and Tailwind; use port 5173.
2. Connect staff authentication through httpOnly cookies, session restoration, refresh and logout. Restrict the workspace to ADMIN and APPRAISER.
3. Build the admin overview, user suspension/reinstatement, pending listing moderation and active listing review.
4. Build report outcomes and dispute resolution, including explicit order outcomes.
5. Build certificate review with supporting documents, recent decisions, certificate association and optional LKR valuation.
6. Show analytics using available API aggregates, with category charts and recent audit activity.
7. Verify compilation, API/session behavior and responsive browser rendering; document setup and integration limitations.

## Integration decisions

- VITE_API_URL defaults to http://localhost:3001. All API operations live in src/services/api.ts.
- Use the existing backend's httpOnly cookies; do not persist returned tokens in browser storage.
- The verification queue supplies pending listings; public search supplies active and sold listings. There is no administrative all-status listing index endpoint.
- Moderation approval does not confer expert verification.
- Report action records an outcome only. Apply account/listing moderation separately.
- Refund decisions update payment records. Provider refunds belong to Member 4.
- Current API aggregates support snapshot charts, not historical time series or a distinct flagged-listing count. Open reports are presented with that exact label.
- No backend, client, deployment or external integration changes belong to this work.

## Presentation preparation

Demonstrate staff sign-in, one moderation decision, a report/dispute outcome and expert verification. Explain the shared API boundary, role-specific navigation, cookie sessions and auditable decisions. Architecture and stack discussion: React/Vite for an internal SPA, Tailwind plus shared component styles, and typed REST contracts against the NestJS modular backend.


## Verification record

- Implemented all seven workspace views and the shared API service.
- Five API boundary tests cover login credentials, refresh retry, expiry events, validation/search encoding and dispute payloads.
- Live read-only integration checks passed against the running API: staff sign-in, analytics, users, reports, disputes, verification queue and audit log. No domain records were changed.
- Browser rendering and interactive mutation acceptance checks remain manual: this session has no connected browser surface. Verify desktop/mobile layouts, sign-in/refresh/logout, one suspension/reinstatement, listing decisions, report and dispute outcomes, and appraiser decisions using disposable development records.

- Production TypeScript/Vite build passed.
