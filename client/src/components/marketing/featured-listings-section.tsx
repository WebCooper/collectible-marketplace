"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FEATURED_LISTINGS } from "@/lib/constants";
import { CollectibleItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getTimeRemaining } from "@/lib/utils";
import {
  Clock,
  ShieldCheck,
  Flame,
  ArrowRight,
  Sparkles,
  Gavel,
  CheckCircle2,
  Heart,
  Share2,
} from "lucide-react";

export function FeaturedListingsSection() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [items, setItems] = useState<CollectibleItem[]>(FEATURED_LISTINGS);
  const [bidStatus, setBidStatus] = useState<{ [key: string]: boolean }>({});
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});

  const filterTabs = [
    { id: "all", label: "All Live Lots" },
    { id: "coins", label: "Numismatics" },
    { id: "stamps", label: "Philately" },
    { id: "banknotes", label: "Paper Scrip" },
    { id: "comics", label: "Graded Comics" },
  ];

  const filteredItems =
    activeFilter === "all"
      ? items
      : items.filter((item) => item.category === activeFilter);

  const handlePlaceBid = (itemId: string, increment: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              currentBid: item.currentBid + increment,
              bidCount: item.bidCount + 1,
            }
          : item
      )
    );
    setBidStatus((prev) => ({ ...prev, [itemId]: true }));
    setTimeout(() => {
      setBidStatus((prev) => ({ ...prev, [itemId]: false }));
    }, 2500);
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  return (
    <section id="featured" className="py-24 relative bg-zinc-950/60 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">
              <Flame className="h-4 w-4 text-amber-400 animate-pulse" /> Live Premier Auctions
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-serif">
              Curated Masterpieces on the Block
            </h2>
            <p className="text-sm text-zinc-400 mt-2">
              Bidding conducted under strict escrow with tamper-evident PCGS/NGC/PMG laboratory encapsulation.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-white/10 overflow-x-auto max-w-full">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  activeFilter === tab.id
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-semibold shadow-md"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => {
            const timeRemaining = getTimeRemaining(item.endsAt);
            const isBidSuccess = bidStatus[item.id];
            const isFav = favorites[item.id];

            return (
              <div
                key={item.id}
                className="group flex flex-col rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-md overflow-hidden hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300"
              >
                {/* Visual Image Header */}
                <div className="relative h-64 w-full bg-zinc-950 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
                  />
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {item.gradingService && (
                        <Badge
                          variant={
                            item.gradingService === "PCGS"
                              ? "pcgs"
                              : item.gradingService === "NGC"
                              ? "ngc"
                              : item.gradingService === "PMG"
                              ? "pmg"
                              : "cgc"
                          }
                          className="font-bold shadow-md"
                        >
                          {item.gradingService} {item.grade}
                        </Badge>
                      )}
                      {item.isHot && (
                        <Badge variant="live" className="gap-1">
                          <Flame className="h-3 w-3" /> HOT
                        </Badge>
                      )}
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className={`p-2 rounded-full backdrop-blur-md border transition-colors ${
                        isFav
                          ? "bg-red-500/20 border-red-500/40 text-red-400"
                          : "bg-zinc-950/60 border-white/10 text-zinc-400 hover:text-white"
                      }`}
                      aria-label="Save to watchlist"
                    >
                      <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  {/* Countdown bar overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-zinc-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-300 font-mono">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      {timeRemaining.days > 0 ? `${timeRemaining.days}d ` : ""}
                      {timeRemaining.hours}h {timeRemaining.minutes}m remaining
                    </span>
                    <span className="text-[11px] text-amber-400 font-semibold">
                      {item.bidCount} Bids
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Origin and Year */}
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                      <span>{item.origin}</span>
                      <span className="font-mono text-zinc-300 font-semibold">{item.year}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white font-serif group-hover:text-amber-300 transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                      {item.provenance}
                    </p>
                  </div>

                  {/* Pricing Box & Live Bid */}
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
                          Current High Bid
                        </span>
                        <div className="text-2xl font-bold font-mono text-amber-300">
                          {formatCurrency(item.currentBid)}
                        </div>
                      </div>
                      {item.buyNowPrice && (
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                            Direct Buyout
                          </span>
                          <span className="text-sm font-semibold text-zinc-200 font-mono">
                            {formatCurrency(item.buyNowPrice)}
                          </span>
                        </div>
                      )}
                    </div>

                    {isBidSuccess && (
                      <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs text-center font-medium animate-pulse">
                        ✓ Bid Placed: New High Bidder!
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => handlePlaceBid(item.id, 2500)}
                        className="w-full text-xs font-semibold gap-1.5"
                      >
                        <Gavel className="h-3.5 w-3.5" />
                        <span>Place Quick Bid</span>
                      </Button>
                      <Link href="/login" className="w-full">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Inspect Slab
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Seller Verified Bar */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      {item.seller.name}
                    </span>
                    <span className="text-amber-400 font-mono">★ {item.seller.rating}</span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* View All CTA */}
        <div className="mt-14 text-center">
          <Link href="/signup">
            <Button variant="outline" size="lg" className="rounded-xl px-8 uppercase text-xs tracking-widest gap-2 hover:border-amber-400">
              <span>View Full 380+ Auction Catalog</span>
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
