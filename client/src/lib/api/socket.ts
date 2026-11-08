import { io, type Socket } from "socket.io-client";
import { AUCTIONS_SOCKET_URL } from "./config";
import type {
  AuctionClosedEvent,
  AuctionExtendedEvent,
  BidPlacedEvent,
} from "./types";

/**
 * Live bidding over Socket.IO (namespace `/auctions`).
 *
 * The socket is read-only: bids are always placed over REST
 * (`auctionsApi.placeBid`) and the server broadcasts the result here. Guests
 * may subscribe too. Events missed while disconnected are not replayed, so
 * subscribers get `onReconnect` to re-sync from `GET /auctions/:id`.
 */

export interface AuctionHandlers {
  onBid?: (event: BidPlacedEvent) => void;
  onExtended?: (event: AuctionExtendedEvent) => void;
  onClosed?: (event: AuctionClosedEvent) => void;
  /** Called after the socket reconnects; re-fetch state here. */
  onReconnect?: () => void;
}

let socket: Socket | null = null;
/** auctionId -> number of active subscribers in this tab */
const roomRefCounts = new Map<string, number>();

function getSocket(): Socket {
  if (socket) return socket;

  socket = io(AUCTIONS_SOCKET_URL, { withCredentials: true });

  // Rooms are server-side state tied to one connection, so join them again
  // every time a (re)connection is established.
  socket.on("connect", () => {
    for (const auctionId of roomRefCounts.keys()) {
      socket?.emit("auction:subscribe", { auctionId });
    }
  });

  return socket;
}

/** Watches one auction. Returns a function that stops watching. */
export function subscribeToAuction(
  auctionId: string,
  handlers: AuctionHandlers,
): () => void {
  const s = getSocket();

  const count = roomRefCounts.get(auctionId) ?? 0;
  roomRefCounts.set(auctionId, count + 1);
  if (count === 0 && s.connected) {
    s.emit("auction:subscribe", { auctionId });
  }

  // One socket serves every watched auction, so filter by id.
  const onBid = (e: BidPlacedEvent) => {
    if (e.auctionId === auctionId) handlers.onBid?.(e);
  };
  const onExtended = (e: AuctionExtendedEvent) => {
    if (e.auctionId === auctionId) handlers.onExtended?.(e);
  };
  const onClosed = (e: AuctionClosedEvent) => {
    if (e.auctionId === auctionId) handlers.onClosed?.(e);
  };
  const onReconnect = () => handlers.onReconnect?.();

  s.on("auction:bid", onBid);
  s.on("auction:extended", onExtended);
  s.on("auction:closed", onClosed);
  s.io.on("reconnect", onReconnect);

  return () => {
    s.off("auction:bid", onBid);
    s.off("auction:extended", onExtended);
    s.off("auction:closed", onClosed);
    s.io.off("reconnect", onReconnect);

    const remaining = (roomRefCounts.get(auctionId) ?? 1) - 1;
    if (remaining > 0) {
      roomRefCounts.set(auctionId, remaining);
      return;
    }
    roomRefCounts.delete(auctionId);
    if (s.connected) s.emit("auction:unsubscribe", { auctionId });
    if (roomRefCounts.size === 0) {
      s.disconnect();
      socket = null;
    }
  };
}
