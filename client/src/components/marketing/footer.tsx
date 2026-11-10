"use client";

import React from "react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { Coins, ShieldCheck, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const linkClass = "text-ink-soft hover:text-ink hover:underline underline-offset-4 transition-colors";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface text-ink-soft pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-14 border-b border-line items-center">
          <div className="lg:col-span-7 space-y-2">
            <h3 className="text-2xl font-semibold text-ink font-serif tracking-tight">
              Subscribe to Rare Ceylon Lot Dispatch &amp; Auction Catalog
            </h3>
            <p className="text-sm text-muted-foreground max-w-xl">
              Receive confidential alerts for newly authenticated ancient Kahavanu, CBSL proof commemoratives, and private treaty sales in Colombo.
            </p>
          </div>

          <div className="lg:col-span-5">
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Enter your confidential email..."
                  className="w-full h-11 bg-white text-sm text-ink placeholder:text-[#9a968d] rounded-md pl-10 pr-3 border border-input focus:outline-none focus:border-ink"
                />
              </div>
              <Button variant="gold" type="submit" className="h-11 px-5">
                <span>Join</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </form>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 py-14">
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border border-ink flex items-center justify-center bg-white">
                <Coins className="h-5 w-5 text-ink" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-ink font-serif">{SITE_NAME}</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              The certified institution for verified provenance in ancient Lankan coins, CBSL proof sets, British Ceylon currency notes, and historic philately.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-ink-soft">
              <ShieldCheck className="h-4 w-4 text-brass" />
              <span>Affiliations: SLNS • PCGS • NGC • PMG</span>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Departments</h4>
            <ul className="space-y-2.5">
              <li><a href="#featured" className={linkClass}>Ancient Kahavanu &amp; Massa</a></li>
              <li><a href="#featured" className={linkClass}>CBSL Proof Sets</a></li>
              <li><a href="#featured" className={linkClass}>Ceylon Banknotes</a></li>
              <li><a href="#featured" className={linkClass}>Chalon Head Stamps</a></li>
              <li><a href="#featured" className={linkClass}>Sri Lankan Medals</a></li>
            </ul>
          </div>

          <div className="space-y-4 text-sm">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Escrow &amp; Vaults</h4>
            <ul className="space-y-2.5">
              <li><a href="#how-it-works" className={linkClass}>Colombo Bank Escrow</a></li>
              <li><a href="#how-it-works" className={linkClass}>Island Armored Transit</a></li>
              <li><a href="#how-it-works" className={linkClass}>Climate Controlled Vaults</a></li>
              <li><a href="#cta" className={linkClass}>Consignment Desk</a></li>
              <li><a href="#how-it-works" className={linkClass}>100% Buyback Bond</a></li>
            </ul>
          </div>

          <div className="space-y-4 text-sm">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Compliance</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className={linkClass}>Antiquities Ordinance Compliance</a></li>
              <li><a href="#" className={linkClass}>AML / KYC Policy</a></li>
              <li><a href="#" className={linkClass}>Auction Terms &amp; Conditions</a></li>
              <li><a href="#" className={linkClass}>Privacy &amp; Data Security</a></li>
              <li><a href="#" className={linkClass}>Provenance Certificate Disclosures</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} {SITE_NAME} (Private) Limited. Colombo, Sri Lanka.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-brass" /> Commercial Bank Escrow</span>
            <span>256-bit Encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
