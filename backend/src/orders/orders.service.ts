import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AuctionStatus,
  DisputeStatus,
  ListingStatus,
  ListingType,
  NotificationChannel,
  NotificationType,
  OrderStatus,
  PaymentStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  CheckoutDto,
  ListOrdersDto,
  RaiseDisputeDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import { PAYMENT_GATEWAY } from './payments/payment-gateway';
import type { PaymentGateway } from './payments/payment-gateway';

/// The only transitions an order may make. Anything else is rejected, so an
/// order can never jump from Pending straight to Completed.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  // --- Checkout -----------------------------------------------------------

  /**
   * Creates the order and starts the payment (FR 2.1.7).
   *
   * Two routes in: a buyer who won an auction, or a buyer taking a fixed-price
   * listing. Both are resolved to a listing, a seller and an amount, then
   * written in one transaction so an order never exists without the listing
   * being taken off the market.
   */
  async checkout(user: AuthenticatedUser, dto: CheckoutDto) {
    if (!dto.auctionId === !dto.listingId) {
      throw new BadRequestException(
        'Provide exactly one of auctionId or listingId',
      );
    }

    const order = await this.prisma.$transaction(
      async (tx) => {
        const source = dto.auctionId
          ? await this.resolveAuctionCheckout(tx, user, dto.auctionId)
          : await this.resolveFixedPriceCheckout(tx, user, dto.listingId!);

        const created = await tx.order.create({
          data: {
            listingId: source.listingId,
            auctionId: dto.auctionId,
            buyerId: user.id,
            sellerId: source.sellerId,
            amount: source.amount,
            status: OrderStatus.PENDING,
            shippingName: dto.shippingName,
            shippingPhone: dto.shippingPhone,
            shippingAddress: dto.shippingAddress,
            shippingCity: dto.shippingCity,
            shippingPostalCode: dto.shippingPostalCode,
          },
        });

        // Taking the listing off the market inside the same transaction is what
        // stops a second buyer checking out the same item.
        await tx.listing.update({
          where: { id: source.listingId },
          data: { status: ListingStatus.SOLD },
        });

        return { ...created, listingTitle: source.listingTitle };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const payment = await this.startPayment(order.id, order.amount, user.email);

    await this.notifications.notifyUser(
      order.sellerId,
      NotificationType.ORDER_CONFIRMED,
      'You have a sale',
      `"${order.listingTitle}" has been ordered for LKR ${order.amount.toFixed(2)}.`,
      { orderId: order.id, listingId: order.listingId },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );

    return { order, payment };
  }

  private async resolveAuctionCheckout(
    tx: Prisma.TransactionClient,
    user: AuthenticatedUser,
    auctionId: string,
  ) {
    const auction = await tx.auction.findUnique({
      where: { id: auctionId },
      include: {
        listing: { select: { id: true, title: true, sellerId: true } },
      },
    });

    if (!auction) throw new NotFoundException('Auction not found');
    if (auction.status !== AuctionStatus.ENDED) {
      throw new BadRequestException('This auction has not closed yet');
    }
    if (auction.winnerId !== user.id) {
      throw new ForbiddenException('Only the winning bidder can check out');
    }

    const existing = await tx.order.findFirst({
      where: { auctionId, status: { not: OrderStatus.CANCELLED } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('This auction has already been checked out');
    }

    return {
      listingId: auction.listing.id,
      listingTitle: auction.listing.title,
      sellerId: auction.listing.sellerId,
      amount: auction.currentPrice,
    };
  }

  private async resolveFixedPriceCheckout(
    tx: Prisma.TransactionClient,
    user: AuthenticatedUser,
    listingId: string,
  ) {
    const listing = await tx.listing.findUnique({ where: { id: listingId } });

    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.listingType !== ListingType.FIXED_PRICE) {
      throw new BadRequestException(
        'This is an auction listing; bid or use Buy Now instead',
      );
    }
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('This listing is no longer available');
    }
    if (listing.sellerId === user.id) {
      throw new ForbiddenException('A seller cannot buy their own item');
    }

    return {
      listingId: listing.id,
      listingTitle: listing.title,
      sellerId: listing.sellerId,
      amount: listing.startingPrice,
    };
  }

  private async startPayment(
    orderId: string,
    amount: Prisma.Decimal,
    buyerEmail: string,
  ) {
    const intent = await this.gateway.createPayment({
      orderId,
      amount: amount.toNumber(),
      currency: 'LKR',
      buyerEmail,
      description: `Collectible marketplace order ${orderId}`,
    });

    await this.prisma.payment.create({
      data: {
        orderId,
        provider: this.gateway.provider,
        amount,
        status: PaymentStatus.INITIATED,
        transactionRef: intent.transactionRef,
      },
    });

    return intent;
  }

  // --- Payment callback ---------------------------------------------------

  /**
   * Handles a provider callback.
   *
   * Verification comes first: an unsigned or forged payload is dropped, since
   * accepting one would let anyone mark an order as paid. The update is then
   * idempotent on the transaction reference, so a provider that retries a
   * callback - which they all do - cannot advance the order twice or
   * double-charge the buyer (NFR: Reliability).
   */
  async handlePaymentCallback(
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const callback = this.gateway.verifyCallback(payload, headers);
    if (!callback) {
      this.logger.warn('Rejected a payment callback that failed verification');
      throw new BadRequestException('Invalid payment callback');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { transactionRef: callback.transactionRef },
      include: {
        order: {
          include: { listing: { select: { title: true } } },
        },
      },
    });
    if (!payment) throw new NotFoundException('Unknown transaction reference');

    if (payment.status !== PaymentStatus.INITIATED) {
      // Already settled: acknowledge and do nothing further.
      return { status: payment.status, alreadyProcessed: true };
    }

    const succeeded = callback.succeeded;

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: succeeded ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
          rawPayload: callback.rawPayload as Prisma.InputJsonValue,
        },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: succeeded ? OrderStatus.PAID : OrderStatus.PENDING },
      }),
      this.prisma.auditLog.create({
        data: {
          action: succeeded ? 'PAYMENT_SUCCEEDED' : 'PAYMENT_FAILED',
          entityType: 'Order',
          entityId: payment.orderId,
          metadata: { transactionRef: callback.transactionRef },
        },
      }),
    ]);

    if (succeeded) {
      const title = payment.order.listing.title;
      await Promise.all([
        this.notifications.notifyUser(
          payment.order.sellerId,
          NotificationType.PAYMENT_RECEIVED,
          'Payment received',
          `Payment for "${title}" has cleared. You can ship the item.`,
          { orderId: payment.orderId },
          [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        ),
        this.notifications.notifyUser(
          payment.order.buyerId,
          NotificationType.PAYMENT_RECEIVED,
          'Payment confirmed',
          `Your payment for "${title}" has been confirmed.`,
          { orderId: payment.orderId },
          [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        ),
      ]);
    }

    return {
      status: succeeded ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
    };
  }

  // --- Order tracking -----------------------------------------------------

  async findMine(
    user: AuthenticatedUser,
    query: ListOrdersDto,
    asSeller = false,
  ) {
    const where: Prisma.OrderWhereInput = {
      ...(asSeller ? { sellerId: user.id } : { buyerId: user.id }),
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              images: {
                take: 1,
                orderBy: { position: 'asc' },
                select: { url: true },
              },
            },
          },
          payment: {
            select: { status: true, provider: true, transactionRef: true },
          },
          buyer: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true } },
          dispute: { select: { id: true, status: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true, category: true } },
        payment: true,
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        dispute: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const involved = order.buyerId === user.id || order.sellerId === user.id;
    if (!involved && user.role !== Role.ADMIN) {
      throw new ForbiddenException('This order belongs to someone else');
    }
    return order;
  }

  /**
   * Advances an order along the Pending to Completed path.
   *
   * Who may make which move is fixed: only the seller marks an item shipped,
   * only the buyer confirms it arrived. That keeps a seller from closing out an
   * order the buyer never received.
   */
  async updateStatus(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.findOne(user, id);

    if (!ALLOWED_TRANSITIONS[order.status].includes(dto.status)) {
      throw new BadRequestException(
        `An order cannot move from ${order.status} to ${dto.status}`,
      );
    }

    const isSeller = order.sellerId === user.id;
    const isBuyer = order.buyerId === user.id;
    const isAdmin = user.role === Role.ADMIN;

    if (dto.status === OrderStatus.SHIPPED && !isSeller && !isAdmin) {
      throw new ForbiddenException('Only the seller can mark an order shipped');
    }
    if (dto.status === OrderStatus.COMPLETED && !isBuyer && !isAdmin) {
      throw new ForbiddenException(
        'Only the buyer can confirm the item arrived',
      );
    }
    if (dto.status === OrderStatus.CANCELLED && !isAdmin) {
      throw new ForbiddenException('Only an administrator can cancel an order');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status, trackingNumber: dto.trackingNumber },
      include: { listing: { select: { title: true } } },
    });

    if (dto.status === OrderStatus.SHIPPED) {
      await this.notifications.notifyUser(
        order.buyerId,
        NotificationType.ITEM_SHIPPED,
        'Your item has shipped',
        `"${updated.listing.title}" is on its way.` +
          (dto.trackingNumber ? ` Tracking: ${dto.trackingNumber}.` : ''),
        { orderId: id },
        [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      );
    }

    if (dto.status === OrderStatus.CANCELLED) {
      // A cancelled order releases the item back onto the marketplace.
      await this.prisma.listing.update({
        where: { id: order.listingId },
        data: { status: ListingStatus.ACTIVE },
      });
    }

    return updated;
  }

  // --- Disputes -----------------------------------------------------------

  /// Either party may raise a dispute on an in-progress or completed order
  /// for administrator review (FR 2.1.7).
  async raiseDispute(
    user: AuthenticatedUser,
    orderId: string,
    dto: RaiseDisputeDto,
  ) {
    const order = await this.findOne(user, orderId);

    if (order.buyerId !== user.id && order.sellerId !== user.id) {
      throw new ForbiddenException(
        'Only the buyer or seller can raise a dispute',
      );
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('This order was cancelled');
    }
    if (order.dispute) {
      throw new ConflictException('This order already has an open dispute');
    }

    const dispute = await this.prisma.dispute.create({
      data: {
        orderId,
        raisedById: user.id,
        reason: dto.reason,
        details: dto.details,
        status: DisputeStatus.OPEN,
      },
    });

    const otherParty =
      order.buyerId === user.id ? order.sellerId : order.buyerId;

    await this.notifications.notifyUser(
      otherParty,
      NotificationType.DISPUTE_UPDATE,
      'A dispute has been raised',
      `A dispute was opened on order ${orderId}. An administrator will review it.`,
      { orderId, disputeId: dispute.id },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );

    return dispute;
  }
}
