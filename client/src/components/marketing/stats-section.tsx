import React from "react";
import { MARKETPLACE_STATS } from "@/lib/constants";
import { TrendingUp, ShieldCheck, Award, Landmark } from "lucide-react";

export function StatsSection() {
  const icons = [TrendingUp, Award, Landmark, ShieldCheck];

  return (
    <section className="bg-white border-b border-line py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-line">
          {MARKETPLACE_STATS.map((stat, idx) => {
            const IconComponent = icons[idx % icons.length];
            return (
              <div
                key={stat.label}
                className="border-r border-b border-line bg-white p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <IconComponent className="h-5 w-5 text-brass" aria-hidden="true" />
                  {stat.trend && (
                    <span className="text-[11px] font-semibold tabular-nums text-ink-soft bg-surface border border-line px-2 py-0.5 rounded-sm">
                      {stat.trend}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="font-serif text-3xl font-semibold tracking-tight tabular-nums text-ink">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-ink">
                    {stat.label}
                  </div>
                  {stat.sinhalaLabel && (
                    <div className="text-[11px] text-muted-foreground">
                      {stat.sinhalaLabel}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {stat.subtext}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
