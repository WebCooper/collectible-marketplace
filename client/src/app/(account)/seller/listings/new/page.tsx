import type { Metadata } from "next";
import { RequireAuth } from "@/components/shared/require-auth";
import { ListingForm } from "@/components/seller/listing-form";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `New Listing | ${SITE_NAME}` };

export default function Page() {
  return (
    <RequireAuth roles={["SELLER"]}>
      <PageContainer>
        <PageHeader
          title="Create a listing"
          description="Every new listing is reviewed by an appraiser before it goes live."
        />
        <div className="max-w-3xl">
          <ListingForm />
        </div>
      </PageContainer>
    </RequireAuth>
  );
}
