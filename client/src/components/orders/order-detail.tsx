"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Truck } from "lucide-react";
import { errorMessage, ordersApi, type Order } from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/providers/auth-provider";
import { formatDateTime, formatLKR } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageContainer, PageHeader } from "@/components/shared/page-header";

const STEPS = ["PENDING", "PAID", "SHIPPED", "COMPLETED"] as const;

/** One order: progress, shipping details, and the actions each party is allowed. */
export function OrderDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const { data: order, error, reload } = useApiQuery(`order:${id}`, () => ordersApi.get(id));

  if (!order) {
    return (
      <PageContainer>
        {error !== undefined ? <Alert variant="error">{errorMessage(error)}</Alert> : <div className="h-40 rounded-md bg-surface animate-pulse" />}
      </PageContainer>
    );
  }

  const isSeller = user?.id === order.sellerId;
  const isBuyer = user?.id === order.buyerId;
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <PageContainer>
      <Link href={isSeller ? "/sales" : "/orders"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {isSeller ? "sales" : "orders"}
      </Link>
      <PageHeader
        title={order.listing?.title ?? "Order"}
        description={`Order placed ${formatDateTime(order.createdAt)}`}
        action={<StatusBadge status={order.status} />}
      />

      {order.status === "CANCELLED" ? (
        <Alert variant="error">This order was cancelled.</Alert>
      ) : (
        <ol className="grid grid-cols-4 gap-2 text-center text-xs">
          {STEPS.map((step, index) => (
            <li key={step} className={`rounded-md border px-2 py-2 ${index <= stepIndex ? "border-ink bg-ink text-white" : "border-line text-muted-foreground"}`}>
              {step.charAt(0) + step.slice(1).toLowerCase()}
            </li>
          ))}
        </ol>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Amount</dt><dd className="text-right font-semibold tabular-nums">{formatLKR(order.amount)}</dd>
              <dt className="text-muted-foreground">Payment</dt><dd className="text-right">{order.payment ? <StatusBadge status={order.payment.status} /> : "—"}</dd>
              <dt className="text-muted-foreground">Seller</dt><dd className="text-right">{order.seller?.name}</dd>
              <dt className="text-muted-foreground">Buyer</dt><dd className="text-right">{order.buyer?.name}</dd>
              {order.trackingNumber && (<><dt className="text-muted-foreground">Tracking</dt><dd className="text-right font-mono text-xs">{order.trackingNumber}</dd></>)}
            </dl>
            {order.listing && (
              <Link href={`/listings/${order.listing.id}`} className="mt-4 inline-block text-sm underline underline-offset-2">View listing</Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ship to</CardTitle></CardHeader>
          <CardContent className="text-sm leading-relaxed text-ink-soft">
            {order.shippingName}<br />
            {order.shippingAddress}<br />
            {order.shippingCity} {order.shippingPostalCode}<br />
            {order.shippingPhone}
          </CardContent>
        </Card>
      </div>

      {isSeller && order.status === "PAID" && <ShipForm order={order} onDone={reload} />}
      {isSeller && order.status === "PENDING" && <Alert variant="info">Waiting for the buyer&apos;s payment to be confirmed.</Alert>}
      {isBuyer && order.status === "SHIPPED" && <ConfirmDelivery order={order} onDone={reload} />}
      {isBuyer && order.status === "PENDING" && <Alert variant="info">Your payment has not been confirmed yet. The item stays reserved for you meanwhile.</Alert>}

      <DisputeSection order={order} canRaise={isBuyer || isSeller} onDone={reload} />
    </PageContainer>
  );
}

function ShipForm({ order, onDone }: { order: Order; onDone: () => void }) {
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ship = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await ordersApi.updateStatus(order.id, { status: "SHIPPED", trackingNumber: tracking.trim() || undefined });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Mark as shipped</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={ship} className="space-y-3 max-w-md">
          {error && <Alert variant="error">{error}</Alert>}
          <div>
            <Label htmlFor="tracking">Courier tracking number (optional)</Label>
            <Input id="tracking" maxLength={100} value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </div>
          <Button type="submit" variant="gold" isLoading={busy}>Mark shipped</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ConfirmDelivery({ order, onDone }: { order: Order; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await ordersApi.updateStatus(order.id, { status: "COMPLETED" });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Item arrived?</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Confirm once you have received and inspected the item. This completes the order.</p>
        {error && <Alert variant="error">{error}</Alert>}
        <Button variant="gold" isLoading={busy} onClick={confirm}>Confirm delivery</Button>
      </CardContent>
    </Card>
  );
}

function DisputeSection({ order, canRaise, onDone }: { order: Order; canRaise: boolean; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (order.dispute) {
    return (
      <Alert variant="info">
        A dispute is on file for this order (<StatusBadge status={order.dispute.status} />). Our team will contact both parties.
      </Alert>
    );
  }
  if (!canRaise || order.status === "CANCELLED") return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10 || reason.trim().length > 200) {
      setReasonError("Reason must be between 10 and 200 characters");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ordersApi.raiseDispute(order.id, { reason: reason.trim(), details: details.trim() || undefined });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Problem with this order?</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {!open ? (
          <Button variant="outline" onClick={() => setOpen(true)}>Raise a dispute</Button>
        ) : (
          <form onSubmit={submit} className="space-y-3 max-w-xl" noValidate>
            {error && <Alert variant="error">{error}</Alert>}
            <div>
              <Label htmlFor="reason" required>Reason</Label>
              <Input id="reason" value={reason} maxLength={200} placeholder="Item does not match the listing description" onChange={(e) => { setReason(e.target.value); setReasonError(undefined); }} error={reasonError} />
            </div>
            <div>
              <Label htmlFor="details">Details</Label>
              <Textarea id="details" maxLength={2000} value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" isLoading={busy}>Submit dispute</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
