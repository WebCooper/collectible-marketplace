"use client";

import Link from "next/link";
import { useState } from "react";
import { ItemImage } from "@/components/ListingCard";
import { RequireAuth } from "@/components/RequireAuth";
import { EmptyState, ErrorText, PageHeader, Pagination, StatusBadge, Tabs } from "@/components/ui";
import { api } from "@/lib/api";
import { date, money } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { useRequest } from "@/lib/useRequest";

const STATUSES: (OrderStatus | "")[] = ["", "PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];

export default function OrdersPage() {
  return (
    <RequireAuth>
      <Orders />
    </RequireAuth>
  );
}

function Orders() {
  const [tab, setTab] = useState<"purchases" | "sales">("purchases");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);
  const { data: result, error } = useRequest(`${tab}|${status}|${page}`, () =>
    (tab === "purchases" ? api.orders.purchases : api.orders.sales)(page, status || undefined),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader title="Orders" subtitle="Track what you've bought and sold." />
      <Tabs
        tabs={[
          { value: "purchases", label: "Purchases" },
          { value: "sales", label: "Sales" },
        ]}
        value={tab}
        onChange={(t) => {
          setTab(t);
          setPage(1);
        }}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s || "all"}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              status === s ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {s ? s.charAt(0) + s.slice(1).toLowerCase() : "All"}
          </button>
        ))}
      </div>

      <ErrorText>{error}</ErrorText>
      {!result && !error ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-24" />)}
        </div>
      ) : result?.data.length === 0 ? (
        <EmptyState
          title={tab === "purchases" ? "No purchases yet" : "No sales yet"}
          text={tab === "purchases" ? "Win an auction or buy an item to see it here." : "Orders for your listings will appear here."}
          action={tab === "purchases" ? <Link href="/listings" className="btn btn-primary">Browse collectibles</Link> : undefined}
        />
      ) : result ? (
        <>
          <ul className="space-y-3">
            {result.data.map((o, i) => (
              <li key={o.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <Link
                  href={`/orders/${o.id}`}
                  className="card flex items-center gap-4 p-4 transition hover:border-emerald-200 hover:shadow-md"
                >
                  <ItemImage url={o.listing.images?.[0]?.url} alt={o.listing.title} className="size-16 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{o.listing.title}</p>
                    <p className="text-xs text-slate-500">
                      {date(o.createdAt)} · {tab === "purchases" ? `from ${o.seller.name}` : `to ${o.buyer.name}`}
                    </p>
                    {o.dispute && <p className="mt-1 text-xs text-rose-600">Dispute {o.dispute.status.toLowerCase().replace("_", " ")}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-semibold text-slate-900">{money(o.amount)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={result.meta.page} totalPages={result.meta.totalPages} onChange={setPage} />
        </>
      ) : null}
    </div>
  );
}
