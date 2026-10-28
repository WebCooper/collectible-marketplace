"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { EmptyState, ErrorText, PageHeader, Pagination, Tabs } from "@/components/ui";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { useToast } from "@/lib/toast";
import type { Notification, Page } from "@/lib/types";

const ICONS: Record<string, string> = {
  OUTBID: "⚠️",
  AUCTION_STARTING: "⏰",
  AUCTION_ENDING: "⏳",
  AUCTION_WON: "🏆",
  AUCTION_CLOSED: "🔔",
  LISTING_APPROVED: "✅",
  LISTING_REJECTED: "❌",
  LISTING_FLAGGED: "🚩",
  ORDER_CONFIRMED: "🧾",
  PAYMENT_RECEIVED: "💳",
  ITEM_SHIPPED: "📦",
  DISPUTE_UPDATE: "⚖️",
};

/** Where a notification should take the user, from the IDs in its payload. */
function linkFor(n: Notification) {
  const p = n.payload ?? {};
  if (p.orderId) return `/orders/${p.orderId}`;
  if (p.listingId) return `/listings/${p.listingId}`;
  return null;
}

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <Notifications />
    </RequireAuth>
  );
}

function Notifications() {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page<Notification> | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.notifications.list(page, filter === "unread").then(setResult).catch((e) => setError(e.message));
  }, [page, filter]);
  useEffect(load, [load]);

  async function open(n: Notification) {
    if (!n.readStatus) {
      setResult((r) => r && { ...r, data: r.data.map((x) => (x.id === n.id ? { ...x, readStatus: true } : x)) });
      api.notifications.markRead(n.id).catch(() => {});
    }
    const href = linkFor(n);
    if (href) router.push(href);
  }

  async function markAll() {
    const res = await api.notifications.markAllRead();
    toast(`Marked ${res.updated} notification${res.updated === 1 ? "" : "s"} as read`);
    load();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Notifications"
        subtitle="Bids, approvals, orders and more."
        action={<button className="btn btn-outline" onClick={markAll}>Mark all as read</button>}
      />
      <Tabs
        tabs={[
          { value: "all", label: "All" },
          { value: "unread", label: "Unread" },
        ]}
        value={filter}
        onChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
      />
      <ErrorText>{error}</ErrorText>
      {!result && !error ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : result?.data.length === 0 ? (
        <EmptyState title="You're all caught up" text="New activity on your bids, listings and orders will show up here." />
      ) : result ? (
        <>
          <ul className="card divide-y divide-slate-100 overflow-hidden">
            {result.data.map((n, i) => (
              <li key={n.id} className="animate-fade-up" style={{ animationDelay: `${i * 25}ms` }}>
                <button
                  onClick={() => open(n)}
                  className={`flex w-full items-start gap-4 p-4 text-left transition hover:bg-slate-50 ${n.readStatus ? "" : "bg-emerald-50/40"}`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-lg ring-1 ring-slate-100">
                    {ICONS[n.type] ?? "🔔"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`text-sm ${n.readStatus ? "text-slate-700" : "font-semibold text-slate-900"}`}>{n.title}</span>
                      {!n.readStatus && <span className="size-2 rounded-full bg-emerald-500" />}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-500">{n.message}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.sentAt)}</span>
                </button>
              </li>
            ))}
          </ul>
          <Pagination page={result.meta.page} totalPages={result.meta.totalPages} onChange={setPage} />
        </>
      ) : null}
    </div>
  );
}
