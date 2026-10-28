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
    <div className="min-h-screen flex flex-col justify-between bg-[#0a0e17] text-zinc-100 relative overflow-hidden">
      {/* Background ambient lighting in Antique Gold & Cyan */}
      <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-[#c9a227]/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="px-6 py-6 max-w-7xl w-full mx-auto flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#c9a227] via-[#e2be49] to-[#977413] p-0.5 shadow-md shadow-[#c9a227]/25">
            <div className="h-full w-full rounded-[10px] bg-[#0c121e] flex items-center justify-center">
              <Coins className="h-5 w-5 text-[#f1d27a] group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-wider text-white font-serif flex items-center gap-1">
              {SITE_NAME}
              <Sparkles className="h-3.5 w-3.5 text-[#f1d27a]" />
            </span>
            <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">
              Ceylon Bourse
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors font-mono"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Marketplace</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-[rgba(201,162,39,0.25)] bg-[#0d1424]/80 backdrop-blur-2xl shadow-2xl shadow-black/90 overflow-hidden">
          
          {/* Left Feature Column (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-gradient-to-br from-[#0e1628]/95 via-[#090f1b] to-[#070b13] border-r border-[rgba(201,162,39,0.18)] relative">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[rgba(201,162,39,0.3)] bg-[#101726] text-xs font-mono uppercase tracking-widest text-[#f1d27a]">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Zero Counterfeit Guarantee</span>
              </div>

              <h3 className="text-2xl font-bold text-white font-serif leading-snug">
                Sri Lanka&apos;s Most Trusted Institutional Bourse
              </h3>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Join over 6,800 certified numismatists, historians, and international collectors participating in verified auctions with commercial escrow protection.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  <span>SLNS, PCGS, NGC, and PMG physical certification</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  <span>Central Bank compliant commercial bank escrow</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  <span>100% insured armored island-wide courier delivery</span>
                </div>
              </div>
            </div>

            {/* Testimonial snippet */}
            <div className="mt-8 p-4 rounded-2xl bg-[#0a0e17]/80 border border-[rgba(201,162,39,0.2)] space-y-2">
              <p className="text-xs text-zinc-300 italic">
                &ldquo;LankaNumis has set the gold standard for Ceylon coin provenance in the digital era.&rdquo;
              </p>
              <span className="text-[11px] text-[#f1d27a] font-mono font-medium block">
                — Sri Lanka Numismatic Society Fellow
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
      <footer className="py-4 text-center text-xs text-zinc-500 z-10 font-mono">
        © {new Date().getFullYear()} {SITE_NAME}. 256-bit Encrypted • Colombo Central Bank Compliant Escrow
      </footer>
    </div>
  );
}
