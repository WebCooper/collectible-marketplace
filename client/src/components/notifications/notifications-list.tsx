"use client";

import { useState } from "react";
import Link from "next/link";
import { errorMessage, notificationsApi, type Notification } from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { notificationHref } from "@/lib/notification-link";
import { formatDateTime } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { NOTIFICATIONS_CHANGED_EVENT } from "./notification-bell";

/** In-app notification inbox with mark-read and mark-all-read. */
export function NotificationsList() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, error, loading, reload } = useApiQuery(`notifications:${page}:${unreadOnly}`, () =>
    notificationsApi.list({ page, limit: 15, unreadOnly: unreadOnly || undefined }),
  );

  const changed = () => {
    reload();
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  };

  const markRead = async (notification: Notification) => {
    if (notification.readStatus) return;
    try {
      await notificationsApi.markRead(notification.id);
      changed();
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      changed();
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Notifications"
        description="Outbid alerts, auction results, order updates and moderation decisions."
        action={
          <div className="flex gap-2">
            <Button variant={unreadOnly ? "default" : "outline"} size="sm" onClick={() => { setUnreadOnly(!unreadOnly); setPage(1); }}>
              Unread only
            </Button>
            <Button variant="outline" size="sm" onClick={markAll}>Mark all read</Button>
          </div>
        }
      />
      {(error !== undefined || actionError) && <Alert variant="error">{actionError ?? errorMessage(error)}</Alert>}
      {loading && !data && <div className="h-40 rounded-md bg-surface animate-pulse" />}
      {data && data.data.length === 0 && (
        <p className="rounded-md border border-dashed border-line p-10 text-center text-sm text-muted-foreground">
          {unreadOnly ? "Nothing unread." : "No notifications yet."}
        </p>
      )}
      <ul className="space-y-2">
        {data?.data.map((n) => {
          const href = notificationHref(n);
          return (
            <li key={n.id} className={`rounded-md border p-4 ${n.readStatus ? "border-line bg-white" : "border-ink/30 bg-surface"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {!n.readStatus && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-live align-middle" aria-label="Unread" />}
                    {n.title}
                  </p>
                  <p className="text-sm text-ink-soft">{n.message}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(n.sentAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {href && (
                    <Link href={href} onClick={() => void markRead(n)} className="text-xs font-medium underline underline-offset-2">
                      Open
                    </Link>
                  )}
                  {!n.readStatus && (
                    <button onClick={() => void markRead(n)} className="text-xs text-muted-foreground hover:text-ink cursor-pointer">
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <Pagination meta={data?.meta} onPage={setPage} />
    </PageContainer>
  );
}
