import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DisputeStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { DisputeOrderAction } from './dto/admin.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const admin = { id: 'admin-1', email: 'a@x.lk', role: 'ADMIN' as const };

describe('AdminService.resolveDispute', () => {
  let service: AdminService;
  let prisma: Record<string, any>;

  const disputeWith = (
    orderStatus: OrderStatus,
    paymentStatus: PaymentStatus | null,
    status: DisputeStatus = DisputeStatus.OPEN,
  ) => ({
    id: 'dispute-1',
    status,
    order: {
      id: 'order-1',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      status: orderStatus,
      payment: paymentStatus ? { id: 'pay-1', status: paymentStatus } : null,
    },
  });

  const resolve = (
    orderAction?: DisputeOrderAction,
    status: DisputeStatus = DisputeStatus.RESOLVED,
  ) =>
    service.resolveDispute(admin, 'dispute-1', {
      status,
      resolution: 'Reviewed the evidence',
      orderAction,
    });

  beforeEach(async () => {
    prisma = {
      dispute: { findUnique: jest.fn(), update: jest.fn() },
      order: { update: jest.fn() },
      payment: { update: jest.fn() },
      auditLog: { create: jest.fn() },
      $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: NotificationsService,
          useValue: { notifyMany: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();
    service = moduleRef.get(AdminService);
  });

  it('only records the outcome when no order action is given', async () => {
    prisma.dispute.findUnique.mockResolvedValue(
      disputeWith(OrderStatus.PAID, PaymentStatus.SUCCEEDED),
    );

    await resolve();

    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('cancels the order and refunds a succeeded payment for the buyer', async () => {
    prisma.dispute.findUnique.mockResolvedValue(
      disputeWith(OrderStatus.SHIPPED, PaymentStatus.SUCCEEDED),
    );

    await resolve(DisputeOrderAction.REFUND_BUYER);

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: OrderStatus.CANCELLED },
    });
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: { status: PaymentStatus.REFUNDED },
    });
  });

  it('does not mark an unpaid order as refunded', async () => {
    prisma.dispute.findUnique.mockResolvedValue(
      disputeWith(OrderStatus.PENDING, PaymentStatus.INITIATED),
    );

    await resolve(DisputeOrderAction.REFUND_BUYER);

    expect(prisma.order.update).toHaveBeenCalled();
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('completes the order when the seller wins', async () => {
    prisma.dispute.findUnique.mockResolvedValue(
      disputeWith(OrderStatus.SHIPPED, PaymentStatus.SUCCEEDED),
    );

    await resolve(DisputeOrderAction.COMPLETE_ORDER);

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: OrderStatus.COMPLETED },
    });
  });

  it('ignores the order action when the dispute is rejected', async () => {
    prisma.dispute.findUnique.mockResolvedValue(
      disputeWith(OrderStatus.PAID, PaymentStatus.SUCCEEDED),
    );

    await resolve(DisputeOrderAction.REFUND_BUYER, DisputeStatus.REJECTED);

    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('refuses to change an order that is already closed', async () => {
    prisma.dispute.findUnique.mockResolvedValue(
      disputeWith(OrderStatus.COMPLETED, PaymentStatus.SUCCEEDED),
    );

    await expect(resolve(DisputeOrderAction.REFUND_BUYER)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
