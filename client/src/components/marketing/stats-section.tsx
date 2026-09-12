import React from "react";
import { MARKETPLACE_STATS } from "@/lib/constants";
import { TrendingUp, ShieldCheck, Award, Lock } from "lucide-react";

export function StatsSection() {
  const icons = [TrendingUp, Award, ShieldCheck, Lock];

  return (
    <section className="relative py-12 border-y border-white/10 bg-zinc-950/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MARKETPLACE_STATS.map((stat, idx) => {
            const IconComponent = icons[idx % icons.length];
            return (
              <div
                key={stat.label}
                className="relative group rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  {stat.trend && (
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      {stat.trend}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-white font-mono">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-amber-100/90 font-serif">
                    {stat.label}
                  </div>
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
