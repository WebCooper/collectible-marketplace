import type { Metadata } from "next";
import { RequireAuth } from "@/components/shared/require-auth";
import { AccountSettings } from "@/components/account/account-settings";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `My Account | ${SITE_NAME}` };

export default function Page() {
  return (
    <RequireAuth>
      <AccountSettings />
    </RequireAuth>
  );
}
