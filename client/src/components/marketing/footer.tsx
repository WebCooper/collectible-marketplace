import React from "react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { Coins, ShieldCheck, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#05070a] text-zinc-400 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Newsletter & Accreditations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-16 border-b border-white/10 items-center">
          <div className="lg:col-span-7 space-y-2">
            <h3 className="text-xl font-bold text-white font-serif">
              Subscribe to Rare Lot Dispatch & Auction Calendars
            </h3>
            <p className="text-xs text-zinc-400 max-w-xl">
              Receive confidential notices for newly authenticated Pre-1933 gold coins, rare philatelic sheets, and private treaty offerings before public launch.
            </p>
          </div>

          <div className="lg:col-span-5">
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  placeholder="Enter your confidential email..."
                  className="w-full bg-zinc-900 text-xs text-zinc-100 placeholder:text-zinc-500 rounded-xl pl-10 pr-3 py-3 border border-white/10 focus:outline-none focus:border-amber-500/60"
                />
              </div>
              <Button variant="gold" size="sm" type="submit" className="h-11 px-5 text-xs font-semibold uppercase tracking-wider">
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-700 p-0.5 shadow-md shadow-amber-500/20">
                <div className="h-full w-full rounded-[10px] bg-zinc-950 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-amber-400" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-wider text-white font-serif">
                {SITE_NAME}
              </span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              The premier institution for verified provenance in high-value numismatics, rare philately, historical currency, and certified antiquities.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>Registered Member: PCGS • NGC • PMG • ANA</span>
            </div>
          </div>

          {/* Departments */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider font-mono">Departments</h4>
            <ul className="space-y-2">
              <li><a href="#featured" className="hover:text-amber-400 transition-colors">Ancient & US Coins</a></li>
              <li><a href="#featured" className="hover:text-amber-400 transition-colors">Rare Philately</a></li>
              <li><a href="#featured" className="hover:text-amber-400 transition-colors">Historical Banknotes</a></li>
              <li><a href="#featured" className="hover:text-amber-400 transition-colors">Graded Golden Age Comics</a></li>
              <li><a href="#featured" className="hover:text-amber-400 transition-colors">Historic Timepieces</a></li>
            </ul>
          </div>

          {/* Trust & Services */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider font-mono">Trust & Custody</h4>
            <ul className="space-y-2">
              <li><a href="#how-it-works" className="hover:text-amber-400 transition-colors">Escrow Protection</a></li>
              <li><a href="#how-it-works" className="hover:text-amber-400 transition-colors">Armored Courier Transit</a></li>
              <li><a href="#how-it-works" className="hover:text-amber-400 transition-colors">Zurich & DE Vaults</a></li>
              <li><a href="#cta" className="hover:text-amber-400 transition-colors">Consignment Desk</a></li>
              <li><a href="#how-it-works" className="hover:text-amber-400 transition-colors">Counterfeit Buyback Bond</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider font-mono">Compliance & Law</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-amber-400 transition-colors">AML / KYC Guidelines</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Provenance Due Diligence</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Terms of Auction</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Privacy & Data Custody</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Bidding Disclaimers</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>© {new Date().getFullYear()} {SITE_NAME} Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Escrow Protected & Regulated</span>
            <span>Secured with 256-bit TLS</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
