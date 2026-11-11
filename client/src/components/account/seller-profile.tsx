"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { ApiError, errorMessage, listingsApi, usersApi } from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatDateTime } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { ListingCard } from "@/components/listings/listing-card";

/** Public profile (GET /users/:id) with the member's active listings. */
export function SellerProfile({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const { data: profile, error } = useApiQuery(`profile:${id}`, () => usersApi.publicProfile(id));
  const listings = useApiQuery(`seller-listings:${id}:${page}`, () => listingsApi.search({ sellerId: id, page, limit: 12 }));

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        {error !== undefined ? (
          <Alert variant="error">
            {error instanceof ApiError && error.status === 404 ? "This member does not exist." : errorMessage(error)}
          </Alert>
        ) : (
          <div className="mx-auto h-8 w-48 rounded bg-surface animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link href="/listings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to catalogue
      </Link>
      <div className="flex items-start gap-5 border-b border-line pb-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatars are arbitrary seller-supplied URLs
            <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-7 w-7 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-semibold text-ink">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">
            Member since {formatDateTime(profile.createdAt)} · {profile.activeListings} active listings · {profile.completedSales} completed sales
          </p>
          {profile.bio && <p className="max-w-2xl pt-1 text-sm text-ink-soft whitespace-pre-line">{profile.bio}</p>}
        </div>
      </div>
      {listings.data && listings.data.data.length === 0 && (
        <p className="text-sm text-muted-foreground">No active listings right now.</p>
      )}
      <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
        {listings.data?.data.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
      <Pagination meta={listings.data?.meta} onPage={setPage} />
    </div>
  );
}
