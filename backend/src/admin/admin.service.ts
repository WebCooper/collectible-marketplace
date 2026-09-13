import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DisputeStatus,
  ListingStatus,
  NotificationChannel,
  NotificationType,
  OrderStatus,
  Prisma,
  ReportStatus,
  ReportTargetType,
  Role,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  CreateReportDto,
  ListDisputesDto,
  ListReportsDto,
  ListUsersDto,
  ModerateListingDto,
  ResolveDisputeDto,
  ResolveReportDto,
  SuspendUserDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // --- User account management (FR 2.1.8) ---------------------------------

  async listUsers(query: ListUsersDto) {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' as const } },
              { email: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { listings: true, ordersAsBuyer: true, reportsAgainst: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  async suspendUser(admin: AuthenticatedUser, userId: string, dto: SuspendUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Without this an administrator could lock themselves, or each other, out
    // of the platform entirely.
    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Administrator accounts cannot be suspended');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new ConflictException('This account is already suspended');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.SUSPENDED },
        select: { id: true, name: true, email: true, status: true },
      }),
      // Their listings come off the marketplace with them.
      this.prisma.listing.updateMany({
        where: { sellerId: userId, status: ListingStatus.ACTIVE },
        data: { status: ListingStatus.REMOVED },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: 'USER_SUSPENDED',
          entityType: 'User',
          entityId: userId,
          metadata: { reason: dto.reason },
        },
      }),
    ]);

    await this.notifications.notifyUser(
      userId,
      NotificationType.LISTING_FLAGGED,
      'Your account has been suspended',
      `An administrator suspended your account. Reason: ${dto.reason}`,
      {},
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );

    return updated;
  }

  async reinstateUser(admin: AuthenticatedUser, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.status !== UserStatus.SUSPENDED) {
      throw new BadRequestException('This account is not suspended');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.ACTIVE },
        select: { id: true, name: true, email: true, status: true },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: 'USER_REINSTATED',
          entityType: 'User',
          entityId: userId,
        },
      }),
    ]);

    // Listings are deliberately left removed: the administrator decides which
    // ones go back up, rather than silently republishing everything.
    return updated;
  }

  // --- Listing moderation -------------------------------------------------

  async moderateListing(
    admin: AuthenticatedUser,
    listingId: string,
    dto: ModerateListingDto,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, title: true, sellerId: true, status: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    if (
      listing.status === ListingStatus.SOLD &&
      dto.status !== ListingStatus.REMOVED
    ) {
      throw new BadRequestException('A sold listing cannot be republished');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.listing.update({
        where: { id: listingId },
        data: { status: dto.status },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: `LISTING_${dto.status}`,
          entityType: 'Listing',
          entityId: listingId,
          metadata: { reason: dto.reason ?? null },
        },
      }),
    ]);

    const [type, title, message] =
      dto.status === ListingStatus.REMOVED
        ? [
            NotificationType.LISTING_FLAGGED,
            'Listing removed',
            `"${listing.title}" was removed by an administrator. Reason: ${dto.reason ?? 'policy violation'}`,
          ]
        : dto.status === ListingStatus.ACTIVE
          ? [
              NotificationType.LISTING_APPROVED,
              'Listing approved',
              `"${listing.title}" is live on the marketplace.`,
            ]
          : [
              NotificationType.LISTING_FLAGGED,
              'Listing under review',
              `"${listing.title}" has been sent back for review.`,
            ];

    await this.notifications.notifyUser(
      listing.sellerId,
      type,
      title,
      message,
      { listingId },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );

    return updated;
  }

  // --- Reported content ---------------------------------------------------

  /// Any signed-in user can report a suspicious listing or seller.
  async createReport(reporter: AuthenticatedUser, dto: CreateReportDto) {
    if (dto.targetType === ReportTargetType.LISTING) {
      const listing = await this.prisma.listing.findUnique({
        where: { id: dto.reportedListingId },
        select: { id: true },
      });
      if (!listing) throw new NotFoundException('Listing not found');
    } else {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.reportedUserId },
        select: { id: true },
      });
      if (!user) throw new NotFoundException('User not found');
      if (dto.reportedUserId === reporter.id) {
        throw new BadRequestException('You cannot report yourself');
      }
    }

    // One open report per person per target keeps the queue honest without
    // silencing anyone: they can report again once the first is resolved.
    const duplicate = await this.prisma.report.findFirst({
      where: {
        reporterId: reporter.id,
        reportedListingId: dto.reportedListingId ?? null,
        reportedUserId: dto.reportedUserId ?? null,
        status: { in: [ReportStatus.OPEN, ReportStatus.REVIEWING] },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('You have already reported this');
    }

    return this.prisma.report.create({
      data: {
        reporterId: reporter.id,
        targetType: dto.targetType,
        reportedListingId: dto.reportedListingId,
        reportedUserId: dto.reportedUserId,
        reason: dto.reason,
        details: dto.details,
      },
    });
  }

  async listReports(query: ListReportsDto) {
    const where: Prisma.ReportWhereInput = query.status
      ? { status: query.status }
      : { status: { in: [ReportStatus.OPEN, ReportStatus.REVIEWING] } };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: query.skip,
        take: query.limit,
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          reportedListing: { select: { id: true, title: true, status: true } },
          reportedUser: { select: { id: true, name: true, email: true, status: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  async resolveReport(
    admin: AuthenticatedUser,
    reportId: string,
    dto: ResolveReportDto,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status === ReportStatus.ACTIONED || report.status === ReportStatus.DISMISSED) {
      throw new ConflictException('This report has already been resolved');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.report.update({
        where: { id: reportId },
        data: {
          status: dto.status,
          resolutionNote: dto.resolutionNote,
          resolvedById: admin.id,
          resolvedAt: new Date(),
        },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: `REPORT_${dto.status}`,
          entityType: 'Report',
          entityId: reportId,
          metadata: { note: dto.resolutionNote },
        },
      }),
    ]);

    return updated;
  }

  // --- Dispute resolution -------------------------------------------------

  async listDisputes(query: ListDisputesDto) {
    const where: Prisma.DisputeWhereInput = query.status
      ? { status: query.status }
      : { status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] } };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.dispute.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: query.skip,
        take: query.limit,
        include: {
          raisedBy: { select: { id: true, name: true, email: true } },
          order: {
            include: {
              listing: { select: { id: true, title: true } },
              buyer: { select: { id: true, name: true } },
              seller: { select: { id: true, name: true } },
              payment: { select: { status: true, transactionRef: true } },
            },
          },
        },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  async resolveDispute(
    admin: AuthenticatedUser,
    disputeId: string,
    dto: ResolveDisputeDto,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: { select: { buyerId: true, sellerId: true, id: true } } },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (
      dispute.status === DisputeStatus.RESOLVED ||
      dispute.status === DisputeStatus.REJECTED
    ) {
      throw new ConflictException('This dispute has already been closed');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: dto.status,
          resolution: dto.resolution,
          resolvedById: admin.id,
          resolvedAt: new Date(),
        },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: `DISPUTE_${dto.status}`,
          entityType: 'Dispute',
          entityId: disputeId,
          metadata: { resolution: dto.resolution },
        },
      }),
    ]);

    // Both parties hear the outcome, not just the person who raised it.
    await this.notifications.notifyMany(
      [dispute.order.buyerId, dispute.order.sellerId].map((userId) => ({
        userId,
        type: NotificationType.DISPUTE_UPDATE,
        title: 'Dispute resolved',
        message: `The dispute on order ${dispute.order.id} was closed: ${dto.resolution}`,
        payload: { orderId: dispute.order.id, disputeId },
      })),
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );

    return updated;
  }

  // --- Analytics & reporting ----------------------------------------------

  /**
   * Marketplace overview for the admin dashboard (FR 2.1.8).
   *
   * Every figure is a counter or an aggregate computed by the database rather
   * than by loading rows into the API, so the dashboard stays cheap as the
   * marketplace grows.
   */
  async analytics() {
    const [
      totalUsers,
      suspendedUsers,
      activeListings,
      listingsUnderReview,
      completedSales,
      openReports,
      openDisputes,
      liveAuctions,
      salesValue,
      newUsersThisMonth,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
      this.prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
      this.prisma.listing.count({ where: { status: ListingStatus.UNDER_REVIEW } }),
      this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      this.prisma.report.count({
        where: { status: { in: [ReportStatus.OPEN, ReportStatus.REVIEWING] } },
      }),
      this.prisma.dispute.count({
        where: { status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] } },
      }),
      this.prisma.auction.count({ where: { status: 'ACTIVE' } }),
      this.prisma.order.aggregate({
        _sum: { amount: true },
        where: { status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.COMPLETED] } },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    // Kept out of the transaction above: groupBy is a read-only aggregate that
    // does not need the same snapshot as the counters.
    const listingsByCategory = await this.prisma.listing.groupBy({
      by: ['category'],
      where: { status: ListingStatus.ACTIVE },
      _count: { _all: true },
      orderBy: { category: 'asc' },
    });

    return {
      users: { total: totalUsers, suspended: suspendedUsers, newThisMonth: newUsersThisMonth },
      listings: {
        active: activeListings,
        underReview: listingsUnderReview,
        byCategory: listingsByCategory.map((row) => ({
          category: row.category,
          count: row._count._all,
        })),
      },
      auctions: { live: liveAuctions },
      sales: {
        completed: completedSales,
        grossValue: salesValue._sum.amount?.toString() ?? '0',
      },
      moderation: { openReports, openDisputes },
    };
  }

  /// Recent administrative activity, backing the Audit & Logging requirement.
  auditLog(limit = 50) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { actor: { select: { id: true, name: true, role: true } } },
    });
  }
}
