import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Coins } from "lucide-react";

export function CtaSection() {
  return (
    <section id="cta" className="bg-ink text-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Colombo Consignment Desk
          </p>

          <h2 className="font-serif text-3xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
            Entrust Your Ceylon Rarities to Global Collectors
          </h2>

          <p className="text-base sm:text-lg text-white/70 leading-relaxed">
            Whether you are offering an inherited collection of ancient Kahavanu, a rare King George VI 1,000 Rupees note, or CBSL proof commemorative sets, our Colombo concierge provides complimentary valuation and insured intake.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button variant="gold" size="lg" className="w-full sm:w-auto px-8 gap-2 bg-white text-ink hover:bg-surface">
                <span>Request Free Ceylon Valuation</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-7 border-white text-white bg-transparent hover:bg-white hover:text-ink">
                <Coins className="h-4 w-4 mr-2" />
                VIP Floor Paddle Access
              </Button>
            </Link>
          </div>

          <div className="pt-6 mt-2 border-t border-white/15 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-white/60" /> 0% Seller Fee for Lots &gt; රු 1,000,000
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-white/60" /> Up to 60% cash advance on agreed reserve
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
