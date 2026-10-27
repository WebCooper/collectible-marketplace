import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ListingStatus, VerificationDecision } from '@prisma/client';
import { CertificatesService } from './certificates.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ListingsService } from '../listings/listings.service';

const appraiser = {
  id: 'appraiser-1',
  email: 'a@x.lk',
  role: 'APPRAISER' as const,
};

describe('CertificatesService.decide', () => {
  let service: CertificatesService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      listing: { findUnique: jest.fn(), update: jest.fn() },
      certificate: { findFirst: jest.fn(), update: jest.fn() },
      verificationRecord: {
        create: jest.fn().mockReturnValue({ id: 'rec-1' }),
      },
      auditLog: { create: jest.fn() },
      $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: PrismaService, useValue: prisma },
        { provide: ListingsService, useValue: {} },
        {
          provide: NotificationsService,
          useValue: { notifyUser: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();
    service = moduleRef.get(CertificatesService);
  });

  const listingWith = (status: ListingStatus) => ({
    id: 'listing-1',
    title: 'Ceylon 5 Rupee',
    sellerId: 'seller-1',
    status,
  });

  it.each([
    ListingStatus.SOLD,
    ListingStatus.WITHDRAWN,
    ListingStatus.REMOVED,
    ListingStatus.ACTIVE,
  ])('refuses a decision on a %s listing', async (status) => {
    prisma.listing.findUnique.mockResolvedValue(listingWith(status));

    await expect(
      service.decide(appraiser, 'listing-1', {
        decision: VerificationDecision.APPROVED,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('approves a listing under review and marks it verified', async () => {
    prisma.listing.findUnique.mockResolvedValue(
      listingWith(ListingStatus.UNDER_REVIEW),
    );

    await service.decide(appraiser, 'listing-1', {
      decision: VerificationDecision.APPROVED,
    });

    expect(prisma.listing.update).toHaveBeenCalledWith({
      where: { id: 'listing-1' },
      data: { status: ListingStatus.ACTIVE, isVerified: true },
    });
  });

  it('keeps the listing in the queue when more evidence is requested', async () => {
    prisma.listing.findUnique.mockResolvedValue(
      listingWith(ListingStatus.UNDER_REVIEW),
    );

    await service.decide(appraiser, 'listing-1', {
      decision: VerificationDecision.MORE_EVIDENCE_REQUESTED,
    });

    expect(prisma.listing.update).toHaveBeenCalledWith({
      where: { id: 'listing-1' },
      data: { status: ListingStatus.UNDER_REVIEW, isVerified: false },
    });
  });
});
