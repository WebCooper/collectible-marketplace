/**
 * End-to-end flow against a real Postgres.
 *
 * Needs its own database: the suite wipes every table before it runs, so it
 * must never be pointed at the development database. Set DATABASE_URL_TEST to
 * a database that already has the migrations applied, e.g.
 *
 *   createdb collectible_marketplace_test
 *   DATABASE_URL=<that url> npx prisma migrate deploy
 *   DATABASE_URL_TEST=<that url> npm run test:e2e
 *
 * Without DATABASE_URL_TEST the suite is skipped.
 */
const testDatabaseUrl = process.env.DATABASE_URL_TEST;
if (testDatabaseUrl) {
  // The suite truncates every table; refuse anything not clearly a test database.
  const dbName = new URL(testDatabaseUrl).pathname.slice(1);
  if (!/test/i.test(dbName)) {
    throw new Error(
      `DATABASE_URL_TEST must point at a database whose name contains "test" (got "${dbName}")`,
    );
  }
  process.env.DATABASE_URL = testDatabaseUrl;
}

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaExceptionFilter } from './../src/common/filters/prisma-exception.filter';

const PASSWORD = 'Password123!';
const describeIfDb = testDatabaseUrl ? describe : describe.skip;

type Body = Record<string, any>;

describeIfDb('Marketplace flow (e2e)', () => {
  let app: INestApplication<App>;
  const prisma = new PrismaClient();
  const tokens: Record<string, string> = {};

  const api = () => request(app.getHttpServer());
  const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });

  async function createUser(email: string, name: string, role: Role) {
    await prisma.user.create({
      data: {
        email,
        name,
        role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        passwordHash: await bcrypt.hash(PASSWORD, 4),
      },
    });
  }

  beforeAll(async () => {
    // TRUNCATE ... CASCADE clears every table, including auth tokens and audit
    // logs, so each run starts from a known-empty database.
    await prisma.$executeRawUnsafe(
      `TRUNCATE "User", "AuthToken", "Listing", "ListingImage", "Certificate",
       "VerificationRecord", "Auction", "Bid", "Order", "Payment",
       "Notification", "Report", "Dispute", "AuditLog" CASCADE`,
    );
    await createUser('seller@e2e.lk', 'Seller', Role.SELLER);
    await createUser('buyer@e2e.lk', 'Buyer', Role.BUYER);
    await createUser('appraiser@e2e.lk', 'Appraiser', Role.APPRAISER);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      // Rate limiting would throttle the burst of requests this suite makes.
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new PrismaExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });

  it('reports healthy', async () => {
    const res = await api().get('/health').expect(200);
    expect((res.body as Body).status).toBe('ok');
  });

  it('signs users in and sets httpOnly session cookies', async () => {
    for (const who of ['seller', 'buyer', 'appraiser']) {
      const res = await api()
        .post('/auth/login')
        .send({ email: `${who}@e2e.lk`, password: PASSWORD })
        .expect(200);
      tokens[who] = (res.body as Body).accessToken;

      const cookies = (res.headers['set-cookie'] as unknown as string[]) ?? [];
      expect(
        cookies.some(
          (c) => c.startsWith('access_token=') && /HttpOnly/i.test(c),
        ),
      ).toBe(true);
      expect(
        cookies.some(
          (c) => c.startsWith('refresh_token=') && /HttpOnly/i.test(c),
        ),
      ).toBe(true);
    }
  });

  it('rejects a wrong password', async () => {
    await api()
      .post('/auth/login')
      .send({ email: 'buyer@e2e.lk', password: 'nope-nope-1' })
      .expect(401);
  });

  describe('listing -> review -> auction -> bidding', () => {
    let listingId: string;
    let auctionId: string;

    it('lets a seller create a listing, which enters review', async () => {
      const res = await api()
        .post('/listings')
        .set(as('seller'))
        .send({
          title: 'Ceylon 1 Rupee 1951',
          description: 'Silver coin in very good condition.',
          category: 'OLD_COINS',
          condition: 'VERY_GOOD',
          startingPrice: 10000,
          listingType: 'AUCTION',
        })
        .expect(201);
      listingId = (res.body as Body).id;
      expect((res.body as Body).status).toBe('UNDER_REVIEW');
    });

    it('hides the unapproved listing from guests', async () => {
      await api().get(`/listings/${listingId}`).expect(404);
    });

    it('lets the seller open an auction', async () => {
      const res = await api()
        .post(`/listings/${listingId}/auction`)
        .set(as('seller'))
        .send({
          startPrice: 10000,
          minIncrement: 500,
          endTime: new Date(Date.now() + 2 * 3600_000).toISOString(),
        })
        .expect(201);
      auctionId = (res.body as Body).id;
    });

    it('refuses bids while the listing is still under review', async () => {
      await api()
        .post(`/auctions/${auctionId}/bids`)
        .set(as('buyer'))
        .send({ amount: 10000 })
        .expect(400);
    });

    it('stops a seller approving their own listing', async () => {
      await api()
        .post(`/listings/${listingId}/verification`)
        .set(as('seller'))
        .send({ decision: 'APPROVED' })
        .expect(403);
    });

    it('lets an appraiser approve it, publishing it with a verified badge', async () => {
      await api()
        .post(`/listings/${listingId}/verification`)
        .set(as('appraiser'))
        .send({ decision: 'APPROVED', appraisedValue: 12000 })
        .expect(201);

      const res = await api().get(`/listings/${listingId}`).expect(200);
      expect((res.body as Body).status).toBe('ACTIVE');
      expect((res.body as Body).isVerified).toBe(true);
    });

    it('refuses a second decision on a listing that is no longer under review', async () => {
      await api()
        .post(`/listings/${listingId}/verification`)
        .set(as('appraiser'))
        .send({ decision: 'APPROVED' })
        .expect(400);
    });

    it('accepts a valid bid', async () => {
      await api()
        .post(`/auctions/${auctionId}/bids`)
        .set(as('buyer'))
        .send({ amount: 10000 })
        .expect(201);
    });

    it('stops the seller bidding on their own item', async () => {
      await api()
        .post(`/auctions/${auctionId}/bids`)
        .set(as('seller'))
        .send({ amount: 20000 })
        .expect(403);
    });

    it('refuses a bid that does not clear the minimum increment', async () => {
      // A second bidder is needed, since the top bidder cannot raise their own bid.
      await createUser('buyer2@e2e.lk', 'Buyer Two', Role.BUYER);
      const login = await api()
        .post('/auth/login')
        .send({ email: 'buyer2@e2e.lk', password: PASSWORD })
        .expect(200);
      tokens.buyer2 = (login.body as Body).accessToken;

      await api()
        .post(`/auctions/${auctionId}/bids`)
        .set(as('buyer2'))
        .send({ amount: 10100 })
        .expect(400);
    });

    it('records bids in the history and on the auction', async () => {
      await api()
        .post(`/auctions/${auctionId}/bids`)
        .set(as('buyer2'))
        .send({ amount: 10500 })
        .expect(201);

      const history = await api()
        .get(`/auctions/${auctionId}/bids`)
        .expect(200);
      expect((history.body as Body).data).toHaveLength(2);

      const auction = await api().get(`/auctions/${auctionId}`).expect(200);
      expect(Number((auction.body as Body).currentPrice)).toBe(10500);
    });
  });
});
