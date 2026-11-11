import type { Metadata } from "next";
import { RequireAuth } from "@/components/shared/require-auth";
import { SellerListings } from "@/components/seller/seller-listings";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `My Listings | ${SITE_NAME}` };

export default function Page() {
  return (
    <RequireAuth roles={["SELLER"]}>
      <SellerListings />
    </RequireAuth>
  );
}
