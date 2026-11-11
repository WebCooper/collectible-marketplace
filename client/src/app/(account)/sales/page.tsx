import type { Metadata } from "next";
import { RequireAuth } from "@/components/shared/require-auth";
import { OrdersList } from "@/components/orders/orders-list";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Sales | ${SITE_NAME}` };

export default function Page() {
  return (
    <RequireAuth roles={["SELLER"]}>
      <OrdersList mode="sales" />
    </RequireAuth>
  );
}
