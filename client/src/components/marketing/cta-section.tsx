import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ShieldCheck, Coins } from "lucide-react";

export function CtaSection() {
  return (
    <section id="cta" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Glow Container */}
        <div className="relative rounded-3xl border border-[rgba(201,162,39,0.35)] bg-gradient-to-br from-[#0d1424] via-[#090f1b] to-[#060a12] p-10 sm:p-16 overflow-hidden shadow-2xl shadow-black/90">
          
          {/* Radial decorative light in Gold & Cyan */}
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-[#c9a227]/20 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-[#c9a227]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(201,162,39,0.3)] bg-[#101726]/80 text-xs font-mono uppercase tracking-widest text-[#f1d27a]">
              <Sparkles className="h-4 w-4 text-[#f1d27a]" />
              <span>Colombo Consignment Desk</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif leading-tight">
              Entrust Your Ceylon Rarities to Global Collectors
            </h2>

            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-light">
              Whether you are offering an inherited collection of ancient Kahavanu, a rare King George VI 1,000 Rupees note, or CBSL proof commemorative sets, our Colombo concierge provides complimentary valuation and insured intake.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-3">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button variant="gold" size="lg" className="w-full sm:w-auto text-xs uppercase tracking-widest px-8 gap-2 shadow-xl shadow-[#c9a227]/25 font-mono">
                  <span>Request Free Ceylon Valuation</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-xs uppercase tracking-widest px-7 font-mono">
                  <Coins className="h-4 w-4 mr-2 text-[#f1d27a]" />
                  VIP Floor Paddle Access
                </Button>
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap items-center gap-6 text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <ShieldCheck className="h-4 w-4 text-cyan-400" /> 0% Seller Fee for Lots &gt; රු 1,000,000
              </span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <ShieldCheck className="h-4 w-4 text-[#f1d27a]" /> Up to 60% cash advance on agreed reserve
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
