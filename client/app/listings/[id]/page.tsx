"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuctionPanel } from "@/components/AuctionPanel";
import { ItemImage } from "@/components/ListingCard";
import { ReportButton } from "@/components/ReportButton";
import {
  Avatar,
  BackLink,
  EmptyState,
  PageLoader,
  StatusBadge,
  VerifiedBadge,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { categoryLabel, date, humanize, money } from "@/lib/format";
import type { ListingDetail } from "@/lib/types";

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [active, setActive] = useState(0);

  const load = useCallback(() => {
    api.listings
      .get(id)
      .then(setListing)
      .catch((e) => e instanceof ApiError && e.status === 404 && setNotFound(true));
  }, [id]);

  // Re-fetch once the session is known: owners can see listings under review.
  useEffect(load, [load, user?.id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="Listing not found"
          text="It may have been sold, withdrawn or is still under review."
          action={<Link href="/listings" className="btn btn-primary">Browse collectibles</Link>}
        />
      </div>
    );
  }
  if (!listing) return <PageLoader />;

  const isOwner = user?.id === listing.sellerId;
  const images = listing.images.length ? listing.images : [{ url: "" }];
  const details: [string, string | null][] = [
    ["Category", categoryLabel(listing.category)],
    ["Condition", humanize(listing.condition)],
    ["Era / year", listing.era],
    ["Denomination", listing.denomination],
    ["Listed", date(listing.createdAt)],
    ["Views", String(listing.viewCount)],
  ];
  const latestValuation = listing.verifications.find((v) => v.appraisedValue);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <BackLink href="/listings">Back to browse</BackLink>

      {isOwner && (
        <div className="animate-fade-in mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="flex items-center gap-2">
            This is your listing · <StatusBadge status={listing.status} />
          </span>
          <Link href={`/sell/${listing.id}`} className="font-medium underline-offset-2 hover:underline">
            Manage listing →
          </Link>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        {/* Gallery */}
        <div className="animate-fade-up">
          <div className="card relative aspect-square overflow-hidden">
            <ItemImage key={active} url={images[active]?.url} alt={listing.title} className="animate-fade-in size-full" />
            <div className="absolute top-4 left-4 flex gap-2">
              {listing.isVerified && <VerifiedBadge />}
              {listing.isFeatured && (
                <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-medium text-amber-950 shadow-sm">★ Rare</span>
              )}
            </div>
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.url + i}
                  onClick={() => setActive(i)}
                  className={`size-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${i === active ? "border-emerald-600" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <ItemImage url={img.url} alt="" className="size-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="animate-fade-up space-y-6" style={{ animationDelay: "80ms" }}>
          <div>
            <p className="text-sm font-medium tracking-wide text-emerald-700 uppercase">{categoryLabel(listing.category)}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{listing.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              {listing.status !== "ACTIVE" && <StatusBadge status={listing.status} />}
              <ReportButton target="LISTING" id={listing.id} label="Report listing" />
            </div>
          </div>

          {listing.auction ? (
            <AuctionPanel
              initial={listing.auction}
              sellerId={listing.sellerId}
              hasOrder={(listing._count?.orders ?? 0) > 0}
              onClosed={load}
            />
          ) : (
            <div className="card p-6">
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Price</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900">{money(listing.startingPrice)}</p>
              <div className="mt-5">
                {listing.status === "ACTIVE" && listing.listingType === "FIXED_PRICE" && !isOwner ? (
                  <button
                    className="btn btn-primary w-full py-3"
                    onClick={() =>
                      router.push(user ? `/checkout?listingId=${listing.id}` : `/login?next=/listings/${listing.id}`)
                    }
                  >
                    Buy now
                  </button>
                ) : listing.status === "SOLD" ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">This item has been sold.</p>
                ) : listing.listingType === "AUCTION" ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">The auction for this item has not been scheduled yet.</p>
                ) : isOwner ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Buyers will see a Buy now button here.</p>
                ) : null}
              </div>
            </div>
          )}

          <Link
            href={`/users/${listing.seller.id}`}
            className="card flex items-center gap-4 p-4 transition hover:border-emerald-200 hover:shadow-md"
          >
            <Avatar name={listing.seller.name} url={listing.seller.avatarUrl} size="size-12" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">Sold by</p>
              <p className="truncate font-medium text-slate-900">{listing.seller.name}</p>
              {listing.seller.createdAt && (
                <p className="text-xs text-slate-500">Member since {date(listing.seller.createdAt)}</p>
              )}
            </div>
            <span className="text-sm text-emerald-700">View profile →</span>
          </Link>
        </div>
      </div>

      {/* Details */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-8">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Description</h2>
            <p className="leading-relaxed whitespace-pre-line text-slate-600">{listing.description}</p>
          </div>
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Item details</h2>
            <dl className="card grid grid-cols-2 gap-px overflow-hidden bg-slate-100 sm:grid-cols-3">
              {details
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="bg-white p-4">
                    <dt className="text-xs text-slate-400">{k}</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </section>

        <section className="space-y-8">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Authenticity</h2>
            <div className="card divide-y divide-slate-100">
              {listing.isVerified ? (
                <div className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
                  <div>
                    <p className="font-medium text-slate-900">Verified by an expert appraiser</p>
                    {latestValuation && (
                      <p className="text-sm text-slate-500">Appraised value {money(latestValuation.appraisedValue)}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="p-4 text-sm text-slate-500">This item has not been verified by an appraiser.</p>
              )}
              {listing.certificates.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">📄 {c.fileName}</p>
                    {c.issuer && <p className="text-xs text-slate-500">Issued by {c.issuer}</p>}
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </div>

          {listing.verifications.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Review history</h2>
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {listing.verifications.map((v, i) => (
                  <li key={v.id ?? i} className="relative">
                    <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={v.decision} />
                      <span className="text-xs text-slate-400">{date(v.verifiedAt)} · {v.appraiser.name}</span>
                    </div>
                    {v.comments && <p className="mt-1 text-sm text-slate-600">{v.comments}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
