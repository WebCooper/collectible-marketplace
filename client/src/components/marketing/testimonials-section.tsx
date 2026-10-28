import React from "react";
import { TESTIMONIALS } from "@/lib/constants";
import { Star, Quote, ShieldCheck } from "lucide-react";

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 relative bg-[#070b13]/60 border-t border-[rgba(201,162,39,0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#f1d27a]">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>Curator Provenance Records</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-serif">
            Trusted by Connoisseurs of Ceylon Heritage
          </h2>
          <p className="text-sm text-zinc-400">
            Read testimonials from Sri Lanka Numismatic Society fellows, Royal Philatelic researchers, and archival curators.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="relative rounded-3xl border border-[rgba(201,162,39,0.2)] bg-[#0d1424]/70 p-8 backdrop-blur-xl flex flex-col justify-between hover:border-[rgba(201,162,39,0.45)] transition-all duration-300 group"
            >
              <Quote className="h-8 w-8 text-[#c9a227]/25 mb-4 group-hover:text-[#c9a227]/50 transition-colors" />

              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-[#f1d27a] fill-[#f1d27a]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-zinc-300 leading-relaxed italic mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Acquired Specimen Citation */}
              <div className="mb-6 p-2.5 rounded-xl bg-[#c9a227]/10 border border-[#c9a227]/20 text-[11px] text-[#f1d27a] font-mono flex items-center justify-between">
                <span>Acquired Lot:</span>
                <span className="font-semibold text-white truncate max-w-[180px]">{t.verifiedAcquisition}</span>
              </div>

              {/* Author Bio */}
              <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.collectorName}
                  className="h-11 w-11 rounded-full object-cover border border-[#c9a227]/40"
                />
                <div>
                  <h4 className="text-sm font-bold text-white font-serif">{t.collectorName}</h4>
                  <p className="text-[11px] text-cyan-300 font-mono">{t.institution}</p>
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
