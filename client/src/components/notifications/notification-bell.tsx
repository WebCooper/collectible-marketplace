"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { notificationsApi } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

const POLL_MS = 60_000;
export const NOTIFICATIONS_CHANGED_EVENT = "lankanumis:notifications-changed";

/** Navbar bell with the unread count (GET /notifications/unread-count). */
export function NotificationBell() {
  const { status } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    const refresh = () => {
      notificationsApi
        .unreadCount()
        .then((result) => active && setCount(result.count))
        .catch(() => {
          /* a failed poll just keeps the last count */
        });
    };
    refresh();
    const timer = window.setInterval(refresh, POLL_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, [status]);

  if (status !== "authenticated") return null;

  return (
    <Link
      href="/notifications"
      aria-label={count ? `Notifications, ${count} unread` : "Notifications"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-surface hover:text-ink transition-colors"
    >
      <Bell className="h-4.5 w-4.5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-live px-1 text-center text-[10px] font-semibold leading-4 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
