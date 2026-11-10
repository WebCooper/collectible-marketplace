import React from "react";
import { TESTIMONIALS } from "@/lib/constants";
import { Star, Quote } from "lucide-react";

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-white border-b border-line py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <p className="eyebrow mb-3">Curator Provenance Records</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink">
            Trusted by Connoisseurs of Ceylon Heritage
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-2xl">
            Read testimonials from Sri Lanka Numismatic Society fellows, Royal Philatelic researchers, and archival curators.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.id}
              className="flex flex-col rounded-md border border-line bg-white p-6 sm:p-7"
            >
              <div className="flex items-center justify-between mb-5">
                {/* Stars */}
                <div className="flex items-center gap-0.5" aria-label={`${t.rating} out of 5`}>
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-brass fill-current" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-line-strong" aria-hidden="true" />
              </div>

              {/* Quote */}
              <blockquote className="font-serif text-base text-ink leading-relaxed mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Acquired Specimen Citation */}
              <div className="mb-6 py-2.5 border-y border-line text-xs flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Acquired Lot:</span>
                <span className="font-semibold text-ink truncate max-w-[180px]">{t.verifiedAcquisition}</span>
              </div>

              {/* Author Bio */}
              <figcaption className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.collectorName}
                  className="h-10 w-10 rounded-full object-cover border border-line"
                />
                <div>
                  <h4 className="text-sm font-semibold text-ink">{t.collectorName}</h4>
                  <p className="text-xs text-ink-soft">{t.institution}</p>
                  <span className="text-[11px] text-muted-foreground block">{t.location} • Member since {t.memberSince}</span>
                </div>
              </figcaption>

            </figure>
          ))}
        </div>

      </div>
    </section>
  );
}
