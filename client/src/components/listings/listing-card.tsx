"use client";

import Link from "next/link";
import { Clock, ShieldCheck, ArrowRight, Gavel, Tag, Flame } from "lucide-react";
import type { ListingCard as ListingCardData } from "@/lib/api";
import { useLiveAuction } from "@/hooks/use-live-auction";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/constants";
import { formatLKR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingImage } from "./listing-image";
import { AuctionCountdown } from "./auction-countdown";

/**
 * Card for one listing from GET /listings or /listings/featured. Auction
 * cards subscribe to live bid events, so the price and bid count move without
 * a reload.
 */
export function ListingCard({ listing }: { listing: ListingCardData }) {
  const auction = useLiveAuction(listing.auction);
  const href = `/listings/${listing.id}`;
  const isAuction = listing.listingType === "AUCTION" && auction !== null;
  const isLive = isAuction && auction.status === "ACTIVE";
  const isSold = listing.status === "SOLD" || auction?.status === "ENDED";
  const price = isAuction ? auction.currentPrice : listing.startingPrice;

  return (
    <div className="group flex flex-col rounded-3xl border border-[rgba(201,162,39,0.22)] bg-[#0d1424]/70 backdrop-blur-xl overflow-hidden hover:border-[rgba(201,162,39,0.5)] hover:shadow-2xl hover:shadow-[#c9a227]/10 transition-all duration-300">
      {/* Image */}
      <Link href={href} className="relative block h-60 w-full bg-[#080d17] overflow-hidden">
        <ListingImage
          src={listing.images[0]?.url}
          alt={listing.title}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
        />

        <div className="absolute top-3 inset-x-3 flex items-center gap-1.5 flex-wrap">
          {listing.isVerified && (
            <Badge variant="gold" className="gap-1 font-bold shadow-md">
              <ShieldCheck className="h-3 w-3" /> Expert Verified
            </Badge>
          )}
          {listing.isFeatured && (
            <Badge variant="cyan" className="gap-1">
              <Flame className="h-3 w-3 text-cyan-400" /> Featured
            </Badge>
          )}
          {isSold && <Badge variant="secondary">Sold</Badge>}
        </div>

        {isAuction && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#0a0e17]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[rgba(34,211,238,0.25)] text-xs">
            <span className="flex items-center gap-1.5 text-cyan-300 font-mono">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              {auction.status === "SCHEDULED" ? (
                "Opens soon"
              ) : auction.status === "ACTIVE" ? (
                <>
                  <AuctionCountdown endTime={auction.endTime} /> left
                </>
              ) : (
                "Auction closed"
              )}
            </span>
            <span className="text-[11px] text-[#f1d27a] font-mono font-semibold">
              {auction.bidCount} {auction.bidCount === 1 ? "Bid" : "Bids"}
            </span>
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
            <span className="truncate text-[#8fa0be]">{CATEGORY_LABELS[listing.category]}</span>
            <span className="font-mono text-[#f1d27a] font-semibold whitespace-nowrap">
              {CONDITION_LABELS[listing.condition]}
            </span>
          </div>
          <Link href={href}>
            <h3 className="text-lg font-bold text-white font-serif group-hover:text-[#f1d27a] transition-colors line-clamp-2">
              {listing.title}
            </h3>
          </Link>
        </div>

        <div className="pt-4 border-t border-[rgba(201,162,39,0.12)] space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-mono">
                {isAuction
                  ? auction.bidCount > 0
                    ? "Current High Bid"
                    : "Opening Bid"
                  : "Fixed Price"}
              </span>
              <div className="text-2xl font-bold font-mono text-[#f1d27a]">{formatLKR(price)}</div>
            </div>
            {isAuction && listing.auction?.buyNowPrice && (
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-mono">
                  Buy Now
                </span>
                <span className="text-sm font-semibold text-cyan-300 font-mono">
                  {formatLKR(listing.auction.buyNowPrice)}
                </span>
              </div>
            )}
          </div>

          <Link href={isLive ? `${href}#bid` : href} className="block">
            <Button
              variant={isLive || (!isAuction && !isSold) ? "gold" : "outline"}
              size="sm"
              className="w-full text-xs font-semibold gap-1.5"
            >
              {isLive ? (
                <>
                  <Gavel className="h-3.5 w-3.5" /> Place a Bid
                </>
              ) : !isAuction && !isSold ? (
                <>
                  <Tag className="h-3.5 w-3.5" /> View &amp; Buy
                </>
              ) : (
                <>
                  Inspect Lot <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </Link>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-white/5">
          <span className="flex items-center gap-1.5 text-zinc-300 truncate">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            {listing.seller.name}
          </span>
          <span className="font-mono">{listing.viewCount} views</span>
        </div>
      </div>
    </div>
  );
}

/** Placeholder card shown while listings load. */
export function ListingCardSkeleton() {
  return (
    <div className="rounded-3xl border border-[rgba(201,162,39,0.12)] bg-[#0d1424]/50 overflow-hidden animate-pulse">
      <div className="h-60 bg-[#111a2b]" />
      <div className="p-6 space-y-3">
        <div className="h-3 w-1/3 rounded bg-[#1a2438]" />
        <div className="h-5 w-4/5 rounded bg-[#1a2438]" />
        <div className="h-8 w-1/2 rounded bg-[#1a2438] mt-6" />
        <div className="h-8 w-full rounded bg-[#1a2438]" />
      </div>
    </div>
  );
}
