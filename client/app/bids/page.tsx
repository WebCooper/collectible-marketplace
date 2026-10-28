"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { useNow } from "@/components/ListingCard";
import { EmptyState, ErrorText, PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { countdown, money, timeAgo } from "@/lib/format";
import type { MyBid, Page } from "@/lib/types";

export default function BidsPage() {
  return (
    <RequireAuth>
      <Bids />
    </RequireAuth>
  );
}

function Bids() {
  const { user } = useAuth();
  const now = useNow(10_000);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page<MyBid> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.auctions.myBids(page, 20).then(setResult).catch((e) => setError(e.message));
  }, [page]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader title="My bids" subtitle="Every auction you've taken part in." />
      <ErrorText>{error}</ErrorText>
      {!result && !error ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : result?.data.length === 0 ? (
        <EmptyState title="No bids yet" text="Find an auction you love and place your first bid." action={<Link href="/listings?listingType=AUCTION" className="btn btn-primary">Live auctions</Link>} />
      ) : result ? (
        <>
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {result.data.map((b, i) => {
              const a = b.auction;
              const ended = a.status === "ENDED" || new Date(a.endTime).getTime() <= now;
              const won = ended && a.winnerId === user?.id;
              return (
                <div key={b.id} className="animate-fade-up flex flex-wrap items-center gap-4 p-4 transition hover:bg-slate-50/70" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="min-w-0 flex-1">
                    <Link href={`/listings/${a.listing.id}`} className="font-medium text-slate-900 hover:text-emerald-700">{a.listing.title}</Link>
                    <p className="text-xs text-slate-500">
                      Your bid {money(b.amount)} · {timeAgo(b.placedAt)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-500">Current <span className="font-semibold text-slate-900">{money(a.currentPrice)}</span></p>
                    <p className="text-xs text-slate-400">{ended ? "Ended" : `${countdown(new Date(a.endTime).getTime() - now)} left`}</p>
                  </div>
                  <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                    <StatusBadge status={b.status} />
                    {won && (
                      <Link href={`/listings/${a.listing.id}`} className="btn btn-primary px-3 py-1.5 text-xs">Checkout</Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={result.meta.page} totalPages={result.meta.totalPages} onChange={setPage} />
        </>
      ) : null}
    </div>
  );
}
