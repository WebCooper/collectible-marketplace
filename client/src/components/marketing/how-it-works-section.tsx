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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-mono uppercase tracking-widest text-amber-300">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>Vault-Grade Security Protocol</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-serif">
            How RelicVault Guarantees Total Authenticity
          </h2>
          <p className="text-base text-zinc-300">
            Unlike informal peer-to-peer marketplaces, every transaction is backed by physical laboratory grading, institutional escrow, and 100% full-value armored transit.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {HOW_IT_WORKS_STEPS.map((step, idx) => {
            const IconComp = stepIcons[idx % stepIcons.length];
            return (
              <div
                key={step.step}
                className="relative rounded-3xl border border-white/10 bg-zinc-900/60 p-8 backdrop-blur-md hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Step number badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-4xl font-extrabold font-mono text-white/10 group-hover:text-amber-500/30 transition-colors">
                    {step.step}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    {step.badge}
                  </span>
                </div>

                {/* Icon */}
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                  <IconComp className="h-6 w-6" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white font-serif group-hover:text-amber-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Institutional Assurance</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Laboratory Guarantee Banner */}
        <div className="mt-16 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-amber-500/10 p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white font-serif">
              PCGS, NGC, PMG & CGC Authenticity Guarantee
            </h4>
            <p className="text-xs text-zinc-300 max-w-xl">
              All items carry lifetime counterfeit buyback warranties backed by their respective grading authorities and RelicVault&apos;s $10M authenticity indemnity fund.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-amber-300 bg-zinc-950 px-4 py-2 rounded-xl border border-amber-500/30">
              100% BUYBACK BOND
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
