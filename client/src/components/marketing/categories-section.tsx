"use client";

import React from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { listingsApi } from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import type { CategoryIcon } from "@/types";
import { Coins, Award, Crown, Banknote, Stamp, Shield, ArrowUpRight } from "lucide-react";

const iconMap: Record<CategoryIcon, React.ElementType> = {
  Coins,
  Award,
  Crown,
  Banknote,
  Stamp,
  Shield,
};

export function CategoriesSection() {
  // Live ACTIVE-listing counts; categories with none are omitted by the API.
  const { data: counts, error } = useApiQuery("category-counts", listingsApi.categories);
  const countFor = (category: string) =>
    counts?.find((c) => c.category === category)?.count ?? 0;

  return (
    <section id="categories" className="bg-surface border-b border-line py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12 gap-6">
          <div>
            <p className="eyebrow mb-3">2,300 Years of Chronology</p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink">
              Curated Sri Lankan Collecting Disciplines
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              ශ්‍රී ලාංකේය ඓතිහාසික කාසි, මුදල් නෝට්ටු සහ මුද්දර වර්ගීකරණය
            </p>
          </div>
          <p className="text-sm text-muted-foreground max-w-md md:text-right">
            Cataloged in accordance with H.W. Codrington&apos;s numismatic taxonomy and Central Bank of Sri Lanka archival references.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const IconComp = iconMap[cat.icon] ?? Coins;
            const count = countFor(cat.category);
            return (
              <Link
                key={cat.category}
                href={`/listings?category=${cat.category}`}
                className="group flex flex-col rounded-md border border-line bg-white p-6 transition-[border-color,box-shadow] duration-150 hover:border-ink hover:shadow-[0_10px_28px_-14px_rgba(20,20,20,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="h-11 w-11 rounded-md bg-surface border border-line flex items-center justify-center text-brass">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[11px] font-medium text-ink-soft border border-line px-2 py-0.5 rounded-sm">
                      {cat.tag}
                    </span>
                    <span className="block text-[11px] text-muted-foreground tabular-nums mt-1">
                      {cat.eraRange}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 flex-1">
                  <h3 className="font-serif text-xl font-semibold text-ink flex items-center justify-between gap-2">
                    {cat.name}
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-ink" />
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {cat.sinhalaName}
                  </p>
                  <p className="text-sm text-ink-soft leading-relaxed pt-1">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs">
                  <span className="font-semibold tabular-nums text-ink">
                    {counts
                      ? `${count.toLocaleString()} Live ${count === 1 ? "Listing" : "Listings"}`
                      : error !== undefined
                        ? "Listings unavailable"
                        : "Counting…"}
                  </span>
                  <span className="font-medium text-muted-foreground underline-offset-4 group-hover:text-ink group-hover:underline">
                    Explore Era →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
