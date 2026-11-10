"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCw } from "lucide-react";
import { errorMessage, listingsApi, type Category } from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { CATEGORY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ListingCard, ListingCardSkeleton } from "@/components/listings/listing-card";

const FEATURED_LIMIT = 6;

export function FeaturedListingsSection() {
  const [activeFilter, setActiveFilter] = useState<Category | "all">("all");
  const { data: listings, error, loading, reload } = useApiQuery("featured", () =>
    listingsApi.featured(FEATURED_LIMIT),
  );

  // Only offer filters for categories that actually have featured lots.
  const filterTabs = useMemo(() => {
    const present = Array.from(new Set((listings ?? []).map((l) => l.category)));
    return [
      { id: "all" as const, label: "All Active Lots" },
      ...present.map((category) => ({ id: category, label: CATEGORY_LABELS[category] })),
    ];
  }, [listings]);

  const filteredItems =
    activeFilter === "all"
      ? (listings ?? [])
      : (listings ?? []).filter((item) => item.category === activeFilter);

  return (
    <section id="featured" className="bg-white border-b border-line py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-live">
              <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden="true" /> Live Floor Bidding
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink">
              Premier Ceylon Heritage Lots on the Block
            </h2>
            <p className="text-base text-muted-foreground mt-2 max-w-2xl">
              Featured and expert-verified lots. Auction prices update live as bids land.
            </p>
          </div>
          <Link
            href="/listings"
            className="hidden md:inline-flex shrink-0 text-sm font-semibold text-ink underline-offset-4 hover:underline"
          >
            View all →
          </Link>
        </div>

        {/* Filter Tabs */}
        {filterTabs.length > 2 && (
          <div className="mb-8 flex items-center gap-6 border-b border-line overflow-x-auto max-w-full">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`-mb-px border-b-2 py-3 text-sm whitespace-nowrap transition-colors ${
                  activeFilter === tab.id
                    ? "border-ink text-ink font-semibold"
                    : "border-transparent text-muted-foreground hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* States */}
        {error !== undefined && !listings ? (
          <Alert variant="error" className="max-w-2xl mx-auto">
            <p>{errorMessage(error, "Could not load featured lots.")}</p>
            <button
              onClick={reload}
              className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-4 hover:underline"
            >
              <RotateCw className="h-3 w-3" /> Try again
            </button>
          </Alert>
        ) : loading && !listings ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {Array.from({ length: 3 }, (_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12 border border-dashed border-line rounded-md">
            No featured lots right now - new pieces appear here once an appraiser verifies them.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {filteredItems.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}

        {/* View All CTA */}
        <div className="mt-12 pt-10 border-t border-line text-center">
          <Link href="/listings">
            <Button variant="outline" size="lg" className="px-8 gap-2">
              <span>Browse the Full Ceylon Heritage Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
