import type { Metadata } from "next";
import { RequireAuth } from "@/components/shared/require-auth";
import { OrderDetail } from "@/components/orders/order-detail";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Order | ${SITE_NAME}` };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireAuth>
      <OrderDetail key={id} id={id} />
    </RequireAuth>
  );
}
