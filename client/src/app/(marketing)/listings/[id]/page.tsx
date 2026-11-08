import { Metadata } from "next";
import { ListingDetailView } from "@/components/listings/listing-detail";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Lot Details | ${SITE_NAME}`,
};

// Next.js 16: route params arrive as a Promise.
export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetailView key={id} id={id} />;
}
