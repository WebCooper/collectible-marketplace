# Collective staff workspace

Member 1's Vite + React + TypeScript + Tailwind admin/appraiser frontend.

## Run

```powershell
cd admin
npm ci
Copy-Item .env.example .env
npm run dev
```

Open http://localhost:5173 with the backend running at http://localhost:3001.
Set `VITE_API_URL` in `.env` if the API uses a different origin. The backend's
`CORS_ORIGINS` must include the frontend origin. Use localhost consistently for
both services. Cookies require same-site hosting (HTTPS in production).

If the team's seed data has been loaded, use `admin@marketplace.lk` or
`appraiser@marketplace.lk`, with the development password documented in
`backend/prisma/seed.ts`. Otherwise request a staff account from an administrator.

`npm run build` checks TypeScript and creates `dist/`.
`npm run preview` previews that build; add its origin to backend CORS as needed.

## Flows

Administrators can view live analytics and audit activity; search and paginate
users; suspend/reinstate accounts; moderate pending and active listings; record
report outcomes; resolve disputes; and review certificates. Appraisers see only
the certificate queue. Every mutation has a confirmation dialog, pending state,
server error feedback, and reloads its queue after success. The backend enforces
permissions. Authentication uses httpOnly cookies, restores sessions on reload,
and retries protected requests once after a shared refresh request.

The API client and response types are in `src/services/api.ts`. Navigation uses
URL fragments so browser history and direct links work without server rewrites.

## Backend boundaries

- Pending listing data comes from `/verification/queue`; active and sold listings from
  public `/listings`. There is no all-status administrative listing endpoint.
- Approval through moderation publishes without adding the expert authenticity
  badge. Verification approval records an expert decision and grants the badge.
- Actioning a report records its outcome. Apply target moderation on its own page.
- Dispute refunds mark records refunded; returning funds requires the payment provider.
- Analytics are current aggregates. No invented historical charts or flagged
  listing counts are displayed. Recent verification history is supplied by the queue.
- Upload and signed URL infrastructure belongs to Member 4; appraisers open
  existing evidence URLs supplied by the backend.

See `../MEMBER1_PLAN.md` for implementation scope and presentation topics.

