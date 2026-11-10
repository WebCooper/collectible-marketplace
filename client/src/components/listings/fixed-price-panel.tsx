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
      <div className="rounded-md border border-line bg-white p-5 space-y-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Tag className="h-3.5 w-3.5" /> Fixed price
        </span>
        <div className="text-3xl sm:text-4xl font-bold tabular-nums text-ink">{formatLKR(listing.startingPrice)}</div>
        {!available && !checkingOut && (
          <p className="text-sm text-live">This item is no longer available.</p>
        )}
      </div>

      {checkingOut ? (
        <CheckoutPanel listingId={listing.id} />
      ) : available && status === "guest" ? (
        <Link href={loginHref(pathname)} className="block">
          <Button variant="gold" size="lg" className="w-full gap-2">
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
          className="w-full gap-2"
        >
          <ShoppingBag className="h-4 w-4" /> Buy Now
        </Button>
      ) : null}
    </div>
  );
}
