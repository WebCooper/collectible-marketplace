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
          ? "bg-[#07090e]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/60"
          : "bg-[#07090e]/60 backdrop-blur-md border-b border-white/5"
      }`}
    >
      {/* Top micro-bar: Verified guarantee banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border-b border-amber-500/10 py-1.5 px-4 text-center text-xs text-amber-200/90 hidden sm:flex items-center justify-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-semibold text-white">Live Market Update:</span> Over $4.8M authenticated & settled this month • PCGS & NGC Dual-Inspected
        <span className="text-amber-400/60 hidden md:inline">|</span>
        <span className="text-zinc-400 hidden md:inline flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400 inline" /> 100% Escrow Guaranteed
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-700 p-0.5 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all">
              <div className="h-full w-full rounded-[10px] bg-zinc-950 flex items-center justify-center">
                <Coins className="h-6 w-6 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wider text-white font-serif flex items-center gap-1.5">
                {SITE_NAME}
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-medium">
                Certified Collectibles
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

          {/* Quick Search Shortcut */}
          <div className="hidden md:flex items-center">
            <div className="relative w-60 xl:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search coins, stamps, PMG..."
                className="w-full bg-zinc-900/80 text-xs text-zinc-200 placeholder:text-zinc-500 rounded-full pl-9 pr-14 py-2 border border-white/10 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-1.5 py-0.5 rounded font-mono">
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
                <span>Join Market</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
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

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#0c0f17]/95 backdrop-blur-2xl border-b border-white/10 px-4 pt-3 pb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search rare coins, stamps, notes..."
              className="w-full bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-500 rounded-lg pl-9 pr-3 py-2 border border-white/10 focus:outline-none"
            />
          </div>
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-medium text-zinc-200 hover:text-amber-400 hover:bg-white/5 rounded-md"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                <User className="h-4 w-4 mr-2" /> Sign In
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="gold" className="w-full justify-center">
                Join Market <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
