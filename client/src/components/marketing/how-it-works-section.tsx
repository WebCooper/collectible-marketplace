import React from "react";
import { HOW_IT_WORKS_STEPS } from "@/lib/constants";
import { ShieldCheck, Lock, Truck, FileCheck, CheckCircle2 } from "lucide-react";

export function HowItWorksSection() {
  const stepIcons = [ShieldCheck, Lock, Truck, FileCheck];

  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(201,162,39,0.35)] bg-[#101726]/80 text-xs font-mono uppercase tracking-widest text-[#f1d27a]">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>Sri Lankan Provenance Protocol</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-serif">
            How LankaNumis Protects Every Heritage Collector
          </h2>
          <p className="text-base text-zinc-300 font-light">
            Every transaction is safeguarded by non-destructive physical authentication, regulated commercial escrow accounts in Colombo, and full-value island-wide armored transport.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {HOW_IT_WORKS_STEPS.map((step, idx) => {
            const IconComp = stepIcons[idx % stepIcons.length];
            return (
              <div
                key={step.step}
                className="relative rounded-3xl border border-[rgba(201,162,39,0.2)] bg-[#0d1424]/70 p-8 backdrop-blur-xl hover:border-[rgba(201,162,39,0.45)] transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Step number badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-4xl font-extrabold font-mono text-[#c9a227]/20 group-hover:text-[#c9a227]/40 transition-colors">
                    {step.step}
                  </span>
                  <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full font-mono">
                    {step.badge}
                  </span>
                </div>

                {/* Icon */}
                <div className="h-12 w-12 rounded-2xl bg-[#c9a227]/10 border border-[#c9a227]/25 flex items-center justify-center text-[#f1d27a] mb-6 group-hover:scale-110 transition-transform">
                  <IconComp className="h-6 w-6" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white font-serif group-hover:text-[#f1d27a] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>SLNS &amp; Global Standard</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Laboratory Guarantee Banner */}
        <div className="mt-16 rounded-3xl border border-[rgba(201,162,39,0.35)] bg-gradient-to-r from-[#c9a227]/15 via-[#0e1628] to-[#22d3ee]/15 p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white font-serif">
              Central Bank &amp; SLNS Lifetime Authenticity Guarantee
            </h4>
            <p className="text-xs text-zinc-300 max-w-xl">
              All numismatic and philatelic lots carry unconditional counterfeit buyback warranties backed by our dedicated රු 50 Million indemnity reserve.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-[#f1d27a] bg-[#0a0e17] px-5 py-2.5 rounded-xl border border-[rgba(201,162,39,0.4)] shadow-md">
              100% BUYBACK BOND
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
