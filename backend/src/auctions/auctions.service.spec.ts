import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  AuctionStatus,
  BidStatus,
  ListingStatus,
  Prisma,
} from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsGateway } from './auctions.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ListingsService } from '../listings/listings.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

const bidder: AuthenticatedUser = {
  id: 'buyer-1',
  email: 'buyer@marketplace.lk',
  role: 'BUYER',
};

/// Minimal stand-in for an auction row as placeBid loads it.
function auctionFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'auction-1',
    listingId: 'listing-1',
    startPrice: new Prisma.Decimal(10000),
    minIncrement: new Prisma.Decimal(500),
    currentPrice: new Prisma.Decimal(10000),
    buyNowPrice: new Prisma.Decimal(50000),
    startTime: new Date(Date.now() - 60_000),
    endTime: new Date(Date.now() + 60 * 60_000),
    status: AuctionStatus.ACTIVE,
    bidCount: 0,
    extensionCount: 0,
    listing: { id: 'listing-1', title: 'Ceylon 5 Rupee', sellerId: 'seller-1' },
    bids: [] as { id: string; bidderId: string; amount: Prisma.Decimal }[],
    ...overrides,
  };
}

describe('AuctionsService', () => {
  let service: AuctionsService;
  let tx: {
    auction: { findUnique: jest.Mock; update: jest.Mock };
    bid: { create: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    listing: { update: jest.Mock };
  };
  let gateway: {
    broadcastBid: jest.Mock;
    broadcastExtension: jest.Mock;
    broadcastClose: jest.Mock;
  };
  let notifications: { notifyUser: jest.Mock };

  beforeEach(async () => {
    tx = {
      auction: {
        findUnique: jest.fn(),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...auctionFixture(),
            currentPrice: data.currentPrice ?? new Prisma.Decimal(10000),
            endTime: data.endTime ?? new Date(Date.now() + 60 * 60_000),
            bidCount: 1,
          }),
        ),
      },
      bid: {
        create: jest.fn().mockResolvedValue({
          id: 'bid-1',
          placedAt: new Date(),
          bidder: { id: bidder.id, name: 'Kamala' },
        }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      listing: { update: jest.fn().mockResolvedValue({}) },
    };

    const prisma = {
      // Hand the callback our mock transaction client.
      $transaction: jest.fn((callback: (client: unknown) => unknown) =>
        typeof callback === 'function' ? callback(tx) : Promise.resolve([]),
      ),
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: bidder.id, name: 'Kamala' }),
      },
    };

    gateway = {
      broadcastBid: jest.fn(),
      broadcastExtension: jest.fn(),
      broadcastClose: jest.fn(),
    };
    notifications = { notifyUser: jest.fn().mockResolvedValue({}) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuctionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ListingsService, useValue: { findOwned: jest.fn() } },
        { provide: NotificationsService, useValue: notifications },
        { provide: AuctionsGateway, useValue: gateway },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'AUCTION_ANTI_SNIPE_WINDOW_SECONDS' ||
              key === 'AUCTION_ANTI_SNIPE_EXTENSION_SECONDS'
                ? 120
                : undefined,
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuctionsService);
  });

  describe('placeBid', () => {
    it('accepts a first bid at the opening price', async () => {
      tx.auction.findUnique.mockResolvedValue(auctionFixture());

      await service.placeBid(bidder, 'auction-1', { amount: 10000 });

      expect(tx.bid.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ bidderId: bidder.id }),
        }),
      );
    });

    it('rejects a bid below the current price plus the minimum increment', async () => {
      tx.auction.findUnique.mockResolvedValue(
        auctionFixture({
          currentPrice: new Prisma.Decimal(12000),
          bids: [
            {
              id: 'bid-0',
              bidderId: 'buyer-2',
              amount: new Prisma.Decimal(12000),
            },
          ],
        }),
      );

      // 12,000 + 500 = 12,500 is the floor, so 12,400 must be refused.
      await expect(
        service.placeBid(bidder, 'auction-1', { amount: 12400 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.bid.create).not.toHaveBeenCalled();
    });

    it('rejects a bid placed after the auction closed', async () => {
      tx.auction.findUnique.mockResolvedValue(
        auctionFixture({ endTime: new Date(Date.now() - 1000) }),
      );

      await expect(
        service.placeBid(bidder, 'auction-1', { amount: 99999 }),
      ).rejects.toThrow('This auction has already closed');
    });

    it('refuses to let a seller bid on their own item', async () => {
      tx.auction.findUnique.mockResolvedValue(
        auctionFixture({
          listing: {
            id: 'listing-1',
            title: 'Ceylon 5 Rupee',
            sellerId: bidder.id,
          },
        }),
      );

      await expect(
        service.placeBid(bidder, 'auction-1', { amount: 20000 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuses to let the top bidder raise their own bid', async () => {
      tx.auction.findUnique.mockResolvedValue(
        auctionFixture({
          currentPrice: new Prisma.Decimal(12000),
          bids: [
            {
              id: 'bid-0',
              bidderId: bidder.id,
              amount: new Prisma.Decimal(12000),
            },
          ],
        }),
      );

      await expect(
        service.placeBid(bidder, 'auction-1', { amount: 15000 }),
      ).rejects.toThrow('You already hold the highest bid');
    });

    it('marks the previous top bid as outbid and notifies that bidder', async () => {
      tx.auction.findUnique.mockResolvedValue(
        auctionFixture({
          currentPrice: new Prisma.Decimal(12000),
          bids: [
            {
              id: 'bid-0',
              bidderId: 'buyer-2',
              amount: new Prisma.Decimal(12000),
            },
          ],
        }),
      );

      await service.placeBid(bidder, 'auction-1', { amount: 13000 });

      expect(tx.bid.update).toHaveBeenCalledWith({
        where: { id: 'bid-0' },
        data: { status: BidStatus.OUTBID },
      });
      expect(notifications.notifyUser).toHaveBeenCalledWith(
        'buyer-2',
        expect.anything(),
        'You have been outbid',
        expect.any(String),
        expect.anything(),
        expect.anything(),
      );
    });

    it('extends the closing time when a bid lands inside the anti-snipe window', async () => {
      const endTime = new Date(Date.now() + 30_000); // 30s left, window is 120s
      tx.auction.findUnique.mockResolvedValue(auctionFixture({ endTime }));

      await service.placeBid(bidder, 'auction-1', { amount: 10000 });

      const update = tx.auction.update.mock.calls[0][0];
      expect(update.data.endTime.getTime()).toBeGreaterThan(endTime.getTime());
      expect(update.data.extensionCount).toEqual({ increment: 1 });
      expect(gateway.broadcastExtension).toHaveBeenCalled();
    });

    it('leaves the closing time alone for a bid well before the close', async () => {
      const endTime = new Date(Date.now() + 60 * 60_000);
      tx.auction.findUnique.mockResolvedValue(auctionFixture({ endTime }));

      await service.placeBid(bidder, 'auction-1', { amount: 10000 });

      const update = tx.auction.update.mock.calls[0][0];
      expect(update.data.endTime).toEqual(endTime);
      expect(update.data.extensionCount).toBeUndefined();
      expect(gateway.broadcastExtension).not.toHaveBeenCalled();
    });

    it('broadcasts the new price to everyone watching the auction', async () => {
      tx.auction.findUnique.mockResolvedValue(auctionFixture());

      await service.placeBid(bidder, 'auction-1', { amount: 10000 });

      expect(gateway.broadcastBid).toHaveBeenCalledWith(
        expect.objectContaining({ auctionId: 'auction-1', bidCount: 1 }),
      );
    });

    it('reports a missing auction rather than failing silently', async () => {
      tx.auction.findUnique.mockResolvedValue(null);

      await expect(
        service.placeBid(bidder, 'missing', { amount: 10000 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('buyNow', () => {
    it('ends the auction, names the winner and marks the listing sold', async () => {
      tx.auction.findUnique.mockResolvedValue(auctionFixture());
      tx.auction.update.mockResolvedValue({
        ...auctionFixture(),
        status: AuctionStatus.ENDED,
        winnerId: bidder.id,
        currentPrice: new Prisma.Decimal(50000),
      });

      await service.buyNow(bidder, 'auction-1');

      expect(tx.auction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: AuctionStatus.ENDED,
            winnerId: bidder.id,
          }),
        }),
      );
      expect(tx.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { status: ListingStatus.SOLD },
      });
      expect(gateway.broadcastClose).toHaveBeenCalled();
    });

    it('refuses Buy Now once bidding has passed that price', async () => {
      tx.auction.findUnique.mockResolvedValue(
        auctionFixture({ currentPrice: new Prisma.Decimal(50000) }),
      );

      await expect(service.buyNow(bidder, 'auction-1')).rejects.toThrow(
        'Bidding has already passed the Buy Now price',
      );
    });

    it('refuses Buy Now when the auction does not offer one', async () => {
      tx.auction.findUnique.mockResolvedValue(
        auctionFixture({ buyNowPrice: null }),
      );

      await expect(service.buyNow(bidder, 'auction-1')).rejects.toThrow(
        'This auction does not offer a Buy Now price',
      );
    });
  });
});
