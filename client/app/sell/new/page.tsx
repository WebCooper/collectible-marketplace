"use client";

import { useRouter } from "next/navigation";
import { EMPTY_LISTING, ListingForm, toListingInput } from "@/components/ListingForm";
import { RequireAuth } from "@/components/RequireAuth";
import { BackLink, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";

export default function NewListingPage() {
  const router = useRouter();
  const toast = useToast();

  return (
    <RequireAuth roles={["SELLER"]}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <BackLink href="/sell">Seller dashboard</BackLink>
        <PageHeader title="List an item" subtitle="New listings are reviewed by an expert appraiser before they go live." />
        <div className="animate-fade-up">
          <ListingForm
            initial={EMPTY_LISTING}
            submitLabel="Submit for review"
            withCertificates
            onSubmit={async (values) => {
              const listing = await api.listings.create(toListingInput(values));
              toast("Listing submitted for review.");
              router.push(`/sell/${listing.id}`);
            }}
          />
        </div>
      </div>
    </RequireAuth>
  );
}
