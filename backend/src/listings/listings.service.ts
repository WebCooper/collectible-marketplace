import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuctionStatus,
  CertificateStatus,
  ListingStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingSort, SearchListingsDto } from './dto/search-listings.dto';

/// Statuses a guest or buyer is allowed to see in search results.
const PUBLICLY_VISIBLE: ListingStatus[] = [
  ListingStatus.ACTIVE,
  ListingStatus.SOLD,
];

const LISTING_CARD_SELECT = {
  id: true,
  title: true,
  category: true,
  condition: true,
  startingPrice: true,
  listingType: true,
  status: true,
  isVerified: true,
  isFeatured: true,
  viewCount: true,
  createdAt: true,
  images: { take: 1, orderBy: { position: 'asc' }, select: { url: true } },
  seller: { select: { id: true, name: true, avatarUrl: true } },
  auction: {
    select: {
      id: true,
      currentPrice: true,
      endTime: true,
      status: true,
      bidCount: true,
      buyNowPrice: true,
    },
  },
} satisfies Prisma.ListingSelect;

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Seller operations --------------------------------------------------

  /// A new listing enters UNDER_REVIEW: an appraiser sees it in the review
  /// queue before it reaches the marketplace (FR 2.1.3).
  async create(sellerId: string, dto: CreateListingDto) {
    return this.prisma.listing.create({
      data: {
        sellerId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        condition: dto.condition,
        era: dto.era,
        denomination: dto.denomination,
        startingPrice: new Prisma.Decimal(dto.startingPrice),
        listingType: dto.listingType,
        status: ListingStatus.UNDER_REVIEW,
        images: dto.images?.length
          ? {
              create: dto.images.map((image, index) => ({
                url: image.url,
                position: image.position ?? index,
              })),
            }
          : undefined,
        certificates: dto.certificates?.length
          ? {
              create: dto.certificates.map((certificate) => ({
                fileUrl: certificate.fileUrl,
                fileName: certificate.fileName,
                issuer: certificate.issuer,
                status: CertificateStatus.PENDING,
              })),
            }
          : undefined,
      },
      include: { images: true, certificates: true },
    });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateListingDto) {
    const listing = await this.findOwned(user, id);

    // Editing a listing whose auction has already taken bids would move the
    // goalposts under the bidders (FR 2.1.2).
    if (await this.hasBids(id)) {
      throw new BadRequestException(
        'This listing cannot be edited once bidding has started',
      );
    }
    if (
      listing.status === ListingStatus.SOLD ||
      listing.status === ListingStatus.WITHDRAWN
    ) {
      throw new BadRequestException(
        `A ${listing.status.toLowerCase()} listing cannot be edited`,
      );
    }

    const { images, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (images) {
        // Images are replaced wholesale - the seller sends the full gallery in
        // the order they want it shown.
        await tx.listingImage.deleteMany({ where: { listingId: id } });
        await tx.listingImage.createMany({
          data: images.map((image, index) => ({
            listingId: id,
            url: image.url,
            position: image.position ?? index,
          })),
        });
      }

      return tx.listing.update({
        where: { id },
        data: {
          ...rest,
          startingPrice:
            rest.startingPrice !== undefined
              ? new Prisma.Decimal(rest.startingPrice)
              : undefined,
          // Any edit sends the listing back through review.
          status: ListingStatus.UNDER_REVIEW,
          isVerified: false,
        },
        include: {
          images: { orderBy: { position: 'asc' } },
          certificates: true,
        },
      });
    });
  }

  async withdraw(user: AuthenticatedUser, id: string) {
    await this.findOwned(user, id);

    if (await this.hasBids(id)) {
      throw new BadRequestException(
        'This listing cannot be withdrawn once bidding has started',
      );
    }

    return this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.WITHDRAWN },
    });
  }

  /// The seller's own dashboard, which unlike public search shows drafts,
  /// listings under review and withdrawn items.
  async findMine(sellerId: string, pagination: SearchListingsDto) {
    const where: Prisma.ListingWhereInput = { sellerId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        select: LISTING_CARD_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.listing.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  // --- Search & discovery -------------------------------------------------

  /// Keyword search, advanced filtering and sorting in one query (FR 2.1.4).
  async search(dto: SearchListingsDto) {
    const where = this.buildSearchWhere(dto);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        select: LISTING_CARD_SELECT,
        orderBy: this.buildOrderBy(dto.sort),
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return paginate(data, total, dto);
  }

  private buildSearchWhere(dto: SearchListingsDto): Prisma.ListingWhereInput {
    const where: Prisma.ListingWhereInput = {
      status: { in: PUBLICLY_VISIBLE },
    };

    if (dto.q) {
      where.OR = [
        { title: { contains: dto.q, mode: 'insensitive' } },
        { description: { contains: dto.q, mode: 'insensitive' } },
        { era: { contains: dto.q, mode: 'insensitive' } },
        { denomination: { contains: dto.q, mode: 'insensitive' } },
      ];
    }
    if (dto.category) where.category = dto.category;
    if (dto.condition) where.condition = dto.condition;
    if (dto.listingType) where.listingType = dto.listingType;
    if (dto.verifiedOnly) where.isVerified = true;
    if (dto.featuredOnly) where.isFeatured = true;
    if (dto.sellerId) where.sellerId = dto.sellerId;

    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      where.startingPrice = {
        ...(dto.minPrice !== undefined ? { gte: dto.minPrice } : {}),
        ...(dto.maxPrice !== undefined ? { lte: dto.maxPrice } : {}),
      };
    }

    return where;
  }

  private buildOrderBy(
    sort: ListingSort = ListingSort.NEWEST,
  ): Prisma.ListingOrderByWithRelationInput[] {
    switch (sort) {
      case ListingSort.PRICE_ASC:
        return [{ startingPrice: 'asc' }];
      case ListingSort.PRICE_DESC:
        return [{ startingPrice: 'desc' }];
      case ListingSort.ENDING_SOONEST:
        // Fixed-price listings have no auction, so they sort last.
        return [{ auction: { endTime: 'asc' } }, { createdAt: 'desc' }];
      case ListingSort.POPULARITY:
        return [{ viewCount: 'desc' }, { createdAt: 'desc' }];
      case ListingSort.NEWEST:
      default:
        return [{ createdAt: 'desc' }];
    }
  }

  /// Rare and featured collectibles for the marketplace homepage (FR 2.1.4).
  featured(limit = 8) {
    return this.prisma.listing.findMany({
      where: {
        status: ListingStatus.ACTIVE,
        OR: [{ isFeatured: true }, { isVerified: true }],
      },
      select: LISTING_CARD_SELECT,
      orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }],
      take: limit,
    });
  }

  /// Category tiles on the homepage, with a live count per category.
  async categoryCounts() {
    const grouped = await this.prisma.listing.groupBy({
      by: ['category'],
      where: { status: ListingStatus.ACTIVE },
      _count: { _all: true },
    });
    return grouped.map((row) => ({
      category: row.category,
      count: row._count._all,
    }));
  }

  // --- Detail -------------------------------------------------------------

  /// Full listing detail. Viewers other than the owner only ever see a listing
  /// that is publicly visible, and their visit counts towards popularity.
  async findOne(id: string, viewer?: AuthenticatedUser) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: 'asc' } },
        seller: {
          select: { id: true, name: true, avatarUrl: true, createdAt: true },
        },
        certificates: {
          select: {
            id: true,
            fileName: true,
            issuer: true,
            status: true,
            uploadedAt: true,
          },
        },
        verifications: {
          orderBy: { verifiedAt: 'desc' },
          select: {
            id: true,
            decision: true,
            comments: true,
            appraisedValue: true,
            verifiedAt: true,
            appraiser: { select: { id: true, name: true } },
          },
        },
        auction: true,
        _count: { select: { orders: true } },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    const isOwner = viewer?.id === listing.sellerId;
    const isStaff =
      viewer?.role === Role.ADMIN || viewer?.role === Role.APPRAISER;

    if (!isOwner && !isStaff && !PUBLICLY_VISIBLE.includes(listing.status)) {
      throw new NotFoundException('Listing not found');
    }

    if (!isOwner) {
      // Fire-and-forget: a failed counter update must not fail the page load.
      void this.prisma.listing
        .update({ where: { id }, data: { viewCount: { increment: 1 } } })
        .catch(() => undefined);
    }

    // The certificate files themselves stay private; buyers see that a
    // certificate exists and that an appraiser accepted it, not the document.
    return listing;
  }

  // --- Helpers ------------------------------------------------------------

  /// Loads a listing and asserts the caller may act on it. Administrators can
  /// act on any listing; sellers only on their own.
  async findOwned(user: AuthenticatedUser, id: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    if (listing.sellerId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('This listing belongs to another seller');
    }
    return listing;
  }

  private async hasBids(listingId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { listingId },
      select: { bidCount: true, status: true },
    });
    return (
      !!auction &&
      (auction.bidCount > 0 || auction.status === AuctionStatus.ENDED)
    );
  }
}

export { LISTING_CARD_SELECT, PUBLICLY_VISIBLE };
