"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeToAuction } from "@/lib/api/socket";
import type { AuctionStatus, BidPlacedEvent, Money, UserRef } from "@/lib/api";

export interface LiveAuctionFields {
  id: string;
  currentPrice: Money;
  bidCount: number;
  endTime: string;
  status: AuctionStatus;
}

export interface LiveAuctionState extends LiveAuctionFields {
  /** Set once the auction:closed event arrives. */
  winner?: UserRef | null;
  lastBid?: BidPlacedEvent;
}

/**
 * Keeps an auction's price, bid count and closing time current by listening
 * to the /auctions Socket.IO namespace. `initial` is the state fetched over
 * REST; whenever a fresh object is passed (after a re-fetch) it replaces the
 * live state. `onEvent` fires after every live event so callers can refresh
 * related data such as the bid history.
 */
export function useLiveAuction<T extends LiveAuctionFields>(
  initial: T | null,
  options: { onEvent?: () => void; onReconnect?: () => void } = {},
): (T & LiveAuctionState) | null {
  const [state, setState] = useState<(T & LiveAuctionState) | null>(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    // A new REST snapshot supersedes whatever the socket told us.
    setPrevInitial(initial);
    setState(initial);
  }

  // Latest callbacks without re-subscribing on every render.
  const callbacks = useRef(options);
  useEffect(() => {
    callbacks.current = options;
  });

  const auctionId = initial?.id;
  const watchable = initial?.status === "ACTIVE" || initial?.status === "SCHEDULED";

  useEffect(() => {
    if (!auctionId || !watchable) return;

    return subscribeToAuction(auctionId, {
      onBid: (event) => {
        setState((prev) =>
          prev && {
            ...prev,
            currentPrice: event.currentPrice,
            bidCount: event.bidCount,
            endTime: event.endTime,
            status: "ACTIVE",
            lastBid: event,
          },
        );
        callbacks.current.onEvent?.();
      },
      onExtended: (event) => {
        setState((prev) => prev && { ...prev, endTime: event.endTime });
        callbacks.current.onEvent?.();
      },
      onClosed: (event) => {
        setState(
          (prev) =>
            prev && {
              ...prev,
              status: "ENDED",
              currentPrice: event.finalPrice,
              winner: event.winner,
            },
        );
        callbacks.current.onEvent?.();
      },
      onReconnect: () => callbacks.current.onReconnect?.(),
    });
  }, [auctionId, watchable]);

  return state;
}
