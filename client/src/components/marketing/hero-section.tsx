"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock,
  Clock,
  Coins,
  Award,
} from "lucide-react";

export function HeroSection() {
  const [heroBid, setHeroBid] = useState(385000);
  const [bidPlaced, setBidPlaced] = useState(false);

  const handleQuickBid = (increment: number) => {
    setHeroBid((prev) => prev + increment);
    setBidPlaced(true);
    setTimeout(() => setBidPlaced(false), 3000);
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Background illumination rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-amber-500/15 via-yellow-600/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Copy and CTAs */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Top Curated Trust Tag */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm text-xs font-medium text-amber-300">
              <Sparkles className="h-4 w-4 text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
              <span>Direct Custody & Dual Lab Certification</span>
              <span className="h-1 w-1 rounded-full bg-amber-400" />
              <span className="text-zinc-300">PCGS • NGC • PMG • CGC</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white font-serif leading-[1.15]">
                Where Rare History Finds Its{" "}
                <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent underline decoration-amber-500/30 decoration-wavy decoration-2">
                  True Custodian
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
                The premier digital auction bourse for high-value numismatics, rare philatelic specimens, historical scrip, and antiquities. 100% escrow secured with verified chain of provenance.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a href="#featured">
                <Button variant="gold" size="lg" className="w-full sm:w-auto text-sm uppercase tracking-wider px-8 shadow-xl shadow-amber-500/20 gap-2">
                  <span>Explore Live Bidding</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/signup">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm uppercase tracking-wider px-6 hover:bg-white/10">
                  <Coins className="h-4 w-4 mr-2 text-amber-400" />
                  Consign Rare Item
                </Button>
              </Link>
            </div>

            {/* Trust Assurances */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-left max-w-lg mx-auto lg:mx-0">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <span>Triple Verified</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">Spectral assay & lab certification</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  <span>Escrow Safe</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">Funds held until in-hand approval</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Award className="h-4 w-4 text-blue-400" />
                  <span>Armored Transit</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">100% insured specialized courier</p>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Hero Showcase Piece */}
          <div className="lg:col-span-5 relative">
            
            {/* Glow Aura */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-transparent rounded-3xl blur-2xl -z-10" />

            {/* Showcase Card */}
            <div className="relative rounded-3xl border border-amber-500/30 bg-zinc-950/80 p-6 backdrop-blur-2xl shadow-2xl shadow-black/80">
              
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="live" className="gap-1 px-3 py-1">
                    <Flame className="h-3 w-3 text-red-400" />
                    LIVE LOT #019
                  </Badge>
                  <Badge variant="pcgs">PCGS MS-67+</Badge>
                </div>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>Ends in 28h 14m</span>
                </span>
              </div>

              {/* Item Visual Frame */}
              <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-white/10 flex items-center justify-center group">
                <img
                  src="https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80"
                  alt="1907 Saint-Gaudens Double Eagle Gold Coin"
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
                />
                
                {/* Floating Grade Shield Overlay */}
                <div className="absolute bottom-3 left-3 bg-zinc-950/90 border border-amber-500/40 rounded-xl px-3 py-1.5 backdrop-blur-md flex items-center gap-2 shadow-lg">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] font-mono font-semibold text-amber-300">
                    CERT #88429104
                  </span>
                </div>

                <div className="absolute top-3 right-3 bg-zinc-950/85 border border-white/10 rounded-lg px-2.5 py-1 backdrop-blur-sm text-[11px] text-zinc-300">
                  Ex-Garrett Collection
                </div>
              </div>

              {/* Item Title & Specs */}
              <div className="mt-4 space-y-1">
                <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                  Pre-1933 United States Gold
                </div>
                <h3 className="text-lg font-bold text-white font-serif">
                  1907 Saint-Gaudens $20 High Relief Double Eagle
                </h3>
                <p className="text-xs text-zinc-400">
                  Wire Rim Specimen. Flat Edge. Unbroken luster with glowing satiny cartwheel fields.
                </p>
              </div>

              {/* Real-time Bid Widget */}
              <div className="mt-5 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 block">
                      Current High Bid
                    </span>
                    <span className="text-2xl font-bold font-mono text-amber-300">
                      {formatCurrency(heroBid)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center justify-end gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Reserve Met
                    </span>
                    <span className="text-xs text-zinc-400">43 Verified Bids</span>
                  </div>
                </div>

                {bidPlaced && (
                  <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs text-center font-medium animate-pulse">
                    ✓ Bid successfully submitted to Escrow Ledger!
                  </div>
                )}

                {/* Quick Bid Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickBid(5000)}
                    className="text-xs hover:border-amber-400"
                  >
                    + $5,000 Increment
                  </Button>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => handleQuickBid(10000)}
                    className="text-xs font-semibold"
                  >
                    Bid {formatCurrency(heroBid + 10000)}
                  </Button>
                </div>
              </div>

              {/* Secondary Floating Mini Card: 1840 Penny Black preview */}
              <div className="absolute -bottom-8 -left-6 hidden sm:flex items-center gap-3 p-3 rounded-2xl bg-[#0c0f17]/95 border border-amber-500/20 backdrop-blur-xl shadow-2xl shadow-black/80 max-w-xs">
                <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=150&q=80"
                    alt="1840 Penny Black"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400">Philately Highlight</span>
                  <p className="text-xs font-semibold text-white truncate">1840 Penny Black Plate 1a</p>
                  <p className="text-[11px] text-zinc-400">Bid: $68,500 • 29 Bids</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
