import { Suspense } from "react";
import { Metadata } from "next";
import { ListingsBrowser } from "@/components/listings/listings-browser";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Browse Collectibles | ${SITE_NAME}`,
  description:
    "Search verified Sri Lankan coins, currency notes, stamps and medals - live auctions and fixed-price lots.",
};

export default function ListingsPage() {
  // Filters live in the URL (useSearchParams), so the browser renders inside
  // a Suspense boundary.
  return (
    <Suspense>
      <ListingsBrowser />
    </Suspense>
  );
}
