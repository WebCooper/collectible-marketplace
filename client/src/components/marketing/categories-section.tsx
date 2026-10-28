import React from "react";
import { CATEGORIES } from "@/lib/constants";
import { Coins, Award, Banknote, Stamp, Shield, ArrowUpRight } from "lucide-react";

const iconMap = {
  Coins: Coins,
  Award: Award,
  Banknote: Banknote,
  Stamp: Stamp,
  Shield: Shield,
};

export function CategoriesSection() {
  return (
    <section id="categories" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#f1d27a] mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f1d27a]" /> 2,300 Years of Chronology
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-serif">
              Curated Sri Lankan Collecting Disciplines
            </h2>
            <p className="text-xs text-zinc-400 font-sans mt-1">
              ශ්‍රී ලාංකේය ඓතිහාසික කාසි, මුදල් නෝට්ටු සහ මුද්දර වර්ගීකරණය
            </p>
          </div>
          <p className="text-sm text-zinc-400 max-w-md">
            Cataloged in accordance with H.W. Codrington&apos;s numismatic taxonomy and Central Bank of Sri Lanka archival references.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => {
            const IconComp = iconMap[cat.icon as keyof typeof iconMap] || Coins;
            return (
              <div
                key={cat.id}
                className="group relative rounded-3xl border border-[rgba(201,162,39,0.2)] bg-gradient-to-b from-[#0d1424]/80 to-[#090d18]/90 p-7 backdrop-blur-md hover:border-[rgba(201,162,39,0.45)] hover:-translate-y-1.5 transition-all duration-300 shadow-xl overflow-hidden cursor-pointer"
              >
                {/* Ambient Top Glow */}
                <div className="absolute top-0 right-0 h-32 w-32 bg-[#c9a227]/5 rounded-full blur-2xl group-hover:bg-[#c9a227]/15 transition-all" />

                <div className="flex items-start justify-between mb-5">
                  <div className="h-14 w-14 rounded-2xl bg-[#c9a227]/10 border border-[#c9a227]/30 flex items-center justify-center text-[#f1d27a] group-hover:bg-gradient-to-br group-hover:from-[#c9a227] group-hover:to-[#f1d27a] group-hover:text-[#0a0e17] transition-all duration-300 shadow-lg">
                    <IconComp className="h-7 w-7" />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold font-mono text-zinc-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full group-hover:border-[#c9a227]/40 group-hover:text-[#f1d27a] transition-colors">
                      {cat.tag}
                    </span>
                    <span className="block text-[10px] text-cyan-400 font-mono mt-1">
                      {cat.eraRange}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-[#f1d27a] transition-colors font-serif flex items-center justify-between">
                    {cat.name}
                    <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#f1d27a]" />
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    {cat.sinhalaName}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[rgba(201,162,39,0.1)] flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-[#f1d27a] font-semibold">
                    {cat.itemCount.toLocaleString()} Verified Specimens
                  </span>
                  <span className="text-zinc-400 group-hover:text-white transition-colors">
                    Explore Era →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
