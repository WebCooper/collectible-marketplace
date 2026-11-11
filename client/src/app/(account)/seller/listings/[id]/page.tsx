import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireAuth } from "@/components/shared/require-auth";
import { ManageListing } from "@/components/seller/manage-listing";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Manage Listing | ${SITE_NAME}` };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireAuth roles={["SELLER"]}>
      <Suspense>
        <ManageListing key={id} id={id} />
      </Suspense>
    </RequireAuth>
  );
}
