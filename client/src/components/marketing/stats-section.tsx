import React from "react";
import { MARKETPLACE_STATS } from "@/lib/constants";
import { TrendingUp, ShieldCheck, Award, Landmark } from "lucide-react";

export function StatsSection() {
  const icons = [TrendingUp, Award, Landmark, ShieldCheck];

  return (
    <section className="relative py-12 border-y border-[rgba(201,162,39,0.18)] bg-[#0c121e]/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MARKETPLACE_STATS.map((stat, idx) => {
            const IconComponent = icons[idx % icons.length];
            return (
              <div
                key={stat.label}
                className="relative group rounded-2xl border border-[rgba(201,162,39,0.15)] bg-gradient-to-b from-[#10192a]/50 to-transparent p-6 hover:border-[rgba(201,162,39,0.35)] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-[#c9a227]/10 border border-[#c9a227]/25 flex items-center justify-center text-[#f1d27a] group-hover:scale-110 transition-transform">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  {stat.trend && (
                    <span className="text-[11px] font-semibold font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                      {stat.trend}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-white font-mono">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-[#f1d27a] font-serif">
                    {stat.label}
                  </div>
                  {stat.sinhalaLabel && (
                    <div className="text-[11px] text-zinc-400 font-sans">
                      {stat.sinhalaLabel}
                    </div>
                  )}
                  <p className="text-xs text-zinc-400 leading-relaxed pt-1">
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
