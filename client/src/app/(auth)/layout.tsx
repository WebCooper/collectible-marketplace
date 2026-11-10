import React from "react";
import Link from "next/link";
import { Coins, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-surface text-ink">
      {/* Top bar */}
      <header className="bg-white border-b border-line">
        <div className="px-4 sm:px-6 lg:px-8 h-[72px] max-w-7xl w-full mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-full border border-ink flex items-center justify-center">
              <Coins className="h-5 w-5 text-ink group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-semibold tracking-tight text-ink font-serif">{SITE_NAME}</span>
              <span className="mt-1 text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
                Ceylon Bourse
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft hover:text-ink px-3 py-2 rounded-md hover:bg-surface transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Marketplace</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-lg border border-line bg-white shadow-[0_20px_50px_-30px_rgba(20,20,20,0.3)] overflow-hidden">
          {/* Feature column (desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-surface border-r border-line">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">
                <ShieldCheck className="h-4 w-4" />
                <span>Zero Counterfeit Guarantee</span>
              </div>

              <h3 className="text-[28px] font-semibold text-ink font-serif leading-tight tracking-tight">
                Sri Lanka&apos;s Most Trusted Institutional Bourse
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Join over 6,800 certified numismatists, historians, and international collectors participating in verified auctions with commercial escrow protection.
              </p>

              <ul className="space-y-3 pt-2">
                <li className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-ink flex-shrink-0" />
                  <span>SLNS, PCGS, NGC, and PMG physical certification</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-ink flex-shrink-0" />
                  <span>Central Bank compliant commercial bank escrow</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-ink flex-shrink-0" />
                  <span>100% insured armored island-wide courier delivery</span>
                </li>
              </ul>
            </div>

            {/* Testimonial snippet */}
            <figure className="mt-10 pt-6 border-t border-line space-y-2">
              <blockquote className="text-[15px] text-ink font-serif italic leading-snug">
                &ldquo;LankaNumis has set the gold standard for Ceylon coin provenance in the digital era.&rdquo;
              </blockquote>
              <figcaption className="text-xs text-muted-foreground">
                — Sri Lanka Numismatic Society Fellow
              </figcaption>
            </figure>
          </div>

          {/* Form column */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex items-center justify-center">
            {children}
          </div>
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME}. 256-bit Encrypted • Colombo Central Bank Compliant Escrow
      </footer>
    </div>
  );
}
