"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { errorMessage, listingsApi } from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatDateTime, formatLKR } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ListingImage } from "@/components/listings/listing-image";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageContainer, PageHeader } from "@/components/shared/page-header";

const STATUS_HINT: Record<string, string> = {
  UNDER_REVIEW: "Waiting for an appraiser. It is not visible to buyers yet.",
  ACTIVE: "Live in the catalogue.",
  SOLD: "Sold.",
  WITHDRAWN: "You withdrew this listing.",
  REMOVED: "Removed by a moderator.",
  EXPIRED: "The auction ended without a sale.",
};

/** The seller's dashboard: every listing they own, whatever its status. */
export function SellerListings() {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApiQuery(`mine:${page}`, () => listingsApi.mine({ page, limit: 10 }));

  return (
    <PageContainer>
      <PageHeader
        title="My listings"
        description="Create listings, follow their review status and manage auctions."
        action={
          <Link href="/seller/listings/new">
            <Button variant="gold"><Plus className="h-4 w-4 mr-1.5" /> New listing</Button>
          </Link>
        }
      />
      {error !== undefined && <Alert variant="error">{errorMessage(error)}</Alert>}
      {loading && !data && <div className="h-40 rounded-md bg-surface animate-pulse" />}
      {data && data.data.length === 0 && (
        <div className="rounded-md border border-dashed border-line p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">You have not listed anything yet.</p>
          <Link href="/seller/listings/new"><Button variant="gold">Create your first listing</Button></Link>
        </div>
      )}
      <ul className="space-y-3">
        {data?.data.map((listing) => (
          <li key={listing.id} className="flex gap-4 rounded-md border border-line bg-white p-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded border border-line bg-surface">
              <ListingImage src={listing.images[0]?.url} alt="" className="h-full w-full object-contain p-1.5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-medium text-ink truncate">{listing.title}</h2>
                <StatusBadge status={listing.status} />
                {listing.isVerified && <StatusBadge status="APPROVED" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {CATEGORY_LABELS[listing.category]} · {listing.listingType === "AUCTION" ? "Auction" : "Fixed price"} ·{" "}
                {formatLKR(listing.auction?.currentPrice ?? listing.startingPrice)} · listed {formatDateTime(listing.createdAt)}
              </p>
              <p className="text-xs text-ink-soft">{STATUS_HINT[listing.status]}</p>
              {listing.listingType === "AUCTION" && !listing.auction && (
                <p className="text-xs text-live">No auction schedule yet — open Manage to set one.</p>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link href={`/seller/listings/${listing.id}`}><Button variant="outline" size="sm" className="w-full">Manage</Button></Link>
              {listing.status === "ACTIVE" && (
                <Link href={`/listings/${listing.id}`}><Button variant="ghost" size="sm" className="w-full">View</Button></Link>
              )}
            </div>
          </li>
        ))}
      </ul>
      <Pagination meta={data?.meta} onPage={setPage} />
    </PageContainer>
  );
}
