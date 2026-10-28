"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { BackLink, EmptyState, ErrorText, Modal, PageLoader, Spinner, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import { useToast } from "@/lib/toast";
import type { Order } from "@/lib/types";

const STEPS = ["PENDING", "PAID", "SHIPPED", "COMPLETED"] as const;
const STEP_LABELS: Record<string, string> = {
  PENDING: "Order placed",
  PAID: "Payment received",
  SHIPPED: "Shipped",
  COMPLETED: "Delivered",
};

export default function OrderPage() {
  return (
    <RequireAuth>
      <OrderDetail />
    </RequireAuth>
  );
}

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shipOpen, setShipOpen] = useState(false);
  const [tracking, setTracking] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const load = useCallback(() => {
    api.orders.get(id).then(setOrder).catch((e) => setLoadError(e.message));
  }, [id]);
  useEffect(load, [load]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState title="Order unavailable" text={loadError} action={<Link href="/orders" className="btn btn-primary">Your orders</Link>} />
      </div>
    );
  }
  if (!order || !user) return <PageLoader />;

  const isBuyer = user.id === order.buyerId;
  const isSeller = user.id === order.sellerId;
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const cancelled = order.status === "CANCELLED";

  async function advance(status: "SHIPPED" | "COMPLETED") {
    setBusy(true);
    setError("");
    try {
      await api.orders.updateStatus(id, status, status === "SHIPPED" ? tracking.trim() : undefined);
      toast(status === "SHIPPED" ? "Marked as shipped — the buyer has been notified." : "Thanks for confirming delivery!");
      setShipOpen(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function raiseDispute(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.orders.raiseDispute(id, reason.trim(), details.trim());
      toast("Dispute raised. An administrator will review it.", "info");
      setDisputeOpen(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <BackLink href="/orders">All orders</BackLink>
      <div className="animate-fade-up mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            <Link href={`/listings/${order.listing.id}`} className="hover:text-emerald-700">{order.listing.title}</Link>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Placed {dateTime(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-slate-900">{money(order.amount)}</p>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Progress */}
      <div className="animate-fade-up card mb-6 p-6">
        {cancelled ? (
          <p className="text-sm text-rose-700">This order was cancelled.{order.payment?.status === "REFUNDED" ? " The payment has been refunded." : ""}</p>
        ) : (
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => {
              const done = i <= stepIndex;
              return (
                <li key={s} className="flex flex-col items-center text-center">
                  <div className="relative flex w-full items-center">
                    <div className={`h-0.5 flex-1 ${i === 0 ? "invisible" : done ? "bg-emerald-500" : "bg-slate-200"}`} />
                    <span
                      className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold transition duration-500 ${
                        done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                      } ${i === stepIndex ? "ring-4 ring-emerald-100" : ""}`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <div className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? "invisible" : i < stepIndex ? "bg-emerald-500" : "bg-slate-200"}`} />
                  </div>
                  <span className={`mt-2 text-xs ${done ? "font-medium text-slate-800" : "text-slate-400"}`}>{STEP_LABELS[s]}</span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {isSeller && order.status === "PAID" && (
            <button className="btn btn-primary" onClick={() => setShipOpen(true)}>Mark as shipped</button>
          )}
          {isBuyer && order.status === "SHIPPED" && (
            <button className="btn btn-primary" disabled={busy} onClick={() => advance("COMPLETED")}>
              {busy && <Spinner className="size-4" />} I received the item
            </button>
          )}
          {!order.dispute && !cancelled && (isBuyer || isSeller) && (
            <button className="btn btn-danger" onClick={() => setDisputeOpen(true)}>Raise a dispute</button>
          )}
        </div>
        {isBuyer && order.status === "PENDING" && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Waiting for payment confirmation from the payment provider (ref <span className="font-mono text-xs">{order.payment?.transactionRef}</span>).
          </p>
        )}
        <div className="mt-3"><ErrorText>{!shipOpen && !disputeOpen ? error : ""}</ErrorText></div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="animate-fade-up card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Shipping</h2>
          <address className="space-y-0.5 text-sm text-slate-600 not-italic">
            <p className="font-medium text-slate-800">{order.shippingName}</p>
            <p>{order.shippingAddress}</p>
            <p>{order.shippingCity} {order.shippingPostalCode}</p>
            <p>{order.shippingPhone}</p>
          </address>
          {order.trackingNumber && (
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              Tracking number: <span className="font-mono font-medium">{order.trackingNumber}</span>
            </p>
          )}
        </section>

        <section className="animate-fade-up card space-y-3 p-6 text-sm">
          <h2 className="font-semibold text-slate-900">Details</h2>
          <Row label="Buyer" value={isBuyer ? "You" : order.buyer.name} />
          <Row label="Seller" value={isSeller ? "You" : order.seller.name} />
          <Row label="Type" value={order.auctionId ? "Auction win" : "Fixed price"} />
          {order.payment && (
            <>
              <Row label="Payment" value={<StatusBadge status={order.payment.status} />} />
              <Row label="Provider" value={order.payment.provider} />
            </>
          )}
          {order.dispute && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-rose-800">Dispute</span>
                <StatusBadge status={order.dispute.status} />
              </div>
              {order.dispute.reason && <p className="mt-1 text-slate-700">{order.dispute.reason}</p>}
              {order.dispute.resolution && <p className="mt-2 text-slate-600"><span className="font-medium">Outcome:</span> {order.dispute.resolution}</p>}
            </div>
          )}
        </section>
      </div>

      <Modal open={shipOpen} onClose={() => setShipOpen(false)} title="Mark as shipped">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="tracking">Courier tracking number (optional)</label>
            <input id="tracking" className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="LK123456" />
          </div>
          <ErrorText>{error}</ErrorText>
          <div className="flex justify-end gap-2">
            <button className="btn btn-outline" onClick={() => setShipOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={busy} onClick={() => advance("SHIPPED")}>
              {busy && <Spinner className="size-4" />} Confirm shipment
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={disputeOpen} onClose={() => setDisputeOpen(false)} title="Raise a dispute">
        <form onSubmit={raiseDispute} className="space-y-4">
          <div>
            <label className="label" htmlFor="reason">What went wrong?</label>
            <input id="reason" className="input" minLength={10} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Item does not match the listing description" required />
          </div>
          <div>
            <label className="label" htmlFor="details">Details (optional)</label>
            <textarea id="details" className="input min-h-28" maxLength={2000} value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <ErrorText>{error}</ErrorText>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-outline" onClick={() => setDisputeOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>{busy && <Spinner className="size-4" />} Submit dispute</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
