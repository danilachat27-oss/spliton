import request from 'supertest';
import {
  Prisma,
  PrismaClient,
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

describe('Secondary market (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('creates listing, locks units, and completes trade', async () => {
    const sellerEmail = uniqueEmail('sm-seller');
    const buyerEmail = uniqueEmail('sm-buyer');
    const seller = await registerAndLogin(app!, sellerEmail);
    const buyer = await registerAndLogin(app!, buyerEmail);

    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `e2e-sm-${Date.now()}`,
        symbol: `SM${Date.now() % 10000}`,
        title: 'SM Release',
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

    await seedWalletWithLedger(seller.userId, '0');
    const buyerWallet = await seedWalletWithLedger(buyer.userId, '500');
    const buyerWalletId = buyerWallet.id;

    const listingRes = await request(app!.getHttpServer())
      .post('/api/v1/market/listings')
      .set('Authorization', `Bearer ${seller.token}`)
      .send({ releaseId: release.id, units: 3, pricePerUnit: 10 });
    expect(listingRes.status).toBe(201);
    const listingId = listingRes.body.id as string;

    const prisma2 = new PrismaClient();
    const posAfterList = await prisma2.userPosition.findUnique({
      where: {
        userId_releaseId: { userId: seller.userId, releaseId: release.id },
      },
    });
    await prisma2.$disconnect();
    expect(posAfterList!.unitsLocked.toString()).toBe('3');

    const tradeRes = await request(app!.getHttpServer())
      .post('/api/v1/market/trades')
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({ listingId });
    expect(tradeRes.status).toBe(201);

    const prisma3 = new PrismaClient();
    const listing = await prisma3.marketListing.findUnique({
      where: { id: listingId },
    });
    const feeCount = await prisma3.fee.count({
      where: { feeCode: 'secondary_market_fee', subjectId: listingId },
    });
    const buyerBal = await prisma3.walletBalance.findUnique({
      where: { walletId: buyerWalletId },
    });
    await prisma3.$disconnect();

    expect(listing!.status).toBe('SOLD_OUT');
    expect(feeCount).toBeGreaterThanOrEqual(1);
    expect(buyerBal!.available.lessThan(new Prisma.Decimal(500))).toBe(true);

    const prices = await request(app!.getHttpServer())
      .get(`/api/v1/market/prices?releaseId=${release.id}&bucket=D1&period=30d`)
      .set('Authorization', `Bearer ${buyer.token}`);
    expect(prices.status).toBe(200);
    expect(prices.body.points.length).toBeGreaterThanOrEqual(1);
  });

  it('returns rich listing fields for market catalog', async () => {
    const sellerEmail = uniqueEmail('sm-rich');
    const buyerEmail = uniqueEmail('sm-rich-buyer');
    const seller = await registerAndLogin(app!, sellerEmail);
    await registerAndLogin(app!, buyerEmail);

    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `e2e-rich-${Date.now()}`,
        symbol: `RCH${Date.now() % 10000}`,
        title: 'Rich Listing Track',
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
        unitsTotal: new Prisma.Decimal(5),
        unitsAvailable: new Prisma.Decimal(5),
        unitsLocked: new Prisma.Decimal(0),
        avgEntryPrice: new Prisma.Decimal(10),
      },
    });
    await prisma.$disconnect();

    const createRes = await request(app!.getHttpServer())
      .post('/api/v1/market/listings')
      .set('Authorization', `Bearer ${seller.token}`)
      .send({ releaseId: release.id, units: 2, pricePerUnit: 12 });
    expect(createRes.status).toBe(201);
    expect(createRes.body.title).toBe('Rich Listing Track');
    expect(createRes.body.artist).toBeTruthy();
    expect(createRes.body.genre).toBe('electronic');
    expect(createRes.body.canCancel).toBe(true);

    const listRes = await request(app!.getHttpServer())
      .get('/api/v1/market/listings')
      .set('Authorization', `Bearer ${seller.token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.items.length).toBeGreaterThanOrEqual(1);
    const item = listRes.body.items.find(
      (l: { id: string }) => l.id === createRes.body.id,
    );
    expect(item).toBeTruthy();
    expect(item.symbol).toBeTruthy();
    expect(item.payoutSparkline).toBeDefined();
    expect(item.liquidity).toMatch(/high|med|low/);
    expect(item.statusLabel).toBeTruthy();
  });
});
