"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ItemImage } from "@/components/ListingCard";
import { RequireAuth } from "@/components/RequireAuth";
import { BackLink, EmptyState, ErrorText, PageLoader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { categoryLabel, money } from "@/lib/format";
import type { CheckoutResult, ListingDetail } from "@/lib/types";

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<PageLoader />}>
        <Checkout />
      </Suspense>
    </RequireAuth>
  );
}

function Checkout() {
  const params = useSearchParams();
  const { user } = useAuth();
  const auctionId = params.get("auctionId");
  const listingId = params.get("listingId");
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({
    shippingName: user?.name ?? "",
    shippingPhone: user?.phone ?? "",
    shippingAddress: "",
    shippingCity: "",
    shippingPostalCode: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckoutResult | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (auctionId) {
          const auction = await api.auctions.get(auctionId);
          setAmount(auction.currentPrice);
          setListing(await api.listings.get(auction.listingId));
        } else if (listingId) {
          const l = await api.listings.get(listingId);
          setListing(l);
          setAmount(l.startingPrice);
        } else {
          setLoadError("Nothing to check out.");
        }
      } catch (err) {
        setLoadError((err as Error).message);
      }
    })();
  }, [auctionId, listingId]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.orders.checkout({
        ...(auctionId ? { auctionId } : { listingId: listingId! }),
        ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])),
      } as Parameters<typeof api.orders.checkout>[0]);
      setResult(res);
      // Hosted payment page without a form post: go straight there.
      if (res.payment.redirectUrl && !res.payment.formFields) {
        window.location.href = res.payment.redirectUrl;
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState title="Checkout unavailable" text={loadError} action={<Link href="/orders" className="btn btn-primary">Your orders</Link>} />
      </div>
    );
  }
  if (!listing) return <PageLoader />;

  if (result) return <PaymentStep result={result} />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <BackLink href={`/listings/${listing.id}`}>Back to listing</BackLink>
      <h1 className="animate-fade-up mb-8 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="animate-fade-up card space-y-4 p-6">
          <h2 className="font-semibold text-slate-900">Shipping details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="sn">Full name</label>
              <input id="sn" className="input" value={form.shippingName} onChange={set("shippingName")} required />
            </div>
            <div>
              <label className="label" htmlFor="sp">Phone</label>
              <input id="sp" type="tel" className="input" placeholder="+94771234567" value={form.shippingPhone} onChange={set("shippingPhone")} required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="sa">Address</label>
            <input id="sa" className="input" placeholder="42 Galle Road" value={form.shippingAddress} onChange={set("shippingAddress")} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="sc">City</label>
              <input id="sc" className="input" placeholder="Colombo" value={form.shippingCity} onChange={set("shippingCity")} required />
            </div>
            <div>
              <label className="label" htmlFor="spc">Postal code</label>
              <input id="spc" className="input" placeholder="00300" value={form.shippingPostalCode} onChange={set("shippingPostalCode")} required />
            </div>
          </div>
          <ErrorText>{error}</ErrorText>
          <button className="btn btn-primary w-full py-3" disabled={busy}>
            {busy && <Spinner className="size-4" />} Place order · {money(amount)}
          </button>
          <p className="text-center text-xs text-slate-400">The item is reserved for you as soon as the order is placed.</p>
        </form>

        <aside className="animate-fade-up card h-fit overflow-hidden" style={{ animationDelay: "80ms" }}>
          <ItemImage url={listing.images[0]?.url} alt={listing.title} className="aspect-[4/3] w-full" />
          <div className="space-y-3 p-5">
            <p className="text-xs font-medium tracking-wide text-emerald-700 uppercase">{categoryLabel(listing.category)}</p>
            <p className="font-medium text-slate-900">{listing.title}</p>
            <p className="text-sm text-slate-500">Sold by {listing.seller.name}</p>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">{auctionId ? "Winning bid" : "Price"}</span>
              <span className="font-semibold text-slate-900">{money(amount)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PaymentStep({ result }: { result: CheckoutResult }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { payment, order } = result;

  // Providers that need a form post (e.g. PayHere) get it submitted for the buyer.
  useEffect(() => {
    if (payment.redirectUrl && payment.formFields) formRef.current?.submit();
  }, [payment]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="animate-fade-up card p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
        <h1 className="text-xl font-semibold text-slate-900">Order placed</h1>
        <p className="mt-2 text-sm text-slate-500">
          {payment.redirectUrl
            ? "Redirecting you to our secure payment partner…"
            : "Your order is reserved and awaiting payment confirmation."}
        </p>
        <dl className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Amount</dt><dd className="font-semibold">{money(order.amount)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Payment ref</dt><dd className="truncate font-mono text-xs">{payment.transactionRef}</dd></div>
        </dl>
        {payment.redirectUrl && payment.formFields && (
          <form ref={formRef} method="POST" action={payment.redirectUrl} className="mt-4">
            {Object.entries(payment.formFields).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <button className="btn btn-primary w-full">Continue to payment</button>
          </form>
        )}
        <Link href={`/orders/${order.id}`} className="btn btn-outline mt-4 w-full">View order</Link>
      </div>
    </div>
  );
}
