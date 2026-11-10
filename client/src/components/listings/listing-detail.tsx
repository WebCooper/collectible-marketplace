"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileCheck2, Eye, RotateCw, User } from "lucide-react";
import { ApiError, errorMessage, listingsApi } from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/constants";
import { formatDateTime, formatLKR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ListingImage } from "./listing-image";
import { AuctionPanel } from "./auction-panel";
import { FixedPricePanel } from "./fixed-price-panel";

const DECISION_LABELS = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  MORE_EVIDENCE_REQUESTED: "More evidence requested",
} as const;

/** Full listing (GET /listings/:id) with its auction or purchase panel. */
export function ListingDetailView({ id }: { id: string }) {
  const { data: listing, error, loading, reload } = useApiQuery(`listing:${id}`, () =>
    listingsApi.get(id),
  );
  const [selectedImage, setSelectedImage] = useState(0);

  if (!listing) {
    if (error !== undefined) {
      const notFound = error instanceof ApiError && (error.status === 404 || error.status === 400);
      return (
        <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
          <h1 className="text-2xl font-serif font-semibold text-ink">
            {notFound ? "Lot not found" : "Could not load this lot"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {notFound
              ? "It may have been withdrawn, or it is still awaiting expert review."
              : errorMessage(error)}
          </p>
          <div className="flex justify-center gap-4 text-sm">
            {!notFound && (
              <button onClick={reload} className="inline-flex items-center gap-1 text-ink underline underline-offset-2">
                <RotateCw className="h-3.5 w-3.5" /> Try again
              </button>
            )}
            <Link href="/listings" className="text-ink underline underline-offset-2">
              Browse the catalog →
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-2 gap-10 animate-pulse" aria-busy={loading}>
        <div className="aspect-square rounded-md bg-surface" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-surface" />
          <div className="h-4 w-1/2 rounded bg-surface" />
          <div className="h-64 rounded-md bg-surface" />
        </div>
      </div>
    );
  }

  const images = listing.images.length ? listing.images : [{ id: "none", url: "", position: 0 }];
  const activeImage = images[Math.min(selectedImage, images.length - 1)];
  const details: [string, string | null][] = [
    ["Category", CATEGORY_LABELS[listing.category]],
    ["Condition", CONDITION_LABELS[listing.condition]],
    ["Era / year", listing.era],
    ["Denomination", listing.denomination],
    ["Listed", formatDateTime(listing.createdAt)],
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-12">
      <Link href="/listings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to catalog
      </Link>

      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-10 lg:gap-14">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square rounded-md overflow-hidden border border-line bg-surface">
            <ListingImage src={activeImage.url} alt={listing.title} className="h-full w-full object-contain p-6 sm:p-10" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-surface ${
                    index === selectedImage ? "border-ink" : "border-line opacity-70 hover:opacity-100 hover:border-line-strong"
                  }`}
                >
                  <ListingImage src={image.url} alt="" className="h-full w-full object-contain p-1.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary + buying */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {listing.isVerified && (
                <Badge variant="gold" className="gap-1">
                  <ShieldCheck className="h-3 w-3" /> Expert Verified
                </Badge>
              )}
              {listing.isFeatured && <Badge variant="cyan">Featured</Badge>}
              {listing.status !== "ACTIVE" && <Badge variant="secondary">{listing.status.replace("_", " ")}</Badge>}
            </div>
            <h1 className="text-3xl sm:text-[2.5rem] sm:leading-tight font-semibold tracking-tight text-ink font-serif">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Sold by{" "}
                <span className="font-medium text-ink">{listing.seller.name}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> {listing.viewCount} views
              </span>
            </div>
          </div>

          <dl className="divide-y divide-line border-y border-line text-sm">
            {details
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
          </dl>

          {listing.listingType === "AUCTION" && listing.auction ? (
            <AuctionPanel listing={listing} onListingChanged={reload} />
          ) : listing.listingType === "AUCTION" ? (
            <Alert variant="info">
              The seller has not opened bidding on this lot yet. Opening price {formatLKR(listing.startingPrice)}.
            </Alert>
          ) : (
            <FixedPricePanel listing={listing} />
          )}
        </div>
      </div>

      {/* Description */}
      <div className="border-t border-line pt-10">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-xl font-serif font-semibold text-ink">Description</h2>
          <p className="text-[15px] leading-relaxed text-ink-soft whitespace-pre-line">{listing.description}</p>
        </div>
      </div>

      {/* Authentication */}
      <div className="grid md:grid-cols-2 gap-10 border-t border-line pt-10">
        <div className="space-y-3">
          <h2 className="text-lg font-serif font-semibold text-ink">Certificates</h2>
          {listing.certificates.length ? (
            <ul className="space-y-2">
              {listing.certificates.map((cert) => (
                <li key={cert.id} className="flex items-center justify-between rounded-md border border-line bg-white px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-ink-soft">
                    <FileCheck2 className="h-4 w-4 text-brass" />
                    {cert.fileName}
                    {cert.issuer && <span className="text-muted-foreground">· {cert.issuer}</span>}
                  </span>
                  <Badge variant={cert.status === "APPROVED" ? "gold" : "secondary"}>{cert.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No certificates were submitted with this lot.</p>
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-serif font-semibold text-ink">Expert review history</h2>
          {listing.verifications.length ? (
            <ul className="space-y-2">
              {listing.verifications.map((v) => (
                <li key={v.id} className="rounded-md border border-line bg-white px-4 py-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-ink">{DECISION_LABELS[v.decision]}</span>
                    <span className="text-muted-foreground">{formatDateTime(v.verifiedAt)}</span>
                  </div>
                  <p className="text-ink-soft">
                    by {v.appraiser.name}
                    {v.appraisedValue && <> · appraised at {formatLKR(v.appraisedValue)}</>}
                  </p>
                  {v.comments && <p className="text-ink-soft">{v.comments}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No appraiser decisions recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
