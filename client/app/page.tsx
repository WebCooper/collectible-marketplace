"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListingCard, ListingGridSkeleton } from "@/components/ListingCard";
import { EmptyState } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CATEGORIES } from "@/lib/format";
import type { Category, ListingCard as Card } from "@/lib/types";

export default function HomePage() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState<Card[] | null>(null);
  const [counts, setCounts] = useState<Partial<Record<Category, number>>>({});
  const [endingSoon, setEndingSoon] = useState<Card[] | null>(null);

  useEffect(() => {
    api.listings.featured(8).then(setFeatured).catch(() => setFeatured([]));
    api.listings
      .categories()
      .then((rows) => setCounts(Object.fromEntries(rows.map((r) => [r.category, r.count]))))
      .catch(() => {});
    api.listings
      .search({ listingType: "AUCTION", sort: "ending_soonest", limit: 4 })
      .then((r) => setEndingSoon(r.data.filter((l) => l.status === "ACTIVE")))
      .catch(() => setEndingSoon([]));
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="pointer-events-none absolute -top-40 -right-40 size-[28rem] rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-[22rem] rounded-full bg-amber-100/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              Every listing reviewed by expert appraisers
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Collect Sri Lanka&apos;s history,{" "}
              <span className="text-emerald-700">one piece at a time.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-500">
              Buy and bid on authentic Ceylon coins, currency notes, stamps and medals —
              with certificates checked before anything goes live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/listings" className="btn btn-primary px-6 py-3">
                Explore the collection
              </Link>
              <Link
                href={user ? "/sell/new" : "/register?role=SELLER"}
                className="btn btn-outline px-6 py-3"
              >
                Sell an item
              </Link>
            </div>
          </div>
          <div className="animate-fade-up hidden lg:block" style={{ animationDelay: "120ms" }}>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["🪙", "Verified by experts", "Certificates reviewed before listing"],
                ["⚡", "Live auctions", "Real-time bids with anti-sniping"],
                ["🔒", "Secure checkout", "Payments tracked end to end"],
                ["🛡️", "Buyer protection", "Disputes reviewed by our team"],
              ].map(([icon, title, text], i) => (
                <div
                  key={title}
                  className="card p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ marginTop: i % 2 ? "2rem" : 0 }}
                >
                  <div className="mb-3 text-2xl">{icon}</div>
                  <p className="font-medium text-slate-900">{title}</p>
                  <p className="mt-1 text-sm text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.value}
              href={`/listings?category=${c.value}`}
              style={{ animationDelay: `${i * 50}ms` }}
              className="group animate-fade-up card flex flex-col items-center p-5 text-center transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
            >
              <span className="text-3xl transition duration-300 group-hover:scale-110">{c.icon}</span>
              <span className="mt-3 text-sm font-medium text-slate-800">{c.label}</span>
              <span className="mt-0.5 text-xs text-slate-400">{counts[c.value] ?? 0} listed</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Ending soon */}
      {endingSoon && endingSoon.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Auctions ending soon</h2>
            <Link href="/listings?listingType=AUCTION&sort=ending_soonest" className="text-sm font-medium text-emerald-700 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {endingSoon.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Rare &amp; featured</h2>
            <p className="text-sm text-slate-500">Hand-picked and expert-verified pieces</p>
          </div>
          <Link href="/listings?verifiedOnly=true" className="text-sm font-medium text-emerald-700 hover:underline">
            View all →
          </Link>
        </div>
        {featured === null ? (
          <ListingGridSkeleton count={4} />
        ) : featured.length === 0 ? (
          <EmptyState title="Nothing featured yet" text="Check back soon — new pieces are reviewed every day." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
