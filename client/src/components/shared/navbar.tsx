"use client";

import * as React from "react";
import Link from "next/link";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Search, Menu, X, Coins, Sparkles, User, ArrowRight } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0e17]/95 backdrop-blur-xl border-b border-[rgba(201,162,39,0.25)] shadow-2xl shadow-black/80"
          : "bg-[#0a0e17]/70 backdrop-blur-md border-b border-[rgba(201,162,39,0.12)]"
      }`}
    >
      {/* Top micro-bar: Sri Lankan Numismatic Guarantee */}
      <div className="bg-gradient-to-r from-[#c9a227]/15 via-[#22d3ee]/10 to-[#c9a227]/15 border-b border-[rgba(201,162,39,0.15)] py-1.5 px-4 text-center text-xs text-zinc-300 hidden sm:flex items-center justify-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
        <span className="font-semibold text-white">Colombo Floor Bourse:</span>
        <span>Over රු 42.5M authenticated this cycle • SLNS &amp; PCGS Dual-Certified</span>
        <span className="text-[#c9a227]/60 hidden md:inline">|</span>
        <span className="text-zinc-400 hidden md:inline flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-[#f1d27a] inline" /> 100% Central Bank Compliant Escrow
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo with Antique Gold Frame */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-[#c9a227] via-[#e2be49] to-[#977413] p-0.5 shadow-lg shadow-[#c9a227]/25 group-hover:shadow-[#c9a227]/45 transition-all">
              <div className="h-full w-full rounded-[10px] bg-[#0c121e] flex items-center justify-center">
                <Coins className="h-6 w-6 text-[#f1d27a] group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold tracking-wider text-white font-serif flex items-center gap-1.5">
                {SITE_NAME}
                <Sparkles className="h-3.5 w-3.5 text-[#f1d27a]" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#8fa0be] font-medium font-mono">
                Sri Lanka Rare Collectibles
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Quick Search for Sri Lankan Coins & Notes */}
          <div className="hidden md:flex items-center">
            <div className="relative w-64 xl:w-76">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search Kahavanu, 1957 Crown, VOC..."
                className="w-full bg-[#0d1524] text-xs text-zinc-100 placeholder:text-zinc-500 rounded-full pl-9 pr-14 py-2.5 border border-[rgba(201,162,39,0.25)] focus:outline-none focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227]/40 transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#141f33] text-zinc-400 border border-zinc-700/60 px-1.5 py-0.5 rounded font-mono">
                ⌘K
              </span>
            </div>
          </div>

          {/* Auth Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs uppercase tracking-wider text-zinc-300">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="gold" size="sm" className="text-xs uppercase tracking-wider gap-1.5 shadow-md">
                <span>Join Bourse</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#0a0e17]/98 backdrop-blur-2xl border-b border-[rgba(201,162,39,0.2)] px-5 pt-4 pb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Kahavanu, Ceylon notes, stamps..."
              className="w-full bg-[#0d1524] text-sm text-zinc-200 placeholder:text-zinc-500 rounded-xl pl-10 pr-3 py-2.5 border border-[rgba(201,162,39,0.25)] focus:outline-none"
            />
          </div>
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-medium text-zinc-200 hover:text-[#f1d27a] hover:bg-white/5 rounded-lg"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                <User className="h-4 w-4 mr-2" /> Collector Sign In
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="gold" className="w-full justify-center">
                Register for Bourse <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
