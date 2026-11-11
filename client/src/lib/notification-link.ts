import type { Notification } from "@/lib/api";

/** Where a notification should take the user, from the IDs in its payload. */
export function notificationHref(notification: Pick<Notification, "payload">): string | null {
  const payload = notification.payload;
  if (!payload) return null;
  if (payload.orderId) return `/orders/${payload.orderId}`;
  if (payload.listingId) return `/listings/${payload.listingId}`;
  return null;
}
