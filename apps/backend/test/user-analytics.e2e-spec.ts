import request from 'supertest';
import { Prisma, PrismaClient, ReleaseStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { e2eEmail, e2eSlug, e2eSymbol } from './helpers/e2e-unique';

async function registerAndLogin(app: E2eApp, email: string) {
  const { token, userId } = await registerE2eUser(app, email);
  return { token, userId };
}

async function seedReleaseWithPosition(userId: string) {
  const prisma = new PrismaClient();
  const release = await prisma.release.create({
    data: {
      slug: e2eSlug('ua'),
      symbol: e2eSymbol('UA'),
      title: 'Analytics Track',
      genre: 'Electronic',
      payoutFrequency: 'MONTHLY',
      totalUnits: new Prisma.Decimal(1000),
      unitsAvailablePrimary: new Prisma.Decimal(500),
      primaryUnitPrice: new Prisma.Decimal(12),
      status: ReleaseStatus.ACTIVE,
      holderSharePct: new Prisma.Decimal(26),
    },
  });
  await prisma.userPosition.create({
    data: {
      userId,
      releaseId: release.id,
      unitsTotal: new Prisma.Decimal(10),
      unitsAvailable: new Prisma.Decimal(8),
      unitsLocked: new Prisma.Decimal(2),
      avgEntryPrice: new Prisma.Decimal(10),
    },
  });
  await prisma.$disconnect();
  return release;
}

async function seedPublicReleaseForAnalytics() {
  const prisma = new PrismaClient();
  const release = await prisma.release.create({
    data: {
      slug: e2eSlug('ua-pub-list'),
      symbol: e2eSymbol('UAL'),
      title: 'Public Analytics Track',
      genre: 'Electronic',
      payoutFrequency: 'MONTHLY',
      totalUnits: new Prisma.Decimal(1000),
      unitsAvailablePrimary: new Prisma.Decimal(400),
      primaryUnitPrice: new Prisma.Decimal(12),
      status: ReleaseStatus.ACTIVE,
    },
  });
  await prisma.$disconnect();
  return release;
}

describe('User analytics (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns public analytics list without auth', async () => {
    await seedPublicReleaseForAnalytics();

    const res = await request(app!.getHttpServer()).get(
      '/api/v1/analytics/releases?page=1&pageSize=10',
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.pagination).toBeTruthy();
    expect(res.body.stats).toBeTruthy();
  });

  it('returns analytics overview', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/analytics/releases/overview?period=30d',
    );
    expect(res.status).toBe(200);
    expect(res.body.period).toBe('30d');
    expect(res.body.kpis).toBeTruthy();
    expect(Array.isArray(res.body.yieldDynamics)).toBe(true);
  });

  it('returns analytics timeseries', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/analytics/releases/timeseries?period=30d',
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.primaryVolume)).toBe(true);
    expect(Array.isArray(res.body.secondaryVolume)).toBe(true);
  });

  it('returns analytics table endpoint', async () => {
    await seedPublicReleaseForAnalytics();
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/analytics/releases/table?page=1&pageSize=5',
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('returns analytics compare and funnel', async () => {
    const compare = await request(app!.getHttpServer()).get(
      '/api/v1/analytics/releases/compare?period=30d&limit=5',
    );
    expect(compare.status).toBe(200);
    expect(Array.isArray(compare.body.items)).toBe(true);

    const funnel = await request(app!.getHttpServer()).get(
      '/api/v1/analytics/releases/funnel?period=30d',
    );
    expect(funnel.status).toBe(200);
    expect(funnel.body.steps).toBeTruthy();
  });

  it('rejects invalid pageSize on analytics list', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/analytics/releases?pageSize=500',
    );
    expect(res.status).toBe(400);
  });

  it('returns paginated public releases for guest', async () => {
    await seedPublicReleaseForAnalytics();

    const res = await request(app!.getHttpServer()).get(
      '/api/v1/analytics/releases?page=1&pageSize=5',
    );
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.pagination.page).toBe(1);
  });

  it('lists analytics with personal fields for owner', async () => {
    const email = e2eEmail('ua-list');
    const { token, userId } = await registerAndLogin(app!, email);
    const release = await seedReleaseWithPosition(userId);

    const res = await request(app!.getHttpServer())
      .get(`/api/v1/analytics/releases?search=${encodeURIComponent(release.symbol)}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const row = res.body.items.find((i: { id: string }) => i.id === release.id);
    expect(row).toBeTruthy();
    expect(row.userUnits).toBeTruthy();
  });

  it('returns detail with holding for owner', async () => {
    const email = e2eEmail('ua-detail');
    const { token, userId } = await registerAndLogin(app!, email);
    const release = await seedReleaseWithPosition(userId);

    const res = await request(app!.getHttpServer())
      .get(`/api/v1/analytics/releases/${release.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.release.id).toBe(release.id);
    expect(res.body.holding).toBeTruthy();
    expect(res.body.holding.unitsLocked).toMatch(/^2(\.0+)?$/);
  });

  it('denies ledger without position', async () => {
    const email = e2eEmail('ua-ledger');
    const { token } = await registerAndLogin(app!, email);
    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: e2eSlug('ua-x'),
        symbol: e2eSymbol('UAX'),
        title: 'Other',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(100),
        unitsAvailablePrimary: new Prisma.Decimal(100),
        primaryUnitPrice: new Prisma.Decimal(5),
        status: ReleaseStatus.ACTIVE,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .get(`/api/v1/analytics/releases/${release.id}/ledger`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('exposes public market endpoint without auth', async () => {
    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: e2eSlug('ua-pub'),
        symbol: e2eSymbol('PUB'),
        title: 'Public',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(100),
        unitsAvailablePrimary: new Prisma.Decimal(100),
        primaryUnitPrice: new Prisma.Decimal(5),
        status: ReleaseStatus.ACTIVE,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/analytics/releases/${release.id}/market`,
    );
    expect(res.status).toBe(200);
    expect(res.body.rows).toBeInstanceOf(Array);
  });
});
