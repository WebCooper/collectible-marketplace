import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/// Events pushed to everyone watching an auction page.
export const AUCTION_EVENTS = {
  BID_PLACED: 'auction:bid',
  EXTENDED: 'auction:extended',
  CLOSED: 'auction:closed',
} as const;

export interface BidPlacedEvent {
  auctionId: string;
  currentPrice: string;
  bidCount: number;
  endTime: string;
  bidder: { id: string; name: string };
  placedAt: string;
}

export interface AuctionClosedEvent {
  auctionId: string;
  listingId: string;
  finalPrice: string;
  winner: { id: string; name: string } | null;
}

/**
 * Real-time channel for live bidding.
 *
 * Bids are *placed* over REST, where the validation and the transaction live;
 * this gateway only broadcasts what already happened. Keeping writes on one
 * path means there is a single place where bid rules are enforced.
 *
 * Clients join one room per auction, so a price update only reaches the people
 * actually watching that item rather than every connected browser.
 */
@WebSocketGateway({
  namespace: '/auctions',
  cors: {
    origin: (
      process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173'
    )
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  },
})
export class AuctionsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(AuctionsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`Socket connected: ${client.id}`);
  }

  /// Watching an auction is read-only, so guests may subscribe too - a visitor
  /// comparing prices should see the counter move without signing in.
  @SubscribeMessage('auction:subscribe')
  subscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string },
  ) {
    if (!data?.auctionId) return { error: 'auctionId is required' };
    void client.join(this.room(data.auctionId));
    return { subscribed: data.auctionId };
  }

  @SubscribeMessage('auction:unsubscribe')
  unsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string },
  ) {
    if (!data?.auctionId) return { error: 'auctionId is required' };
    void client.leave(this.room(data.auctionId));
    return { unsubscribed: data.auctionId };
  }

  broadcastBid(event: BidPlacedEvent) {
    this.server
      ?.to(this.room(event.auctionId))
      .emit(AUCTION_EVENTS.BID_PLACED, event);
  }

  broadcastExtension(auctionId: string, endTime: Date) {
    this.server?.to(this.room(auctionId)).emit(AUCTION_EVENTS.EXTENDED, {
      auctionId,
      endTime: endTime.toISOString(),
    });
  }

  broadcastClose(event: AuctionClosedEvent) {
    this.server
      ?.to(this.room(event.auctionId))
      .emit(AUCTION_EVENTS.CLOSED, event);
  }

  private room(auctionId: string) {
    return `auction:${auctionId}`;
  }
}
