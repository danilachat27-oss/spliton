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
    titleSuffix?: string;
  },
) {
  const prisma = new PrismaClient();
  const suffix = opts.titleSuffix ?? '';
  const release = await prisma.release.create({
    data: {
      slug: `pp-${Date.now()}-${Math.random()}${suffix}`,
      symbol: `PP${Date.now() % 10000}${suffix}`,
      title: `Portfolio Track${suffix}`,
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

describe('Portfolio positions (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns 401 without auth', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/portfolio/positions',
    );
    expect(res.status).toBe(401);
  });

  it('returns empty list for user without positions', async () => {
    const email = uniqueEmail('pp-empty');
    const { token } = await registerE2eUser(app!, email);
    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/positions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('paginates positions', async () => {
    const email = uniqueEmail('pp-page');
    const { token, userId } = await registerE2eUser(app!, email);
    await seedWalletWithLedger(userId, '1000');
    for (let i = 0; i < 3; i++) {
      await seedPosition(userId, {
        unitsTotal: String(5 + i),
        unitsAvailable: String(5 + i),
        unitsLocked: '0',
        avgEntry: '10',
        primaryPrice: '12',
        titleSuffix: `-${i}`,
      });
    }

    const p1 = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/positions?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);
    expect(p1.status).toBe(200);
    expect(p1.body.items).toHaveLength(2);
    expect(p1.body.total).toBeGreaterThanOrEqual(3);

    const p2 = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/positions?page=2&limit=2')
      .set('Authorization', `Bearer ${token}`);
    expect(p2.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it('filters by hasAvailableUnits=true', async () => {
    const email = uniqueEmail('pp-avail');
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
      .get('/api/v1/portfolio/positions?hasAvailableUnits=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(Number(res.body.items[0].unitsAvailable)).toBeGreaterThan(0);
  });

  it('rejects invalid sort with 400', async () => {
    const email = uniqueEmail('pp-sort');
    const { token } = await registerE2eUser(app!, email);
    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/positions?sort=invalid_sort')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('returns extended position fields', async () => {
    const email = uniqueEmail('pp-fields');
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
    const row = res.body.items[0];
    expect(row).toHaveProperty('listedUnits');
    expect(row).toHaveProperty('liquidityPercent');
    expect(row).toHaveProperty('hasMarketPrice');
    expect(row).toHaveProperty('canBuyMore');
    expect(row).toHaveProperty('activeListingsCount');
    expect(row).toHaveProperty('totalInvestedUsdt');
  });
});
