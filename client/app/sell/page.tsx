"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListingCard, ListingGridSkeleton } from "@/components/ListingCard";
import { RequireAuth } from "@/components/RequireAuth";
import { EmptyState, ErrorText, PageHeader, Pagination } from "@/components/ui";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import type { ListingCard as Card, Order, Page } from "@/lib/types";

export default function SellPage() {
  return (
    <RequireAuth roles={["SELLER"]}>
      <Dashboard />
    </RequireAuth>
  );
}

function Dashboard() {
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<Page<Card> | null>(null);
  const [sales, setSales] = useState<Page<Order> | null>(null);
  const [toShip, setToShip] = useState<Page<Order> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listings.mine({ page, limit: 12 }).then(setListings).catch((e) => setError(e.message));
  }, [page]);

  useEffect(() => {
    api.orders.sales(1).then(setSales).catch(() => {});
    api.orders.sales(1, "PAID").then(setToShip).catch(() => {});
  }, []);

  const revenue = sales?.data
    .filter((o) => ["PAID", "SHIPPED", "COMPLETED"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.amount), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Seller dashboard"
        subtitle="Manage your listings, auctions and sales."
        action={<Link href="/sell/new" className="btn btn-primary">+ New listing</Link>}
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard label="Listings" value={listings ? String(listings.meta.total) : "—"} />
        <StatCard label="Orders to ship" value={toShip ? String(toShip.meta.total) : "—"} href="/orders" highlight={!!toShip?.meta.total} />
        <StatCard label="Recent sales value" value={revenue === undefined ? "—" : money(revenue)} href="/orders" />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Your listings</h2>
      <ErrorText>{error}</ErrorText>
      {!listings && !error ? (
        <ListingGridSkeleton count={4} />
      ) : listings?.data.length === 0 ? (
        <EmptyState
          title="No listings yet"
          text="List your first coin, note, stamp or medal. An appraiser will review it before it goes live."
          action={<Link href="/sell/new" className="btn btn-primary">Create a listing</Link>}
        />
      ) : listings ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.data.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} href={`/sell/${l.id}`} showStatus />
            ))}
          </div>
          <Pagination page={listings.meta.page} totalPages={listings.meta.totalPages} onChange={setPage} />
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, href, highlight }: { label: string; value: string; href?: string; highlight?: boolean }) {
  const body = (
    <div className={`animate-fade-up card h-full p-5 transition ${href ? "hover:-translate-y-0.5 hover:shadow-md" : ""} ${highlight ? "border-amber-200 bg-amber-50/50" : ""}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
