import type { Metadata } from "next";
import { RequireAuth } from "@/components/shared/require-auth";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Notifications | ${SITE_NAME}` };

export default function Page() {
  return (
    <RequireAuth>
      <NotificationsList />
    </RequireAuth>
  );
}
