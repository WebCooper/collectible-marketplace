import type { Metadata } from "next";
import { SellerProfile } from "@/components/account/seller-profile";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Seller | ${SITE_NAME}` };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SellerProfile key={id} id={id} />;
}
