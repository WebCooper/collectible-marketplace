"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tag, ShoppingBag } from "lucide-react";
import type { ListingDetail } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { formatLKR, loginHref } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { CheckoutPanel } from "./checkout-panel";

/** Buying a fixed-price listing: straight to checkout (POST /orders/checkout). */
export function FixedPricePanel({ listing }: { listing: ListingDetail }) {
  const pathname = usePathname();
  const { user, status } = useAuth();
  // Stays true after checkout so the order confirmation remains visible even
  // though the listing is now SOLD.
  const [checkingOut, setCheckingOut] = useState(false);
  const isOwn = user?.id === listing.sellerId;
  const available = listing.status === "ACTIVE";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[rgba(201,162,39,0.25)] bg-[#0d1424]/80 p-5 space-y-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-cyan-300">
          <Tag className="h-3.5 w-3.5" /> Fixed price
        </span>
        <div className="text-4xl font-bold font-mono text-[#f1d27a]">{formatLKR(listing.startingPrice)}</div>
        {!available && !checkingOut && (
          <p className="text-sm text-zinc-400">This item is no longer available.</p>
        )}
      </div>

      {checkingOut ? (
        <CheckoutPanel listingId={listing.id} />
      ) : available && status === "guest" ? (
        <Link href={loginHref(pathname)} className="block">
          <Button variant="gold" size="lg" className="w-full text-xs uppercase tracking-wider gap-2">
            <ShoppingBag className="h-4 w-4" /> Sign in to buy
          </Button>
        </Link>
      ) : available && isOwn ? (
        <Alert variant="info">This is your listing.</Alert>
      ) : available && user?.role === "APPRAISER" ? (
        <Alert variant="info">Appraiser accounts cannot make purchases.</Alert>
      ) : available && status === "authenticated" ? (
        <Button
          variant="gold"
          size="lg"
          onClick={() => setCheckingOut(true)}
          className="w-full text-xs uppercase tracking-wider gap-2"
        >
          <ShoppingBag className="h-4 w-4" /> Buy Now
        </Button>
      ) : null}
    </div>
  );
}
