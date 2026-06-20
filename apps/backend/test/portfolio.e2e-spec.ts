import request from 'supertest';
import { Prisma, PrismaClient, ReleaseStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { seedWalletWithLedger } from './helpers/seed-wallet-ledger';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@example.com`;
}

async function seedPosition(
  userId: string,
  opts: {
    unitsTotal: string;
    unitsAvailable: string;
    unitsLocked: string;
    avgEntry: string;
    primaryPrice: string;
  },
) {
  const prisma = new PrismaClient();
  const release = await prisma.release.create({
    data: {
      slug: `pf-${Date.now()}-${Math.random()}`,
      symbol: `PF${Date.now() % 10000}`,
      title: 'Portfolio Track',
      genre: 'Electronic',
      payoutFrequency: 'MONTHLY',
      totalUnits: new Prisma.Decimal(10000),
      unitsAvailablePrimary: new Prisma.Decimal(0),
      primaryUnitPrice: new Prisma.Decimal(opts.primaryPrice),
      status: ReleaseStatus.ACTIVE,
    },
  });
  const position = await prisma.userPosition.create({
    data: {
      userId,
      releaseId: release.id,
      unitsTotal: new Prisma.Decimal(opts.unitsTotal),
      unitsAvailable: new Prisma.Decimal(opts.unitsAvailable),
      unitsLocked: new Prisma.Decimal(opts.unitsLocked),
      avgEntryPrice: new Prisma.Decimal(opts.avgEntry),
    },
  });
  await prisma.$disconnect();
  return { release, position };
}

describe('Portfolio API (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns empty portfolio for user without positions', async () => {
    const email = uniqueEmail('portfolio-empty');
    const { token } = await registerE2eUser(app!, email);

    const overview = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/overview')
      .set('Authorization', `Bearer ${token}`);
    expect(overview.status).toBe(200);
    expect(overview.body.totalValue).toBe('0.00');
    expect(overview.body.positionCount).toBe(0);
    expect(overview.body.topPositions).toEqual([]);

    const positions = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/positions')
      .set('Authorization', `Bearer ${token}`);
    expect(positions.status).toBe(200);
    expect(positions.body.items).toEqual([]);
  });

  it('returns positions with locked units and PnL', async () => {
    const email = uniqueEmail('portfolio-pos');
    const { token, userId } = await registerE2eUser(app!, email);
    await seedWalletWithLedger(userId, '1000');
    await seedPosition(userId, {
      unitsTotal: '10',
      unitsAvailable: '6',
      unitsLocked: '4',
      avgEntry: '8',
      primaryPrice: '12',
    });

    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/positions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    const row = res.body.items[0];
    expect(row.unitsTotal).toMatch(/^10(\.0+)?$/);
    expect(row.unitsLocked).toMatch(/^4(\.0+)?$/);
    expect(row.unitsAvailable).toMatch(/^6(\.0+)?$/);
    expect(row.currentPrice).toBe('12.00');
    expect(row.marketValue).toBe('120.00');
    expect(row.costBasis).toBe('80.00');
    expect(row.pnlUnrealized).toBe('40.00');
    expect(row.pnlPct).toBe('50.00');
    expect(row.availableToSell).toBe(true);
  });

  it('returns activity sorted by createdAt desc', async () => {
    const email = uniqueEmail('portfolio-act');
    const { token, userId } = await registerE2eUser(app!, email);
    const wallet = await seedWalletWithLedger(userId, '200');
    const prisma = new PrismaClient();
    const older = new Date('2026-01-01T10:00:00Z');
    const newer = new Date('2026-06-01T10:00:00Z');
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        txType: 'DEPOSIT',
        direction: 'IN',
        amount: new Prisma.Decimal(50),
        feeAmount: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(50),
        currency: 'USDT',
        status: 'COMPLETED',
        happenedAt: older,
      },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        txType: 'DEPOSIT',
        direction: 'IN',
        amount: new Prisma.Decimal(25),
        feeAmount: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(25),
        currency: 'USDT',
        status: 'COMPLETED',
        happenedAt: newer,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/activity')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    const times = res.body.items.map((i: { createdAt: string }) =>
      new Date(i.createdAt).getTime(),
    );
    for (let i = 1; i < times.length; i++) {
      expect(times[i - 1]).toBeGreaterThanOrEqual(times[i]);
    }
  });

  it('returns 401 for portfolio overview without auth', async () => {
    const res = await request(app!.getHttpServer()).get('/api/v1/portfolio/overview');
    expect(res.status).toBe(401);
  });

  it('returns empty value chart for user without history', async () => {
    const email = uniqueEmail('portfolio-chart');
    const { token } = await registerE2eUser(app!, email);

    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/charts/value?period=30d')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.points)).toBe(true);
  });

  it('returns empty payouts chart for user without payouts', async () => {
    const email = uniqueEmail('portfolio-payouts-chart');
    const { token } = await registerE2eUser(app!, email);

    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/charts/payouts?period=30d')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.points)).toBe(true);
  });
});
