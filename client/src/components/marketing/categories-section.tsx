import React from "react";
import { CATEGORIES } from "@/lib/constants";
import { Coins, Stamp, Banknote, Landmark, BookOpen, Watch, ArrowUpRight } from "lucide-react";

const iconMap = {
  Coins: Coins,
  Stamp: Stamp,
  Banknote: Banknote,
  Landmark: Landmark,
  BookOpen: BookOpen,
  Watch: Watch,
};

export function CategoriesSection() {
  return (
    <section id="categories" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Curated Departments
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-serif">
              Explore Certified Collecting Disciplines
            </h2>
          </div>
          <p className="text-sm text-zinc-400 max-w-md">
            Every department is overseen by veteran numismatic specialists and certified philatelic examiners.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => {
            const IconComp = iconMap[cat.icon as keyof typeof iconMap] || Coins;
            return (
              <div
                key={cat.id}
                className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-7 backdrop-blur-md hover:border-amber-500/40 hover:-translate-y-1.5 transition-all duration-300 shadow-xl overflow-hidden cursor-pointer"
              >
                {/* Ambient Top Glow */}
                <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all" />

                <div className="flex items-start justify-between mb-5">
                  <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-600 group-hover:text-stone-950 transition-all duration-300 shadow-lg">
                    <IconComp className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full group-hover:border-amber-500/30 group-hover:text-amber-300 transition-colors">
                    {cat.tag}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors font-serif flex items-center justify-between">
                    {cat.name}
                    <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-amber-400" />
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-amber-400/90 font-medium">
                    {cat.itemCount.toLocaleString()} Verified Lots
                  </span>
                  <span className="text-zinc-400 group-hover:text-white transition-colors">
                    View Catalog →
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
