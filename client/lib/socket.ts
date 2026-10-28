import { io, type Socket } from "socket.io-client";
import { API_URL } from "./api";

export interface BidEvent {
  auctionId: string;
  currentPrice: string;
  bidCount: number;
  endTime: string;
  bidder: { id: string; name: string };
  placedAt: string;
}

export interface ExtendedEvent {
  auctionId: string;
  endTime: string;
}

export interface ClosedEvent {
  auctionId: string;
  listingId: string;
  finalPrice: string;
  winner: { id: string; name: string } | null;
}

let socket: Socket | null = null;

/** One shared connection to the /auctions namespace for the whole tab. */
export function auctionSocket() {
  socket ??= io(`${API_URL}/auctions`, {
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
  return socket;
}
