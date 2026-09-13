import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuctionStatus,
  BidStatus,
  ListingStatus,
  ListingType,
  NotificationChannel,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ListingsService } from '../listings/listings.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AuctionsGateway } from './auctions.gateway';
import { CreateAuctionDto, PlaceBidDto } from './dto/auction.dto';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly listings: ListingsService,
    private readonly notifications: NotificationsService,
    private readonly gateway: AuctionsGateway,
  ) {}

  // --- Seller: configure the auction --------------------------------------

  async create(user: AuthenticatedUser, listingId: string, dto: CreateAuctionDto) {
    const listing = await this.listings.findOwned(user, listingId);

    const existing = await this.prisma.auction.findUnique({
      where: { listingId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('This listing already has an auction');
    }

    const startTime = dto.startTime ? new Date(dto.startTime) : new Date();
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('The auction must close after it opens');
    }
    if (endTime <= new Date()) {
      throw new BadRequestException('The closing time must be in the future');
    }
    if (dto.buyNowPrice !== undefined && dto.buyNowPrice <= dto.startPrice) {
      throw new BadRequestException(
        'The Buy Now price must be above the opening price',
      );
    }

    const [auction] = await this.prisma.$transaction([
      this.prisma.auction.create({
        data: {
          listingId,
          startPrice: new Prisma.Decimal(dto.startPrice),
          minIncrement: new Prisma.Decimal(dto.minIncrement),
          currentPrice: new Prisma.Decimal(dto.startPrice),
          buyNowPrice:
            dto.buyNowPrice !== undefined
              ? new Prisma.Decimal(dto.buyNowPrice)
              : undefined,
          startTime,
          endTime,
          status:
            startTime <= new Date()
              ? AuctionStatus.ACTIVE
              : AuctionStatus.SCHEDULED,
        },
      }),
      this.prisma.listing.update({
        where: { id: listingId },
        data: {
          listingType: ListingType.AUCTION,
          startingPrice: new Prisma.Decimal(dto.startPrice),
        },
      }),
    ]);

    this.logger.log(
      `Auction ${auction.id} created for listing "${listing.title}"`,
    );
    return auction;
  }

  // --- Bidding ------------------------------------------------------------

  /**
   * Places a bid.
   *
   * The read of the current price and the write of the new one happen inside a
   * single serializable transaction. Without that, two bidders submitting at
   * the same moment could both read the same current price and both be
   * accepted, leaving two people believing they hold the top bid. Postgres
   * aborts one of the two conflicting transactions instead, and we retry it so
   * the loser is simply re-validated against the newer price.
   */
  async placeBid(user: AuthenticatedUser, auctionId: string, dto: PlaceBidDto) {
    const result = await this.runSerializable(() =>
      this.prisma.$transaction(
        async (tx) => {
          const auction = await tx.auction.findUnique({
            where: { id: auctionId },
            include: {
              listing: { select: { id: true, title: true, sellerId: true } },
              bids: {
                where: { status: BidStatus.ACTIVE },
                orderBy: { amount: 'desc' },
                take: 1,
                select: { id: true, bidderId: true, amount: true },
              },
            },
          });

          if (!auction) throw new NotFoundException('Auction not found');
          if (auction.listing.sellerId === user.id) {
            throw new ForbiddenException('A seller cannot bid on their own item');
          }

          const now = new Date();
          if (auction.status !== AuctionStatus.ACTIVE || auction.startTime > now) {
            throw new BadRequestException('This auction is not open for bidding');
          }
          // Bids arriving after the close are rejected outright (FR 2.1.5).
          if (auction.endTime <= now) {
            throw new BadRequestException('This auction has already closed');
          }

          const amount = new Prisma.Decimal(dto.amount);
          const previousTop = auction.bids[0];

          // The first bid may match the opening price; every later bid must
          // clear the current price by at least the minimum increment.
          const minimumAcceptable = previousTop
            ? auction.currentPrice.plus(auction.minIncrement)
            : auction.startPrice;

          if (amount.lessThan(minimumAcceptable)) {
            throw new BadRequestException(
              `The next bid must be at least LKR ${minimumAcceptable.toFixed(2)}`,
            );
          }
          if (previousTop?.bidderId === user.id) {
            throw new BadRequestException('You already hold the highest bid');
          }

          // Anti-snipe: a bid in the closing moments pushes the end time out,
          // so nobody can win by simply out-waiting the clock (FR 2.1.5).
          const windowSeconds = Number(
            this.config.get('AUCTION_ANTI_SNIPE_WINDOW_SECONDS') ?? 120,
          );
          const extensionSeconds = Number(
            this.config.get('AUCTION_ANTI_SNIPE_EXTENSION_SECONDS') ?? 120,
          );
          const msRemaining = auction.endTime.getTime() - now.getTime();
          const extended = msRemaining <= windowSeconds * 1000;
          const endTime = extended
            ? new Date(now.getTime() + extensionSeconds * 1000)
            : auction.endTime;

          if (previousTop) {
            await tx.bid.update({
              where: { id: previousTop.id },
              data: { status: BidStatus.OUTBID },
            });
          }

          const bid = await tx.bid.create({
            data: { auctionId, bidderId: user.id, amount },
            include: { bidder: { select: { id: true, name: true } } },
          });

          const updated = await tx.auction.update({
            where: { id: auctionId },
            data: {
              currentPrice: amount,
              bidCount: { increment: 1 },
              endTime,
              extensionCount: extended ? { increment: 1 } : undefined,
            },
          });

          return { bid, auction: updated, previousTop, extended, listing: auction.listing };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );

    // Everything below is side-effect work: it must not hold the transaction
    // open, and a failure here must not undo an accepted bid.
    this.gateway.broadcastBid({
      auctionId,
      currentPrice: result.auction.currentPrice.toString(),
      bidCount: result.auction.bidCount,
      endTime: result.auction.endTime.toISOString(),
      bidder: result.bid.bidder,
      placedAt: result.bid.placedAt.toISOString(),
    });

    if (result.extended) {
      this.gateway.broadcastExtension(auctionId, result.auction.endTime);
    }

    if (result.previousTop) {
      void this.notifications.notifyUser(
        result.previousTop.bidderId,
        NotificationType.OUTBID,
        'You have been outbid',
        `Someone has bid LKR ${result.auction.currentPrice.toFixed(2)} on "${result.listing.title}".`,
        { auctionId, listingId: result.listing.id },
        [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      );
    }

    return result.bid;
  }

  /**
   * Buy It Now: ends the auction immediately at the fixed price (FR 2.1.5).
   * The buyer becomes the winner and completes checkout like any other winner.
   */
  async buyNow(user: AuthenticatedUser, auctionId: string) {
    const result = await this.runSerializable(() =>
      this.prisma.$transaction(
        async (tx) => {
          const auction = await tx.auction.findUnique({
            where: { id: auctionId },
            include: {
              listing: { select: { id: true, title: true, sellerId: true } },
            },
          });

          if (!auction) throw new NotFoundException('Auction not found');
          if (!auction.buyNowPrice) {
            throw new BadRequestException(
              'This auction does not offer a Buy Now price',
            );
          }
          if (auction.listing.sellerId === user.id) {
            throw new ForbiddenException('A seller cannot buy their own item');
          }
          if (auction.status !== AuctionStatus.ACTIVE) {
            throw new BadRequestException('This auction is not open');
          }
          if (auction.currentPrice.greaterThanOrEqualTo(auction.buyNowPrice)) {
            throw new BadRequestException(
              'Bidding has already passed the Buy Now price',
            );
          }

          const bid = await tx.bid.create({
            data: {
              auctionId,
              bidderId: user.id,
              amount: auction.buyNowPrice,
              status: BidStatus.WON,
            },
          });

          await tx.bid.updateMany({
            where: { auctionId, status: BidStatus.ACTIVE },
            data: { status: BidStatus.LOST },
          });

          const updated = await tx.auction.update({
            where: { id: auctionId },
            data: {
              currentPrice: auction.buyNowPrice,
              bidCount: { increment: 1 },
              status: AuctionStatus.ENDED,
              winnerId: user.id,
              endTime: new Date(),
            },
          });

          await tx.listing.update({
            where: { id: auction.listingId },
            data: { status: ListingStatus.SOLD },
          });

          return { auction: updated, bid, listing: auction.listing };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );

    const buyer = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true },
    });

    await this.announceClose(
      result.auction.id,
      result.listing.id,
      result.listing.title,
      result.listing.sellerId,
      result.auction.currentPrice,
      buyer,
    );

    return result.auction;
  }

  // --- Reading ------------------------------------------------------------

  async findOne(auctionId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        listing: {
          select: { id: true, title: true, sellerId: true, status: true },
        },
        winner: { select: { id: true, name: true } },
      },
    });
    if (!auction) throw new NotFoundException('Auction not found');
    return auction;
  }

  /// Bidding history for one auction (FR 2.1.5). Bidder names are shown to the
  /// seller and to the people bidding, which is what the requirement asks for.
  async bidHistory(auctionId: string, pagination: PaginationDto) {
    const where = { auctionId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.bid.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        select: {
          id: true,
          amount: true,
          status: true,
          placedAt: true,
          bidder: { select: { id: true, name: true } },
        },
      }),
      this.prisma.bid.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  /// Every auction the buyer has bid on, for their dashboard.
  async myBids(userId: string, pagination: PaginationDto) {
    const where = { bidderId: userId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.bid.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          auction: {
            select: {
              id: true,
              currentPrice: true,
              endTime: true,
              status: true,
              winnerId: true,
              listing: { select: { id: true, title: true } },
            },
          },
        },
      }),
      this.prisma.bid.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  // --- Helpers ------------------------------------------------------------

  /**
   * Retries a serializable transaction that Postgres aborted because it
   * conflicted with a concurrent one (Prisma P2034). This is expected under the
   * bid volume the report predicts in an auction's closing moments, and is not
   * an error the bidder should ever see.
   */
  private async runSerializable<T>(operation: () => Promise<T>): Promise<T> {
    const maxAttempts = 3;
    for (let attempt = 1; ; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isWriteConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2034' || error.code === 'P2002');
        if (!isWriteConflict || attempt >= maxAttempts) throw error;
        this.logger.warn(
          `Write conflict on attempt ${attempt}, retrying bid transaction`,
        );
        await new Promise((resolve) => setTimeout(resolve, 25 * attempt));
      }
    }
  }

  async announceClose(
    auctionId: string,
    listingId: string,
    listingTitle: string,
    sellerId: string,
    finalPrice: Prisma.Decimal,
    winner: { id: string; name: string } | null,
  ) {
    this.gateway.broadcastClose({
      auctionId,
      listingId,
      finalPrice: finalPrice.toString(),
      winner,
    });

    const alerts: Promise<unknown>[] = [
      this.notifications.notifyUser(
        sellerId,
        NotificationType.AUCTION_CLOSED,
        'Your auction has closed',
        winner
          ? `"${listingTitle}" sold for LKR ${finalPrice.toFixed(2)}.`
          : `"${listingTitle}" closed without any bids.`,
        { auctionId, listingId },
      ),
    ];

    if (winner) {
      alerts.push(
        this.notifications.notifyUser(
          winner.id,
          NotificationType.AUCTION_WON,
          'You won the auction',
          `You won "${listingTitle}" for LKR ${finalPrice.toFixed(2)}. Complete checkout to secure the item.`,
          { auctionId, listingId },
          [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        ),
      );
    }

    await Promise.all(alerts);
  }
}
