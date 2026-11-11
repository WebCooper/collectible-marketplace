"use client";

import { useState } from "react";
import Link from "next/link";
import { auctionsApi, errorMessage } from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/providers/auth-provider";
import { formatDateTime, formatLKR } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageContainer, PageHeader } from "@/components/shared/page-header";

/** GET /bids/mine - every bid placed, with the auction's current state. */
export function MyBids() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApiQuery(`bids:${page}`, () => auctionsApi.myBids({ page, limit: 10 }));

  return (
    <PageContainer>
      <PageHeader title="My bids" description="Auctions you have bid on. Winners can check out from the lot page." />
      {error !== undefined && <Alert variant="error">{errorMessage(error)}</Alert>}
      {loading && !data && <div className="h-40 rounded-md bg-surface animate-pulse" />}
      {data && data.data.length === 0 && (
        <div className="rounded-md border border-dashed border-line p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">You have not placed any bids.</p>
          <Link href="/listings?listingType=AUCTION"><Button variant="gold">Browse auctions</Button></Link>
        </div>
      )}
      <ul className="space-y-3">
        {data?.data.map((bid) => {
          const won = bid.auction.status === "ENDED" && bid.auction.winnerId === user?.id;
          const leading = bid.auction.status === "ACTIVE" && bid.status === "ACTIVE";
          return (
            <li key={bid.id} className="flex flex-wrap items-center gap-4 rounded-md border border-line bg-white p-4">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/listings/${bid.auction.listing.id}`} className="font-medium text-ink hover:underline truncate">{bid.auction.listing.title}</Link>
                  <StatusBadge status={won ? "WON" : bid.status} />
                  <StatusBadge status={bid.auction.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Placed {formatDateTime(bid.placedAt)} · {bid.auction.status === "ACTIVE" ? "closes" : "closed"} {formatDateTime(bid.auction.endTime)}
                </p>
                {leading && <p className="text-xs text-success">You are the highest bidder.</p>}
                {bid.status === "OUTBID" && bid.auction.status === "ACTIVE" && <p className="text-xs text-live">You were outbid — place a higher bid.</p>}
              </div>
              <dl className="text-right text-sm">
                <dt className="text-xs text-muted-foreground">Your bid</dt>
                <dd className="font-semibold tabular-nums">{formatLKR(bid.amount)}</dd>
                <dt className="mt-1 text-xs text-muted-foreground">Current price</dt>
                <dd className="tabular-nums">{formatLKR(bid.auction.currentPrice)}</dd>
              </dl>
              {won && (
                <Link href={`/listings/${bid.auction.listing.id}`}><Button variant="gold" size="sm">Check out</Button></Link>
              )}
            </li>
          );
        })}
      </ul>
      <Pagination meta={data?.meta} onPage={setPage} />
    </PageContainer>
  );
}
