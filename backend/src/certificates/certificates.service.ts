import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CertificateStatus,
  ListingStatus,
  NotificationChannel,
  NotificationType,
  Prisma,
  Role,
  VerificationDecision,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ListingsService } from '../listings/listings.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  UploadCertificateDto,
  VerificationDecisionDto,
} from './dto/certificate.dto';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly listings: ListingsService,
    private readonly notifications: NotificationsService,
  ) {}

  // --- Seller side --------------------------------------------------------

  /// Attaches a certificate to a listing and sends the listing back to the
  /// review queue so the new evidence is actually looked at (FR 2.1.3).
  async upload(
    user: AuthenticatedUser,
    listingId: string,
    dto: UploadCertificateDto,
  ) {
    const listing = await this.listings.findOwned(user, listingId);

    if (listing.status === ListingStatus.SOLD) {
      throw new BadRequestException(
        'A sold listing can no longer receive certificates',
      );
    }

    const [certificate] = await this.prisma.$transaction([
      this.prisma.certificate.create({
        data: {
          listingId,
          fileUrl: dto.fileUrl,
          fileName: dto.fileName,
          issuer: dto.issuer,
          status: CertificateStatus.PENDING,
        },
      }),
      this.prisma.listing.update({
        where: { id: listingId },
        data: { status: ListingStatus.UNDER_REVIEW },
      }),
    ]);

    return certificate;
  }

  /// The certificates on one listing. Sellers, appraisers and administrators
  /// see the file URL; nobody else can reach this route.
  async findForListing(user: AuthenticatedUser, listingId: string) {
    // Appraisers and administrators review other people's listings, so they
    // skip the ownership check; everyone else must own the listing.
    if (user.role !== Role.APPRAISER && user.role !== Role.ADMIN) {
      await this.listings.findOwned(user, listingId);
    }

    return this.prisma.certificate.findMany({
      where: { listingId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  // --- Appraiser side -----------------------------------------------------

  /// The review queue: listings waiting on an expert, oldest first so nothing
  /// is left sitting indefinitely.
  async reviewQueue(pagination: PaginationDto) {
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.UNDER_REVIEW,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
        select: {
          id: true,
          title: true,
          category: true,
          condition: true,
          era: true,
          denomination: true,
          startingPrice: true,
          description: true,
          createdAt: true,
          seller: { select: { id: true, name: true, email: true } },
          images: { orderBy: { position: 'asc' }, select: { url: true } },
          certificates: true,
          verifications: {
            orderBy: { verifiedAt: 'desc' },
            take: 3,
            select: {
              decision: true,
              comments: true,
              verifiedAt: true,
              appraiser: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }

  /**
   * Records an appraiser's decision and moves the listing accordingly.
   *
   * The decision record, the certificate status and the listing status are
   * written in one transaction: a listing must never end up carrying a
   * verified badge without the matching verification record behind it.
   */
  async decide(
    appraiser: AuthenticatedUser,
    listingId: string,
    dto: VerificationDecisionDto,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, title: true, sellerId: true, status: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    // Only listings waiting in the review queue can be decided. Without this an
    // approval could republish a sold, withdrawn or moderator-removed listing.
    if (listing.status !== ListingStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Only a listing under review can receive a verification decision',
      );
    }

    if (dto.certificateId) {
      const certificate = await this.prisma.certificate.findFirst({
        where: { id: dto.certificateId, listingId },
        select: { id: true },
      });
      if (!certificate) {
        throw new BadRequestException(
          'That certificate does not belong to this listing',
        );
      }
    }

    const approved = dto.decision === VerificationDecision.APPROVED;
    const rejected = dto.decision === VerificationDecision.REJECTED;

    const [record] = await this.prisma.$transaction([
      this.prisma.verificationRecord.create({
        data: {
          listingId,
          certificateId: dto.certificateId,
          appraiserId: appraiser.id,
          decision: dto.decision,
          comments: dto.comments,
          appraisedValue:
            dto.appraisedValue !== undefined
              ? new Prisma.Decimal(dto.appraisedValue)
              : undefined,
        },
      }),
      this.prisma.listing.update({
        where: { id: listingId },
        data: {
          // Approved goes live with a badge; rejected is pulled from the
          // marketplace; a request for more evidence leaves it in the queue.
          status: approved
            ? ListingStatus.ACTIVE
            : rejected
              ? ListingStatus.REMOVED
              : ListingStatus.UNDER_REVIEW,
          isVerified: approved,
        },
      }),
      ...(dto.certificateId
        ? [
            this.prisma.certificate.update({
              where: { id: dto.certificateId },
              data: {
                status: approved
                  ? CertificateStatus.APPROVED
                  : rejected
                    ? CertificateStatus.REJECTED
                    : CertificateStatus.PENDING,
              },
            }),
          ]
        : []),
      this.prisma.auditLog.create({
        data: {
          actorId: appraiser.id,
          action: `VERIFICATION_${dto.decision}`,
          entityType: 'Listing',
          entityId: listingId,
          metadata: {
            comments: dto.comments ?? null,
            appraisedValue: dto.appraisedValue ?? null,
          },
        },
      }),
    ]);

    await this.notifyDecision(listing.sellerId, listing.title, listingId, dto);

    return record;
  }

  private notifyDecision(
    sellerId: string,
    listingTitle: string,
    listingId: string,
    dto: VerificationDecisionDto,
  ) {
    const messages: Record<
      VerificationDecision,
      [NotificationType, string, string]
    > = {
      [VerificationDecision.APPROVED]: [
        NotificationType.LISTING_APPROVED,
        'Listing approved',
        `"${listingTitle}" passed expert review and is now live with a verified badge.`,
      ],
      [VerificationDecision.REJECTED]: [
        NotificationType.LISTING_REJECTED,
        'Listing rejected',
        `"${listingTitle}" did not pass expert review. ${dto.comments ?? ''}`.trim(),
      ],
      [VerificationDecision.MORE_EVIDENCE_REQUESTED]: [
        NotificationType.LISTING_FLAGGED,
        'More evidence needed',
        `An appraiser needs more evidence for "${listingTitle}". ${dto.comments ?? ''}`.trim(),
      ],
    };

    const [type, title, message] = messages[dto.decision];

    return this.notifications.notifyUser(
      sellerId,
      type,
      title,
      message,
      { listingId },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );
  }

  /// Verification history for one listing, kept for future reference and
  /// disputes (FR 2.1.3).
  async history(listingId: string) {
    const exists = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Listing not found');

    return this.prisma.verificationRecord.findMany({
      where: { listingId },
      orderBy: { verifiedAt: 'desc' },
      select: {
        id: true,
        decision: true,
        comments: true,
        appraisedValue: true,
        verifiedAt: true,
        appraiser: { select: { id: true, name: true } },
        certificate: { select: { id: true, fileName: true, issuer: true } },
      },
    });
  }
}
