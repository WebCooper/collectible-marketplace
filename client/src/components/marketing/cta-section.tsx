import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ShieldCheck, Coins } from "lucide-react";

export function CtaSection() {
  return (
    <section id="cta" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Glow Container */}
        <div className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-br from-zinc-900 via-[#0e121d] to-zinc-950 p-10 sm:p-16 overflow-hidden shadow-2xl shadow-amber-500/10">
          
          {/* Radial decorative light */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-amber-500/20 via-yellow-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-mono uppercase tracking-widest text-amber-300">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Consignment & Private Sales Desk</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif leading-tight">
              Entrust Your Heritage Pieces to the World&apos;s Highest Realizations
            </h2>

            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-light">
              Whether you are divesting a single historic gold specimen, a complete 19th-century philatelic archive, or an inherited collection, our numismatic concierge provides zero-obligation complimentary appraisal and insured intake.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button variant="gold" size="lg" className="w-full sm:w-auto text-sm uppercase tracking-wider px-8 gap-2 shadow-xl shadow-amber-500/20">
                  <span>Submit for Complimentary Appraisal</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm uppercase tracking-wider px-6">
                  <Coins className="h-4 w-4 mr-2 text-amber-400" />
                  VIP Paddle Registration
                </Button>
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap items-center gap-6 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Guaranteed 0% Seller Fee for Lots &gt; $250k
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-400" /> Advances available up to 60% of reserve
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
