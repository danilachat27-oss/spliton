import request from 'supertest';
import {
  Prisma,
  PrismaClient,
  PriceBucket,
  ReleaseStatus,
} from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { seedWalletWithLedger } from './helpers/seed-wallet-ledger';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@example.com`;
}

async function registerAndLogin(app: E2eApp, email: string) {
  const { token, userId } = await registerE2eUser(app, email);
  return { token, userId };
}

describe('Secondary market depth & detail (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns listing detail with market summary', async () => {
    const seller = await registerAndLogin(app!, uniqueEmail('depth-seller'));
    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `e2e-depth-${Date.now()}`,
        symbol: `DP${Date.now() % 10000}`,
        title: 'Depth Track',
        genre: 'electronic',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(100),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(5),
        status: ReleaseStatus.ACTIVE,
      },
    });
    await prisma.userPosition.create({
      data: {
        userId: seller.userId,
        releaseId: release.id,
        unitsTotal: new Prisma.Decimal(10),
        unitsAvailable: new Prisma.Decimal(10),
        unitsLocked: new Prisma.Decimal(0),
        avgEntryPrice: new Prisma.Decimal(5),
      },
    });
    await prisma.$disconnect();

    const listingRes = await request(app!.getHttpServer())
      .post('/api/v1/market/listings')
      .set('Authorization', `Bearer ${seller.token}`)
      .send({ releaseId: release.id, units: 2, pricePerUnit: 15 });
    expect(listingRes.status).toBe(201);

    const detail = await request(app!.getHttpServer())
      .get(`/api/v1/market/listings/${listingRes.body.id}`)
      .set('Authorization', `Bearer ${seller.token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.listing.id).toBe(listingRes.body.id);
    expect(detail.body.release.slug).toBe(release.slug);
    expect(detail.body.seller.id).toBeTruthy();
    expect(detail.body.seller.displayName).toMatch(/\*\*\*/);
    expect(detail.body.marketSummary).toBeDefined();
    expect(detail.body.permissions.canCancel).toBe(true);
  });

  it('returns 404 for missing listing', async () => {
    const user = await registerAndLogin(app!, uniqueEmail('depth-404'));
    const res = await request(app!.getHttpServer())
      .get(`/api/v1/market/listings/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(404);
  });

  it('returns order book depth for active release', async () => {
    const seller = await registerAndLogin(app!, uniqueEmail('depth-book'));
    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `e2e-book-${Date.now()}`,
        symbol: `BK${Date.now() % 10000}`,
        title: 'Book Track',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(50),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(8),
        status: ReleaseStatus.ACTIVE,
      },
    });
    await prisma.userPosition.create({
      data: {
        userId: seller.userId,
        releaseId: release.id,
        unitsTotal: new Prisma.Decimal(5),
        unitsAvailable: new Prisma.Decimal(5),
        unitsLocked: new Prisma.Decimal(0),
        avgEntryPrice: new Prisma.Decimal(8),
      },
    });
    await prisma.$disconnect();

    await request(app!.getHttpServer())
      .post('/api/v1/market/listings')
      .set('Authorization', `Bearer ${seller.token}`)
      .send({ releaseId: release.id, units: 1, pricePerUnit: 20 });

    const depth = await request(app!.getHttpServer())
      .get(`/api/v1/market/depth?releaseId=${release.id}`)
      .set('Authorization', `Bearer ${seller.token}`);
    expect(depth.status).toBe(200);
    expect(depth.body.asks.length).toBeGreaterThanOrEqual(1);
    expect(depth.body.symbol).toBeTruthy();
    expect(depth.body.updatedAt).toBeTruthy();
    expect(depth.body.asksAggregated).toBeDefined();
  });

  it('returns terminal summary and order preview', async () => {
    const seller = await registerAndLogin(app!, uniqueEmail('term-seller'));
    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `e2e-term-${Date.now()}`,
        symbol: `TM${Date.now() % 10000}`,
        title: 'Terminal Track',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(50),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(8),
        status: ReleaseStatus.ACTIVE,
      },
    });
    await prisma.userPosition.create({
      data: {
        userId: seller.userId,
        releaseId: release.id,
        unitsTotal: new Prisma.Decimal(5),
        unitsAvailable: new Prisma.Decimal(5),
        unitsLocked: new Prisma.Decimal(0),
        avgEntryPrice: new Prisma.Decimal(8),
      },
    });
    await prisma.$disconnect();

    await request(app!.getHttpServer())
      .post('/api/v1/market/listings')
      .set('Authorization', `Bearer ${seller.token}`)
      .send({ releaseId: release.id, units: 2, pricePerUnit: 25 });

    const terminal = await request(app!.getHttpServer())
      .get(`/api/v1/market/terminal/${release.slug}`)
      .set('Authorization', `Bearer ${seller.token}`);
    expect(terminal.status).toBe(200);
    expect(terminal.body.pair).toContain('/USDT');
    expect(terminal.body.lastPrice).toBeTruthy();

    const preview = await request(app!.getHttpServer())
      .post('/api/v1/market/orders/preview')
      .set('Authorization', `Bearer ${seller.token}`)
      .send({
        marketId: release.slug,
        side: 'SELL',
        type: 'LIMIT',
        price: 26,
        units: 1,
      });
    expect(preview.status).toBe(200);
    expect(preview.body.canSubmit).toBe(true);
    expect(Number(preview.body.subtotal)).toBeGreaterThan(0);
  });

  it('returns ordered price history', async () => {
    const user = await registerAndLogin(app!, uniqueEmail('depth-prices'));
    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `e2e-ph-${Date.now()}`,
        symbol: `PH${Date.now() % 10000}`,
        title: 'PH Track',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(10),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(5),
        status: ReleaseStatus.ACTIVE,
      },
    });
    const t2 = new Date();
    t2.setUTCHours(0, 0, 0, 0);
    const t1 = new Date(t2);
    t1.setUTCDate(t1.getUTCDate() - 1);
    await prisma.priceHistory.createMany({
      data: [
        {
          releaseId: release.id,
          bucket: PriceBucket.D1,
          ts: t2,
          openPrice: 11,
          highPrice: 12,
          lowPrice: 10,
          closePrice: 11.5,
          volumeUnits: 1,
          volumeNotional: 11.5,
        },
        {
          releaseId: release.id,
          bucket: PriceBucket.D1,
          ts: t1,
          openPrice: 10,
          highPrice: 10.5,
          lowPrice: 9.5,
          closePrice: 10,
          volumeUnits: 1,
          volumeNotional: 10,
        },
      ],
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .get(`/api/v1/market/prices?releaseId=${release.id}&bucket=D1&period=30d`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.points.length).toBe(2);
    expect(new Date(res.body.points[0].ts).getTime()).toBeLessThan(
      new Date(res.body.points[1].ts).getTime(),
    );
  });

  it('depth ask levels decrease after trade', async () => {
    const seller = await registerAndLogin(app!, uniqueEmail('depth-trade-s'));
    const buyer = await registerAndLogin(app!, uniqueEmail('depth-trade-b'));
    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `e2e-trade-depth-${Date.now()}`,
        symbol: `TD${Date.now() % 10000}`,
        title: 'Trade Depth',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(20),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(5),
        status: ReleaseStatus.ACTIVE,
      },
    });
    await prisma.userPosition.create({
      data: {
        userId: seller.userId,
        releaseId: release.id,
        unitsTotal: new Prisma.Decimal(3),
        unitsAvailable: new Prisma.Decimal(3),
        unitsLocked: new Prisma.Decimal(0),
        avgEntryPrice: new Prisma.Decimal(10),
      },
    });
    await prisma.$disconnect();
    await seedWalletWithLedger(seller.userId, '0');
    await seedWalletWithLedger(buyer.userId, '500');

    const listingRes = await request(app!.getHttpServer())
      .post('/api/v1/market/listings')
      .set('Authorization', `Bearer ${seller.token}`)
      .send({ releaseId: release.id, units: 1, pricePerUnit: 25 });
    const listingId = listingRes.body.id as string;

    const before = await request(app!.getHttpServer())
      .get(`/api/v1/market/depth?releaseId=${release.id}`)
      .set('Authorization', `Bearer ${buyer.token}`);
    expect(before.body.asks.length).toBe(1);

    await request(app!.getHttpServer())
      .post('/api/v1/market/trades')
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({ listingId });

    const after = await request(app!.getHttpServer())
      .get(`/api/v1/market/depth?releaseId=${release.id}`)
      .set('Authorization', `Bearer ${buyer.token}`);
    expect(after.body.asks.length).toBe(0);
  });
});
