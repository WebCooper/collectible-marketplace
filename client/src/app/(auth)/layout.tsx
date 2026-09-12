import React from "react";
import Link from "next/link";
import { Coins, Sparkles, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07090e] text-zinc-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="px-6 py-6 max-w-7xl w-full mx-auto flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-700 p-0.5 shadow-md shadow-amber-500/20">
            <div className="h-full w-full rounded-[10px] bg-zinc-950 flex items-center justify-center">
              <Coins className="h-5 w-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-wider text-white font-serif flex items-center gap-1">
              {SITE_NAME}
              <Sparkles className="h-3 w-3 text-amber-400" />
            </span>
            <span className="text-[9px] uppercase tracking-widest text-zinc-400">
              Verified Bourse
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Marketplace</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-white/10 bg-zinc-950/70 backdrop-blur-2xl shadow-2xl shadow-black/80 overflow-hidden">
          
          {/* Left Feature Column (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-[#0b0e17] border-r border-white/10 relative">
            
            {/* Background Coin Texture watermark */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-mono uppercase tracking-widest text-amber-300">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span>Zero Counterfeit Guarantee</span>
              </div>

              <h3 className="text-2xl font-bold text-white font-serif leading-snug">
                The Safest Harbor for High-Value Numismatics &amp; Philately
              </h3>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Join over 14,800 certified collectors and institutions participating in verified auctions with institutional escrow protection.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>PCGS, NGC, PMG, &amp; CGC grading verification</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Dual-custody insured Swiss &amp; US vaults</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>100% full-value armored courier logistics</span>
                </div>
              </div>
            </div>

            {/* Testimonial snippet */}
            <div className="mt-8 p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <p className="text-xs text-zinc-300 italic">
                &ldquo;RelicVault is the gold standard for high-end coin provenance in the digital era.&rdquo;
              </p>
              <span className="text-[11px] text-amber-400 font-mono font-medium block">
                — Royal Numismatic Society Member
              </span>
            </div>

          </div>

          {/* Right Form Container */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex items-center justify-center">
            {children}
          </div>

        </div>
      </main>

      {/* Footer minimal */}
      <footer className="py-4 text-center text-xs text-zinc-500 z-10">
        © {new Date().getFullYear()} {SITE_NAME}. 256-bit SSL Encrypted • Escrow Protected
      </footer>
    </div>
  );
}
