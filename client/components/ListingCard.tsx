"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { categoryLabel, countdown, humanize, money } from "@/lib/format";
import type { ListingCard as Card } from "@/lib/types";
import { StatusBadge, VerifiedBadge } from "./ui";

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function ItemImage({
  url,
  alt,
  className = "",
}: {
  url?: string;
  alt: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-4xl ${className}`}
      >
        🪙
      </div>
    );
  }
  return (
    // Seller images live on arbitrary storage hosts, so a plain <img> is used.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} onError={() => setBroken(true)} className={`object-cover ${className}`} />
  );
}

export function ListingCard({
  listing,
  index = 0,
  href,
  showStatus,
}: {
  listing: Card;
  index?: number;
  href?: string;
  showStatus?: boolean;
}) {
  const now = useNow(30_000);
  const auction = listing.auction;
  const price = auction?.currentPrice ?? listing.startingPrice;
  const remaining = auction ? new Date(auction.endTime).getTime() - now : 0;

  return (
    <Link
      href={href ?? `/listings/${listing.id}`}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      className="group animate-fade-up card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ItemImage
          url={listing.images[0]?.url}
          alt={listing.title}
          className="size-full transition duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {listing.isVerified && <VerifiedBadge small />}
          {listing.isFeatured && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-medium text-amber-950 shadow-sm">
              ★ Rare
            </span>
          )}
        </div>
        {listing.listingType === "AUCTION" && (
          <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur">
            Auction
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium tracking-wide text-emerald-700 uppercase">
          {categoryLabel(listing.category)}
        </p>
        <h3 className="mt-1 line-clamp-2 font-medium text-slate-900 transition group-hover:text-emerald-800">
          {listing.title}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{humanize(listing.condition)} condition</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-[11px] text-slate-400">
              {auction ? (auction.bidCount ? "Current bid" : "Opening bid") : "Price"}
            </p>
            <p className="text-lg font-semibold text-slate-900">{money(price)}</p>
          </div>
          {showStatus ? (
            <StatusBadge status={listing.status} />
          ) : listing.status === "SOLD" ? (
            <StatusBadge status="SOLD" />
          ) : auction ? (
            <div className="text-right text-xs text-slate-500">
              <p>{auction.bidCount} bids</p>
              <p className={remaining < 3600_000 && remaining > 0 ? "font-medium text-rose-600" : ""}>
                {auction.status === "SCHEDULED" ? "Starts soon" : countdown(remaining)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton aspect-[4/3] rounded-none" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
