import {
  AuctionStatus,
  BidStatus,
  Category,
  CertificateStatus,
  DisputeStatus,
  ItemCondition,
  Listing,
  ListingStatus,
  ListingType,
  NotificationType,
  OrderStatus,
  PaymentStatus,
  PrismaClient,
  ReportStatus,
  ReportTargetType,
  Role,
  UserStatus,
  VerificationDecision,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/// Seeds a complete slice of the marketplace so every screen has something to
/// show: one user per role, listings in every review state, live and finished
/// auctions, orders at each stage of fulfilment, a dispute, a report and
/// notifications. Safe to run repeatedly - every record is looked up first.
async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const accountSeeds = [
    { email: 'admin@marketplace.lk', name: 'Platform Admin', role: Role.ADMIN },
    { email: 'appraiser@marketplace.lk', name: 'Nimal Perera', role: Role.APPRAISER },
    { email: 'seller@marketplace.lk', name: 'Sunil Fernando', role: Role.SELLER },
    { email: 'seller2@marketplace.lk', name: 'Priya Wickramasinghe', role: Role.SELLER },
    { email: 'buyer@marketplace.lk', name: 'Kamala Silva', role: Role.BUYER },
    { email: 'buyer2@marketplace.lk', name: 'Ravi Jayasuriya', role: Role.BUYER },
  ];
  const [admin, appraiser, seller, seller2, buyerOne, buyerTwo] =
    await Promise.all(
      accountSeeds.map((u) =>
        prisma.user.upsert({
          where: { email: u.email },
          update: {},
          create: {
            ...u,
            phone: '+94771234567',
            passwordHash,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            bio:
              u.role === Role.SELLER
                ? 'Collector and dealer of Ceylon coins, notes and stamps since 1998.'
                : undefined,
          },
        }),
      ),
    );

  // Accounts for testing the OTP and moderation screens.
  const pendingUser = await prisma.user.upsert({
    where: { email: 'pending@marketplace.lk' },
    update: {},
    create: {
      email: 'pending@marketplace.lk',
      name: 'Dilini Perera',
      role: Role.BUYER,
      phone: '+94771234567',
      passwordHash,
      status: UserStatus.PENDING_VERIFICATION,
      emailVerified: false,
    },
  });
  await prisma.user.upsert({
    where: { email: 'suspended@marketplace.lk' },
    update: {},
    create: {
      email: 'suspended@marketplace.lk',
      name: 'Suspended Buyer',
      role: Role.BUYER,
      phone: '+94771234567',
      passwordHash,
      status: UserStatus.SUSPENDED,
      emailVerified: true,
    },
  });

  const listingSeeds = [
    {
      title: '1957 Ceylon 5 Rupee Commemorative Coin',
      description:
        'Struck for the 2500th Buddha Jayanti. Original lustre, lightly toned.',
      category: Category.COMMEMORATIVE_COINS,
      condition: ItemCondition.EXCELLENT,
      era: '1957',
      denomination: '5 Rupees',
      startingPrice: 18500,
      listingType: ListingType.AUCTION,
      isVerified: true,
    },
    {
      title: 'Ceylon 1000 Rupee Note - 1970s Series',
      description: 'Crisp uncirculated note with sharp corners and no folds.',
      category: Category.CURRENCY_NOTES,
      condition: ItemCondition.MINT,
      era: '1970s',
      denomination: '1000 Rupees',
      startingPrice: 42000,
      listingType: ListingType.FIXED_PRICE,
      isVerified: true,
    },
    {
      title: 'Sri Lanka Wildlife Stamp Block (1981)',
      description: 'Complete block of four, original gum, never hinged.',
      category: Category.STAMPS,
      condition: ItemCondition.VERY_GOOD,
      era: '1981',
      denomination: null,
      startingPrice: 6500,
      listingType: ListingType.FIXED_PRICE,
      isVerified: false,
    },
    {
      title: 'British Ceylon Half Cent (1870)',
      description: 'Victorian era copper half cent, even brown patina.',
      category: Category.OLD_COINS,
      condition: ItemCondition.GOOD,
      era: '1870',
      denomination: 'Half Cent',
      startingPrice: 9200,
      listingType: ListingType.AUCTION,
      isVerified: false,
    },
  ];

  const listings: Listing[] = [];
  for (const seed of listingSeeds) {
    const existing = await prisma.listing.findFirst({
      where: { title: seed.title },
    });
    if (existing) {
      listings.push(existing);
      continue;
    }
    listings.push(
      await prisma.listing.create({
        data: {
          ...seed,
          sellerId: seller.id,
          status: ListingStatus.ACTIVE,
          isFeatured: seed.isVerified,
          images: {
            create: [
              { url: 'https://placehold.co/800x600/png?text=Obverse', position: 0 },
              { url: 'https://placehold.co/800x600/png?text=Reverse', position: 1 },
            ],
          },
        },
      }),
    );
  }

  // A live auction closing in two days, with a bidding war already under way.
  const auctionListing = listings[0];
  const existingAuction = await prisma.auction.findUnique({
    where: { listingId: auctionListing.id },
  });

  if (!existingAuction) {
    const auction = await prisma.auction.create({
      data: {
        listingId: auctionListing.id,
        startPrice: auctionListing.startingPrice,
        minIncrement: 500,
        currentPrice: 19500,
        buyNowPrice: 35000,
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: AuctionStatus.ACTIVE,
        bidCount: 2,
      },
    });

    await prisma.bid.createMany({
      data: [
        { auctionId: auction.id, bidderId: buyerOne.id, amount: 19000, status: 'OUTBID' },
        { auctionId: auction.id, bidderId: buyerTwo.id, amount: 19500, status: 'ACTIVE' },
      ],
    });
  }

  // --- Verification: approved certificates on the verified listings --------
  for (const verified of listings.filter((l) => l.isVerified)) {
    const existingCert = await prisma.certificate.findFirst({
      where: { listingId: verified.id },
    });
    if (existingCert) continue;
    const certificate = await prisma.certificate.create({
      data: {
        listingId: verified.id,
        fileUrl: 'https://example.com/certificates/slns-certificate.pdf',
        fileName: 'slns-certificate.pdf',
        issuer: 'Sri Lanka Numismatic Society',
        status: CertificateStatus.APPROVED,
      },
    });
    await prisma.verificationRecord.create({
      data: {
        listingId: verified.id,
        certificateId: certificate.id,
        appraiserId: appraiser.id,
        decision: VerificationDecision.APPROVED,
        comments: 'Authentic. Matches the issuer registry.',
        appraisedValue: Number(verified.startingPrice) * 1.2,
      },
    });
  }

  // --- More listings in every state ----------------------------------------
  const image = (label: string) => ({
    create: [
      { url: `https://placehold.co/800x600/png?text=${label}`, position: 0 },
    ],
  });
  const ensureListing = async (
    title: string,
    data: {
      sellerId: string;
      description: string;
      category: Category;
      condition: ItemCondition;
      era?: string;
      denomination?: string;
      startingPrice: number;
      listingType?: ListingType;
      status: ListingStatus;
      isVerified?: boolean;
    },
  ): Promise<Listing> =>
    (await prisma.listing.findFirst({ where: { title } })) ??
    prisma.listing.create({
      data: { title, ...data, images: image(title.split(' ')[0]) },
    });

  // Waiting in the appraiser's review queue (with a pending certificate).
  const reviewCoin = await ensureListing('1982 Ceylon 100 Rupee Proof Coin', {
    sellerId: seller.id,
    description:
      'Central Bank proof strike in the original case, with a certificate of issue.',
    category: Category.PROOF_COINS,
    condition: ItemCondition.MINT,
    era: '1982',
    denomination: '100 Rupees',
    startingPrice: 27500,
    status: ListingStatus.UNDER_REVIEW,
  });
  if (!(await prisma.certificate.findFirst({ where: { listingId: reviewCoin.id } }))) {
    await prisma.certificate.create({
      data: {
        listingId: reviewCoin.id,
        fileUrl: 'https://example.com/certificates/cbsl-proof-1982.pdf',
        fileName: 'cbsl-proof-1982.pdf',
        issuer: 'Central Bank of Sri Lanka',
      },
    });
  }

  // An auction listing that has no schedule yet - exercises "Schedule the auction".
  const unscheduled = await ensureListing('Dutch VOC Duit (1790)', {
    sellerId: seller.id,
    description:
      'Dutch East India Company copper duit struck for Ceylon, clear mintmark.',
    category: Category.OLD_COINS,
    condition: ItemCondition.FAIR,
    era: '1790',
    denomination: 'Duit',
    startingPrice: 4800,
    listingType: ListingType.AUCTION,
    status: ListingStatus.UNDER_REVIEW,
  });
  if (!(await prisma.verificationRecord.findFirst({ where: { listingId: unscheduled.id } }))) {
    await prisma.verificationRecord.create({
      data: {
        listingId: unscheduled.id,
        appraiserId: appraiser.id,
        decision: VerificationDecision.MORE_EVIDENCE_REQUESTED,
        comments: 'Please add a photograph of the edge and the mintmark.',
      },
    });
  }

  await ensureListing('1935 Silver Jubilee Stamp Set', {
    sellerId: seller2.id,
    description: 'Complete set of four Silver Jubilee stamps, lightly hinged.',
    category: Category.STAMPS,
    condition: ItemCondition.VERY_GOOD,
    era: '1935',
    startingPrice: 12000,
    status: ListingStatus.ACTIVE,
    isVerified: true,
  });

  const removed = await ensureListing('Suspicious 1815 Kandyan Gold Fanam', {
    sellerId: seller2.id,
    description: 'Removed after collectors flagged it as a likely replica.',
    category: Category.OLD_COINS,
    condition: ItemCondition.GOOD,
    era: '1815',
    startingPrice: 90000,
    status: ListingStatus.REMOVED,
  });

  // --- Orders at every stage of fulfilment ----------------------------------
  const shipping = {
    shippingName: 'Kamala Silva',
    shippingPhone: '+94771234567',
    shippingAddress: '42 Galle Road',
    shippingCity: 'Colombo',
    shippingPostalCode: '00300',
  };
  const ensureOrder = async (
    ref: string,
    title: string,
    buyerId: string,
    sellerId: string,
    price: number,
    orderStatus: OrderStatus,
    paymentStatus: PaymentStatus,
    extra: { trackingNumber?: string; auctionId?: string } = {},
  ) => {
    const existing = await prisma.payment.findUnique({
      where: { transactionRef: ref },
      include: { order: true },
    });
    if (existing) return existing.order;
    const item = await ensureListing(title, {
      sellerId,
      description: `${title}. Sold through the marketplace.`,
      category: Category.OLD_COINS,
      condition: ItemCondition.GOOD,
      startingPrice: price,
      status: ListingStatus.SOLD,
      isVerified: true,
    });
    return prisma.order.create({
      data: {
        listingId: item.id,
        buyerId,
        sellerId,
        amount: price,
        status: orderStatus,
        ...shipping,
        ...extra,
        payment: {
          create: {
            provider: 'manual',
            amount: price,
            status: paymentStatus,
            transactionRef: ref,
          },
        },
      },
    });
  };

  await ensureOrder(
    'manual_seed_pending', 'Ceylon 1 Rupee Note 1948', buyerOne.id, seller.id,
    3500, OrderStatus.PENDING, PaymentStatus.INITIATED,
  );
  await ensureOrder(
    'manual_seed_paid', '1938 King George VI Rupee', buyerTwo.id, seller.id,
    8200, OrderStatus.PAID, PaymentStatus.SUCCEEDED,
  );
  const shipped = await ensureOrder(
    'manual_seed_shipped', 'Ceylon 50 Cents 1943', buyerOne.id, seller.id,
    5400, OrderStatus.SHIPPED, PaymentStatus.SUCCEEDED,
    { trackingNumber: 'SLP-LK-482913' },
  );
  const completed = await ensureOrder(
    'manual_seed_completed', 'Ceylon 10 Cents 1912', buyerTwo.id, seller2.id,
    2900, OrderStatus.COMPLETED, PaymentStatus.SUCCEEDED,
  );

  // An open dispute on the completed order, for the admin dispute queue.
  if (!(await prisma.dispute.findUnique({ where: { orderId: completed.id } }))) {
    await prisma.dispute.create({
      data: {
        orderId: completed.id,
        raisedById: buyerTwo.id,
        reason: 'Coin is more worn than the photographs showed',
        details: 'The listing said Good but the reverse is almost smooth.',
        status: DisputeStatus.OPEN,
      },
    });
  }

  // A finished auction that Ravi won and has not paid for yet ("Check out").
  const wonListing = await ensureListing('Kandyan Era Copper Massa', {
    sellerId: seller2.id,
    description: 'Copper massa of the Kandyan kingdom, an attractive example.',
    category: Category.OLD_COINS,
    condition: ItemCondition.GOOD,
    startingPrice: 3000,
    listingType: ListingType.AUCTION,
    status: ListingStatus.SOLD,
    isVerified: true,
  });
  if (!(await prisma.auction.findUnique({ where: { listingId: wonListing.id } }))) {
    const finished = await prisma.auction.create({
      data: {
        listingId: wonListing.id,
        startPrice: 3000,
        minIncrement: 250,
        currentPrice: 4250,
        startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: AuctionStatus.ENDED,
        winnerId: buyerTwo.id,
        bidCount: 3,
      },
    });
    await prisma.bid.createMany({
      data: [
        { auctionId: finished.id, bidderId: buyerOne.id, amount: 3500, status: BidStatus.LOST },
        { auctionId: finished.id, bidderId: buyerTwo.id, amount: 3750, status: BidStatus.LOST },
        { auctionId: finished.id, bidderId: buyerOne.id, amount: 4000, status: BidStatus.LOST },
        { auctionId: finished.id, bidderId: buyerTwo.id, amount: 4250, status: BidStatus.WON },
      ],
    });
  }

  // --- Moderation: an open report -------------------------------------------
  const reportReason = 'Photos look copied from an auction house catalogue';
  if (!(await prisma.report.findFirst({ where: { reason: reportReason } }))) {
    await prisma.report.create({
      data: {
        reporterId: buyerOne.id,
        targetType: ReportTargetType.LISTING,
        reportedListingId: listings[2].id,
        reason: reportReason,
        details: 'The stamp block pictures match a 2019 Spink catalogue page.',
        status: ReportStatus.OPEN,
      },
    });
  }
  if (!(await prisma.auditLog.findFirst({ where: { action: 'LISTING_REMOVED', entityId: removed.id } }))) {
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'LISTING_REMOVED',
        entityType: 'Listing',
        entityId: removed.id,
        metadata: { reason: 'Likely replica' },
      },
    });
  }

  // --- Notifications (some unread, so the bell shows a count) ---------------
  const notes: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    payload?: Record<string, string>;
    readStatus?: boolean;
  }[] = [
    { userId: buyerOne.id, type: NotificationType.OUTBID, title: 'You have been outbid', message: 'Another collector bid රු 19,500 on the 1957 Ceylon 5 Rupee Commemorative Coin.', payload: { listingId: auctionListing.id } },
    { userId: buyerOne.id, type: NotificationType.ITEM_SHIPPED, title: 'Your order has shipped', message: 'Ceylon 50 Cents 1943 is on its way. Tracking: SLP-LK-482913.', payload: { orderId: shipped.id } },
    { userId: buyerTwo.id, type: NotificationType.AUCTION_WON, title: 'You won the auction', message: 'You won the Kandyan Era Copper Massa for රු 4,250. Check out to claim it.', payload: { listingId: wonListing.id } },
    { userId: buyerTwo.id, type: NotificationType.DISPUTE_UPDATE, title: 'Dispute received', message: 'We received your dispute and will review it shortly.', payload: { orderId: completed.id }, readStatus: true },
    { userId: seller.id, type: NotificationType.PAYMENT_RECEIVED, title: 'Payment received', message: 'Payment for 1938 King George VI Rupee is confirmed. Please ship the item.' },
    { userId: seller.id, type: NotificationType.LISTING_APPROVED, title: 'Listing approved', message: 'Your 1957 Ceylon 5 Rupee Commemorative Coin is now live.', payload: { listingId: auctionListing.id }, readStatus: true },
    { userId: seller2.id, type: NotificationType.LISTING_REJECTED, title: 'Listing removed', message: 'Suspicious 1815 Kandyan Gold Fanam was removed by a moderator.', payload: { listingId: removed.id } },
  ];
  for (const note of notes) {
    const exists = await prisma.notification.findFirst({
      where: { userId: note.userId, type: note.type, title: note.title },
    });
    if (!exists) await prisma.notification.create({ data: note });
  }

  console.log('Seed complete.');
  console.log(`  admin      ${admin.email}`);
  console.log(`  appraiser  ${appraiser.email}`);
  console.log(`  seller     ${seller.email}`);
  console.log(`  seller 2   ${seller2.email}`);
  console.log(`  buyers     ${buyerOne.email}, ${buyerTwo.email}`);
  console.log(`  pending    ${pendingUser.email} (unverified - use resend-otp)`);
  console.log('  suspended  suspended@marketplace.lk');
  console.log('  password   Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
