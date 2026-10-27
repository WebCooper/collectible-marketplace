"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FEATURED_LISTINGS } from "@/lib/constants";
import { Listing } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLKR, getTimeRemaining } from "@/lib/utils";
import {
  Clock,
  ShieldCheck,
  Flame,
  ArrowRight,
  Gavel,
  CheckCircle2,
  Heart,
  Landmark,
} from "lucide-react";

export function FeaturedListingsSection() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [items, setItems] = useState<Listing[]>(FEATURED_LISTINGS);
  const [bidStatus, setBidStatus] = useState<{ [key: string]: boolean }>({});
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});

  const filterTabs = [
    { id: "all", label: "All Active Lots" },
    { id: "ancient-coins", label: "Ancient Kahavanu" },
    { id: "proof-commemoratives", label: "CBSL Proofs" },
    { id: "currency-notes", label: "Ceylon Banknotes" },
    { id: "stamps", label: "Chalon Philately" },
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
              Every lot is encapsulated under certified PCGS, NGC, PMG, or Sri Lanka Numismatic Society (SLNS) laboratory grading.
            </p>
          </div>

          {/* Filter Pills */}
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
                className="group flex flex-col rounded-3xl border border-[rgba(201,162,39,0.22)] bg-[#0d1424]/70 backdrop-blur-xl overflow-hidden hover:border-[rgba(201,162,39,0.5)] hover:shadow-2xl hover:shadow-[#c9a227]/10 transition-all duration-300"
              >
                {/* Visual Image Header */}
                <div className="relative h-64 w-full bg-[#080d17] overflow-hidden">
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
                              : item.gradingService === "SLNS"
                              ? "slns"
                              : "cyan"
                          }
                          className="font-bold shadow-md"
                        >
                          {item.gradingService} {item.grade}
                        </Badge>
                      )}
                      {item.isHot && (
                        <Badge variant="cyan" className="gap-1">
                          <Flame className="h-3 w-3 text-cyan-400" /> HOT
                        </Badge>
                      )}
                    </div>

                    {/* Favorite Watchlist Button */}
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className={`p-2 rounded-full backdrop-blur-md border transition-colors ${
                        isFav
                          ? "bg-red-500/20 border-red-500/40 text-red-400"
                          : "bg-[#0a0e17]/80 border-white/10 text-zinc-400 hover:text-white"
                      }`}
                      aria-label="Save to watchlist"
                    >
                      <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  {/* Countdown bar overlay in Cyan */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#0a0e17]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[rgba(34,211,238,0.25)] text-xs">
                    <span className="flex items-center gap-1.5 text-cyan-300 font-mono">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      {timeRemaining.days > 0 ? `${timeRemaining.days}d ` : ""}
                      {timeRemaining.hours}h {timeRemaining.minutes}m remaining
                    </span>
                    <span className="text-[11px] text-[#f1d27a] font-mono font-semibold">
                      {item.bidCount} Bids
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Authority and Year */}
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                      <span className="truncate max-w-[200px] text-[#8fa0be]">{item.monarchOrAuthority}</span>
                      <span className="font-mono text-[#f1d27a] font-semibold">{item.year}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white font-serif group-hover:text-[#f1d27a] transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    {item.sinhalaTitle && (
                      <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                        {item.sinhalaTitle}
                      </p>
                    )}

                    <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                      {item.provenance}
                    </p>
                  </div>

                  {/* Pricing Box & Live Bid in LKR */}
                  <div className="pt-4 border-t border-[rgba(201,162,39,0.12)] space-y-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-mono">
                          Current High Bid
                        </span>
                        <div className="text-2xl font-bold font-mono text-[#f1d27a]">
                          {formatLKR(item.currentBid)}
                        </div>
                      </div>
                      {item.buyNowPrice && (
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-mono">
                            Direct Buyout
                          </span>
                          <span className="text-sm font-semibold text-cyan-300 font-mono">
                            {formatLKR(item.buyNowPrice)}
                          </span>
                        </div>
                      )}
                    </div>

                    {isBidSuccess && (
                      <div className="p-2 rounded-xl bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 text-xs text-center font-medium animate-pulse">
                        ✓ Registered: New Highest Bidder for Lot!
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => handlePlaceBid(item.id, 5000)}
                        className="w-full text-xs font-semibold gap-1.5"
                      >
                        <Gavel className="h-3.5 w-3.5" />
                        <span>Bid + රු 5k</span>
                      </Button>
                      <Link href="/login" className="w-full">
                        <Button variant="outline" size="sm" className="w-full text-xs font-mono">
                          Inspect Slab
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Verified Seller Bar */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-white/5">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                      {item.seller.name}
                    </span>
                    <span className="text-[#f1d27a] font-mono">★ {item.seller.rating}</span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* View All CTA */}
        <div className="mt-14 text-center">
          <Link href="/signup">
            <Button variant="outline" size="lg" className="rounded-xl px-8 uppercase text-xs tracking-widest gap-2 hover:border-[#c9a227]">
              <span>View Full 480+ Ceylon Heritage Catalog</span>
              <ArrowRight className="h-4 w-4 text-[#f1d27a]" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
