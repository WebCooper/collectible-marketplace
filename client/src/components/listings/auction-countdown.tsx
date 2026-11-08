"use client";

import { useCountdown } from "@/hooks/use-countdown";

/** "1d 4h 12m" style time remaining, ticking every second. */
export function AuctionCountdown({
  endTime,
  showSeconds = false,
  endedLabel = "Bidding closed",
}: {
  endTime: string;
  showSeconds?: boolean;
  endedLabel?: string;
}) {
  const t = useCountdown(endTime);
  if (t.isEnded) return <>{endedLabel}</>;

  const parts = [
    t.days > 0 ? `${t.days}d` : null,
    `${t.hours}h`,
    `${t.minutes}m`,
    showSeconds || (t.days === 0 && t.hours === 0) ? `${t.seconds}s` : null,
  ].filter(Boolean);

  return <>{parts.join(" ")}</>;
}
