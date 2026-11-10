import React from "react";
import { HOW_IT_WORKS_STEPS } from "@/lib/constants";
import { ShieldCheck, Lock, Truck, FileCheck, CheckCircle2 } from "lucide-react";

export function HowItWorksSection() {
  const stepIcons = [ShieldCheck, Lock, Truck, FileCheck];

  return (
    <section id="how-it-works" className="bg-surface border-b border-line py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="eyebrow mb-3">Sri Lankan Provenance Protocol</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink">
            How LankaNumis Protects Every Heritage Collector
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-2xl leading-relaxed">
            Every transaction is safeguarded by non-destructive physical authentication, regulated commercial escrow accounts in Colombo, and full-value island-wide armored transport.
          </p>
        </div>

        {/* Steps */}
        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {HOW_IT_WORKS_STEPS.map((step, idx) => {
            const IconComp = stepIcons[idx % stepIcons.length];
            return (
              <li
                key={step.step}
                className="flex flex-col border-t border-ink pt-6"
              >
                {/* Step number + badge */}
                <div className="flex items-center justify-between mb-5">
                  <span className="font-serif text-3xl font-medium tabular-nums text-ink">
                    {step.step}
                  </span>
                  <span className="text-[11px] font-medium text-ink-soft bg-white border border-line px-2 py-0.5 rounded-sm">
                    {step.badge}
                  </span>
                </div>

                <IconComp className="h-5 w-5 text-brass mb-4" aria-hidden="true" />

                <div className="space-y-2 flex-1">
                  <h3 className="font-serif text-lg font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-line flex items-center gap-1.5 text-xs text-ink-soft">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brass" />
                  <span>SLNS &amp; Global Standard</span>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Laboratory Guarantee Banner */}
        <div className="mt-14 rounded-md border border-line bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h4 className="font-serif text-lg font-semibold text-ink">
              Central Bank &amp; SLNS Lifetime Authenticity Guarantee
            </h4>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              All numismatic and philatelic lots carry unconditional counterfeit buyback warranties backed by our dedicated රු 50 Million indemnity reserve.
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-ink border border-ink px-4 py-2 rounded-sm">
            100% Buyback Bond
          </span>
        </div>

      </div>
    </section>
  );
}
