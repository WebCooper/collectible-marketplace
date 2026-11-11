"use client";

import { useState } from "react";
import Link from "next/link";
import { errorMessage, ordersApi, type OrderStatus } from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatDateTime, formatLKR } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { ListingImage } from "@/components/listings/listing-image";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageContainer, PageHeader } from "@/components/shared/page-header";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];

/** Buyer purchases (GET /orders) or seller sales (GET /orders/sales). */
export function OrdersList({ mode }: { mode: "purchases" | "sales" }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const selling = mode === "sales";
  const { data, error, loading } = useApiQuery(`orders:${mode}:${page}:${status}`, () =>
    (selling ? ordersApi.sales : ordersApi.purchases)({ page, limit: 10, status: status || undefined }),
  );

  return (
    <PageContainer>
      <PageHeader
        title={selling ? "Sales" : "My orders"}
        description={
          selling
            ? "Orders placed on your items. Mark paid orders as shipped once they are on their way."
            : "Everything you have bought. Confirm delivery when an item arrives."
        }
        action={
          <div className="w-44">
            <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value as OrderStatus | ""); setPage(1); }}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
            </Select>
          </div>
        }
      />
      {error !== undefined && <Alert variant="error">{errorMessage(error)}</Alert>}
      {loading && !data && <div className="h-40 rounded-md bg-surface animate-pulse" />}
      {data && data.data.length === 0 && (
        <div className="rounded-md border border-dashed border-line p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{selling ? "No sales yet." : "You have not bought anything yet."}</p>
          {!selling && <Link href="/listings"><Button variant="gold">Browse the catalogue</Button></Link>}
        </div>
      )}
      <ul className="space-y-3">
        {data?.data.map((order) => (
          <li key={order.id}>
            <Link href={`/orders/${order.id}`} className="flex gap-4 rounded-md border border-line bg-white p-4 hover:border-line-strong transition-colors">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded border border-line bg-surface">
                <ListingImage src={order.listing?.images?.[0]?.url} alt="" className="h-full w-full object-contain p-1.5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink truncate">{order.listing?.title ?? "Order"}</span>
                  <StatusBadge status={order.status} />
                  {order.dispute && <StatusBadge status="OPEN" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selling ? `Buyer: ${order.buyer?.name ?? "—"}` : `Seller: ${order.seller?.name ?? "—"}`} · {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div className="text-right font-semibold tabular-nums text-ink shrink-0">{formatLKR(order.amount)}</div>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination meta={data?.meta} onPage={setPage} />
    </PageContainer>
  );
}
