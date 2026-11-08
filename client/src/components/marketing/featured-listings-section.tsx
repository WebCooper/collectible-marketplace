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
    <section id="featured" className="py-24 relative bg-[#070b13]/80 border-t border-[rgba(201,162,39,0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" /> Live Floor Bidding
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-serif">
              Premier Ceylon Heritage Lots on the Block
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Featured and expert-verified lots. Auction prices update live as bids land.
            </p>
          </div>

          {/* Filter Pills */}
          {filterTabs.length > 2 && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0c121e] border border-[rgba(201,162,39,0.2)] overflow-x-auto max-w-full">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all font-mono ${
                    activeFilter === tab.id
                      ? "bg-gradient-to-r from-[#c9a227] to-[#f1d27a] text-[#0a0e17] font-bold shadow-md"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* States */}
        {error !== undefined && !listings ? (
          <Alert variant="error" className="max-w-2xl mx-auto">
            <p>{errorMessage(error, "Could not load featured lots.")}</p>
            <button
              onClick={reload}
              className="inline-flex items-center gap-1 font-semibold text-[#f1d27a] hover:underline"
            >
              <RotateCw className="h-3 w-3" /> Try again
            </button>
          </Alert>
        ) : loading && !listings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }, (_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 py-12">
            No featured lots right now - new pieces appear here once an appraiser verifies them.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}

        {/* View All CTA */}
        <div className="mt-14 text-center">
          <Link href="/listings">
            <Button variant="outline" size="lg" className="rounded-xl px-8 uppercase text-xs tracking-widest gap-2 hover:border-[#c9a227]">
              <span>Browse the Full Ceylon Heritage Catalog</span>
              <ArrowRight className="h-4 w-4 text-[#f1d27a]" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
