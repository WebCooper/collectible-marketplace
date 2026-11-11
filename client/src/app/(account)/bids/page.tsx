import type { Metadata } from "next";
import { RequireAuth } from "@/components/shared/require-auth";
import { MyBids } from "@/components/orders/my-bids";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `My Bids | ${SITE_NAME}` };

export default function Page() {
  return (
    <RequireAuth roles={["BUYER", "SELLER"]}>
      <MyBids />
    </RequireAuth>
  );
}
