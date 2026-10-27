import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  ListingStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { OrdersService } from './orders.service';
import { PAYMENT_GATEWAY } from './payments/payment-gateway';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

function paymentFixture(auctionId: string | null = null) {
  return {
    id: 'pay-1',
    orderId: 'order-1',
    status: PaymentStatus.INITIATED,
    amount: new Prisma.Decimal(25000),
    transactionRef: 'ref-1',
    order: {
      id: 'order-1',
      listingId: 'listing-1',
      auctionId,
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      listing: { title: 'Ceylon 5 Rupee' },
    },
  };
}

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: Record<string, any>;
  let gateway: { provider: string; verifyCallback: jest.Mock };

  beforeEach(async () => {
    prisma = {
      payment: { findUnique: jest.fn(), update: jest.fn() },
      order: { update: jest.fn(), findUnique: jest.fn() },
      listing: { update: jest.fn() },
      auditLog: { create: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    gateway = { provider: 'test', verifyCallback: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: NotificationsService,
          useValue: { notifyUser: jest.fn().mockResolvedValue({}) },
        },
        { provide: PAYMENT_GATEWAY, useValue: gateway },
      ],
    }).compile();
    service = moduleRef.get(OrdersService);
  });

  describe('handlePaymentCallback', () => {
    const callback = (overrides: Record<string, unknown> = {}) => ({
      transactionRef: 'ref-1',
      succeeded: true,
      amount: 25000,
      rawPayload: {},
      ...overrides,
    });

    it('rejects a successful callback whose amount differs from the order', async () => {
      gateway.verifyCallback.mockReturnValue(callback({ amount: 1 }));
      prisma.payment.findUnique.mockResolvedValue(paymentFixture());

      await expect(service.handlePaymentCallback({}, {})).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('accepts a callback that carries no amount', async () => {
      gateway.verifyCallback.mockReturnValue(callback({ amount: null }));
      prisma.payment.findUnique.mockResolvedValue(paymentFixture());

      await expect(service.handlePaymentCallback({}, {})).resolves.toEqual({
        status: PaymentStatus.SUCCEEDED,
      });
    });

    it('cancels the order and relists a fixed-price item when payment fails', async () => {
      gateway.verifyCallback.mockReturnValue(callback({ succeeded: false }));
      prisma.payment.findUnique.mockResolvedValue(paymentFixture());

      await service.handlePaymentCallback({}, {});

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: OrderStatus.CANCELLED },
        }),
      );
      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { status: ListingStatus.ACTIVE },
      });
    });

    it('leaves an auction item sold when its payment fails', async () => {
      gateway.verifyCallback.mockReturnValue(callback({ succeeded: false }));
      prisma.payment.findUnique.mockResolvedValue(paymentFixture('auction-1'));

      await service.handlePaymentCallback({}, {});

      expect(prisma.listing.update).not.toHaveBeenCalled();
    });

    it('does nothing for a callback that was already processed', async () => {
      gateway.verifyCallback.mockReturnValue(callback());
      prisma.payment.findUnique.mockResolvedValue({
        ...paymentFixture(),
        status: PaymentStatus.SUCCEEDED,
      });

      await expect(service.handlePaymentCallback({}, {})).resolves.toEqual({
        status: PaymentStatus.SUCCEEDED,
        alreadyProcessed: true,
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('checkout', () => {
    const buyer = { id: 'buyer-1', email: 'b@x.lk', role: 'BUYER' as const };
    const conflict = () =>
      new Prisma.PrismaClientKnownRequestError('conflict', {
        code: 'P2034',
        clientVersion: 'test',
      });

    it('retries a serialization conflict and reports the item as taken', async () => {
      // First attempt aborts; the retry sees the item already sold.
      prisma.$transaction
        .mockRejectedValueOnce(conflict())
        .mockRejectedValueOnce(
          new BadRequestException('This listing is no longer available'),
        );

      await expect(
        service.checkout(buyer, { listingId: 'listing-1' } as never),
      ).rejects.toThrow('This listing is no longer available');
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });

    it('gives up after three conflicting attempts', async () => {
      prisma.$transaction.mockRejectedValue(conflict());

      await expect(
        service.checkout(buyer, { listingId: 'listing-1' } as never),
      ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    });
  });

  describe('updateStatus', () => {
    const admin = { id: 'admin-1', email: 'a@x.lk', role: 'ADMIN' as const };
    const orderRow = (auctionId: string | null) => ({
      id: 'order-1',
      status: OrderStatus.PENDING,
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      listingId: 'listing-1',
      auctionId,
    });

    beforeEach(() => {
      prisma.order.update.mockResolvedValue({ listing: { title: 'x' } });
    });

    it('relists the item when a fixed-price order is cancelled', async () => {
      prisma.order.findUnique.mockResolvedValue(orderRow(null));

      await service.updateStatus(admin, 'order-1', {
        status: OrderStatus.CANCELLED,
      });

      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { status: ListingStatus.ACTIVE },
      });
    });

    it('keeps an auction item sold when its order is cancelled', async () => {
      prisma.order.findUnique.mockResolvedValue(orderRow('auction-1'));

      await service.updateStatus(admin, 'order-1', {
        status: OrderStatus.CANCELLED,
      });

      expect(prisma.listing.update).not.toHaveBeenCalled();
    });
  });
});
