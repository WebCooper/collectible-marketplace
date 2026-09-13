import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AuctionStatus,
  BidStatus,
  ListingStatus,
  NotificationChannel,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuctionsService } from './auctions.service';

/**
 * Time drives auctions, not user requests: an auction whose closing time has
 * passed must be settled even if nobody happens to open the page. These jobs
 * do that.
 */
@Injectable()
export class AuctionsScheduler {
  private readonly logger = new Logger(AuctionsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auctions: AuctionsService,
    private readonly notifications: NotificationsService,
  ) {}

  /// Opens auctions whose start time has arrived.
  @Cron(CronExpression.EVERY_MINUTE)
  async openDueAuctions() {
    const result = await this.prisma.auction.updateMany({
      where: {
        status: AuctionStatus.SCHEDULED,
        startTime: { lte: new Date() },
        endTime: { gt: new Date() },
      },
      data: { status: AuctionStatus.ACTIVE },
    });

    if (result.count) {
      this.logger.log(`Opened ${result.count} auction(s)`);
    }
  }

  /**
   * Settles every auction whose closing time has passed.
   *
   * Runs every thirty seconds: the report treats auction closing as
   * time-critical, and a winner should not wait minutes to be told.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async closeExpiredAuctions() {
    const due = await this.prisma.auction.findMany({
      where: { status: AuctionStatus.ACTIVE, endTime: { lte: new Date() } },
      select: { id: true },
      take: 50,
    });

    for (const { id } of due) {
      try {
        await this.closeAuction(id);
      } catch (error) {
        // One auction that fails to settle must not stop the rest of the sweep.
        this.logger.error(
          `Failed to close auction ${id}: ${(error as Error).message}`,
        );
      }
    }
  }

  /**
   * Determines the winning bid and settles one auction (FR 2.1.5).
   *
   * The whole settlement is one transaction, and it re-checks the end time
   * inside that transaction. Two overlapping sweeps therefore cannot both
   * settle the same auction, and an auction extended by a last-second bid is
   * left alone rather than closed out from under the bidder.
   */
  async closeAuction(auctionId: string) {
    const settled = await this.prisma.$transaction(
      async (tx) => {
        const auction = await tx.auction.findUnique({
          where: { id: auctionId },
          include: {
            listing: { select: { id: true, title: true, sellerId: true } },
          },
        });

        if (
          !auction ||
          auction.status !== AuctionStatus.ACTIVE ||
          auction.endTime > new Date()
        ) {
          return null;
        }

        const topBid = await tx.bid.findFirst({
          where: { auctionId, status: BidStatus.ACTIVE },
          orderBy: [{ amount: 'desc' }, { placedAt: 'asc' }],
          include: { bidder: { select: { id: true, name: true } } },
        });

        if (topBid) {
          await tx.bid.update({
            where: { id: topBid.id },
            data: { status: BidStatus.WON },
          });
          await tx.bid.updateMany({
            where: { auctionId, status: { in: [BidStatus.ACTIVE, BidStatus.OUTBID] } },
            data: { status: BidStatus.LOST },
          });
        }

        const updated = await tx.auction.update({
          where: { id: auctionId },
          data: {
            status: AuctionStatus.ENDED,
            winnerId: topBid?.bidderId ?? null,
            currentPrice: topBid?.amount ?? auction.currentPrice,
          },
        });

        await tx.listing.update({
          where: { id: auction.listingId },
          data: {
            // An auction that drew no bids expires rather than selling, so the
            // seller can relist it.
            status: topBid ? ListingStatus.SOLD : ListingStatus.EXPIRED,
          },
        });

        await tx.auditLog.create({
          data: {
            action: 'AUCTION_CLOSED',
            entityType: 'Auction',
            entityId: auctionId,
            metadata: {
              winnerId: topBid?.bidderId ?? null,
              finalPrice: updated.currentPrice.toString(),
            },
          },
        });

        return {
          auction: updated,
          listing: auction.listing,
          winner: topBid?.bidder ?? null,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (!settled) return null;

    await this.auctions.announceClose(
      settled.auction.id,
      settled.listing.id,
      settled.listing.title,
      settled.listing.sellerId,
      settled.auction.currentPrice,
      settled.winner,
    );

    this.logger.log(
      `Closed auction ${auctionId} at LKR ${settled.auction.currentPrice.toString()}`,
    );
    return settled;
  }

  /**
   * Warns the seller and everyone still bidding that an auction closes within
   * the hour (FR 2.1.6 Auction Status Alerts).
   *
   * Runs every fifteen minutes and only picks up auctions entering the next
   * quarter-hour slice, so each auction triggers exactly one reminder.
   */
  @Cron('0 */15 * * * *')
  async sendEndingSoonAlerts() {
    const now = Date.now();
    const windowStart = new Date(now + 45 * 60 * 1000);
    const windowEnd = new Date(now + 60 * 60 * 1000);

    const closing = await this.prisma.auction.findMany({
      where: {
        status: AuctionStatus.ACTIVE,
        endTime: { gt: windowStart, lte: windowEnd },
      },
      select: {
        id: true,
        endTime: true,
        currentPrice: true,
        listing: { select: { id: true, title: true, sellerId: true } },
        bids: { select: { bidderId: true }, distinct: ['bidderId'] },
      },
    });

    for (const auction of closing) {
      const recipients = new Set<string>([
        auction.listing.sellerId,
        ...auction.bids.map((bid) => bid.bidderId),
      ]);

      await this.notifications.notifyMany(
        [...recipients].map((userId) => ({
          userId,
          type: NotificationType.AUCTION_ENDING,
          title: 'Auction closing soon',
          message: `"${auction.listing.title}" closes within the hour at LKR ${auction.currentPrice.toFixed(2)}.`,
          payload: { auctionId: auction.id, listingId: auction.listing.id },
        })),
        [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      );
    }

    if (closing.length) {
      this.logger.log(`Sent closing-soon alerts for ${closing.length} auction(s)`);
    }
  }
}
