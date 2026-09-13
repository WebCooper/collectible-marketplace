import {
  AuctionStatus,
  Category,
  ItemCondition,
  Listing,
  ListingStatus,
  ListingType,
  PrismaClient,
  Role,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/// Seeds a small but complete slice of the marketplace so the frontend teams
/// have something to build against: one user per role, listings across several
/// categories, a verified listing, and a live auction with bids.
async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const [admin, appraiser, seller, buyerOne, buyerTwo] = await Promise.all(
    [
      { email: 'admin@marketplace.lk', name: 'Platform Admin', role: Role.ADMIN },
      { email: 'appraiser@marketplace.lk', name: 'Nimal Perera', role: Role.APPRAISER },
      { email: 'seller@marketplace.lk', name: 'Sunil Fernando', role: Role.SELLER },
      { email: 'buyer@marketplace.lk', name: 'Kamala Silva', role: Role.BUYER },
      { email: 'buyer2@marketplace.lk', name: 'Ravi Jayasuriya', role: Role.BUYER },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          ...u,
          phone: '+94771234567',
          passwordHash,
          status: UserStatus.ACTIVE,
          emailVerified: true,
        },
      }),
    ),
  );

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

  console.log('Seed complete.');
  console.log(`  admin      ${admin.email}`);
  console.log(`  appraiser  ${appraiser.email}`);
  console.log(`  seller     ${seller.email}`);
  console.log(`  buyers     ${buyerOne.email}, ${buyerTwo.email}`);
  console.log('  password   Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
