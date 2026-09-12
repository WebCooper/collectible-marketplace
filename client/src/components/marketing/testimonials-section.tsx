import React from "react";
import { TESTIMONIALS } from "@/lib/constants";
import { Star, Quote, ShieldCheck } from "lucide-react";

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 relative bg-zinc-950/40 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>Collector Provenance Stories</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-serif">
            Trusted by the World&apos;s Discerning Curators
          </h2>
          <p className="text-sm text-zinc-400">
            Read testimonials from senior numismatic fellows, philatelic society members, and high-net-worth archivists.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="relative rounded-3xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/30 transition-all duration-300 group"
            >
              <Quote className="h-8 w-8 text-amber-500/20 mb-4 group-hover:text-amber-500/40 transition-colors" />

              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-zinc-300 leading-relaxed italic mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Acquired Piece Citation */}
              <div className="mb-6 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[11px] text-amber-300 font-mono flex items-center justify-between">
                <span>Acquired:</span>
                <span className="font-semibold text-white truncate max-w-[170px]">{t.verifiedPiece}</span>
              </div>

              {/* Author Bio */}
              <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.collectorName}
                  className="h-11 w-11 rounded-full object-cover border border-amber-500/30"
                />
                <div>
                  <h4 className="text-sm font-bold text-white font-serif">{t.collectorName}</h4>
                  <p className="text-[11px] text-zinc-400">{t.role}</p>
                  <span className="text-[10px] text-zinc-400 block">{t.location} • Member since {t.memberSince}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
