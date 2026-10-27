"use client";

import React from "react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { Coins, ShieldCheck, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-[rgba(201,162,39,0.18)] bg-[#06090f] text-zinc-400 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Newsletter & Accreditations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-16 border-b border-[rgba(201,162,39,0.15)] items-center">
          <div className="lg:col-span-7 space-y-2">
            <h3 className="text-xl font-bold text-white font-serif">
              Subscribe to Rare Ceylon Lot Dispatch &amp; Auction Catalog
            </h3>
            <p className="text-xs text-zinc-400 max-w-xl">
              Receive confidential alerts for newly authenticated ancient Kahavanu, CBSL proof commemoratives, and private treaty sales in Colombo.
            </p>
          </div>

          <div className="lg:col-span-5">
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  placeholder="Enter your confidential email..."
                  className="w-full bg-[#0d1424] text-xs text-zinc-100 placeholder:text-zinc-500 rounded-xl pl-10 pr-3 py-3 border border-[rgba(201,162,39,0.25)] focus:outline-none focus:border-[#c9a227]"
                />
              </div>
              <Button variant="gold" size="sm" type="submit" className="h-11 px-5 text-xs font-semibold uppercase tracking-wider font-mono">
                <span>Join</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </form>
          </div>
        </div>

        {/* Links Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 py-14">
          
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#c9a227] via-[#e2be49] to-[#977413] p-0.5 shadow-md shadow-[#c9a227]/25">
                <div className="h-full w-full rounded-[10px] bg-[#0c121e] flex items-center justify-center">
                  <Coins className="h-5 w-5 text-[#f1d27a]" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-wider text-white font-serif">
                {SITE_NAME}
              </span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              The certified institution for verified provenance in ancient Lankan coins, CBSL proof sets, British Ceylon currency notes, and historic philately.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span className="font-mono text-[11px]">Affiliations: SLNS • PCGS • NGC • PMG</span>
            </div>
          </div>

          {/* Departments */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider font-mono text-[#f1d27a]">Departments</h4>
            <ul className="space-y-2">
              <li><a href="#featured" className="hover:text-[#f1d27a] transition-colors">Ancient Kahavanu &amp; Massa</a></li>
              <li><a href="#featured" className="hover:text-[#f1d27a] transition-colors">CBSL Proof Sets</a></li>
              <li><a href="#featured" className="hover:text-[#f1d27a] transition-colors">Ceylon Banknotes</a></li>
              <li><a href="#featured" className="hover:text-[#f1d27a] transition-colors">Chalon Head Stamps</a></li>
              <li><a href="#featured" className="hover:text-[#f1d27a] transition-colors">Sri Lankan Medals</a></li>
            </ul>
          </div>

          {/* Trust & Custody */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider font-mono text-[#f1d27a]">Escrow &amp; Vaults</h4>
            <ul className="space-y-2">
              <li><a href="#how-it-works" className="hover:text-[#f1d27a] transition-colors">Colombo Bank Escrow</a></li>
              <li><a href="#how-it-works" className="hover:text-[#f1d27a] transition-colors">Island Armored Transit</a></li>
              <li><a href="#how-it-works" className="hover:text-[#f1d27a] transition-colors">Climate Controlled Vaults</a></li>
              <li><a href="#cta" className="hover:text-[#f1d27a] transition-colors">Consignment Desk</a></li>
              <li><a href="#how-it-works" className="hover:text-[#f1d27a] transition-colors">100% Buyback Bond</a></li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider font-mono text-[#f1d27a]">Compliance</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-[#f1d27a] transition-colors">Antiquities Ordinance Compliance</a></li>
              <li><a href="#" className="hover:text-[#f1d27a] transition-colors">AML / KYC Policy</a></li>
              <li><a href="#" className="hover:text-[#f1d27a] transition-colors">Auction Terms &amp; Conditions</a></li>
              <li><a href="#" className="hover:text-[#f1d27a] transition-colors">Privacy &amp; Data Security</a></li>
              <li><a href="#" className="hover:text-[#f1d27a] transition-colors">Provenance Certificate Disclosures</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-[rgba(201,162,39,0.15)] flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4 font-mono">
          <p>© {new Date().getFullYear()} {SITE_NAME} (Private) Limited. Colombo, Sri Lanka.</p>
          <div className="flex items-center gap-6 text-zinc-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Commercial Bank Escrow</span>
            <span>256-bit Encrypted</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
