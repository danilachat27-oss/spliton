import request from 'supertest';
import { Prisma, PrismaClient, ReleaseStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

describe('Market overview (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  async function seedPublicRelease(
    status: ReleaseStatus = ReleaseStatus.ACTIVE,
  ) {
    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `mo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        symbol: `MO${Date.now() % 99999}`,
        title: 'Market Overview Track',
        genre: 'Electronic',
        segment: 'Electronic',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(1000),
        unitsAvailablePrimary: new Prisma.Decimal(400),
        primaryUnitPrice: new Prisma.Decimal(15),
        status,
      },
    });
    await prisma.$disconnect();
    return release;
  }

  it('returns paginated public releases without auth', async () => {
    await seedPublicRelease();

    const res = await request(app!.getHttpServer()).get(
      '/api/v1/market/overview?page=1&pageSize=10',
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.pagination).toBeTruthy();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.pageSize).toBe(10);
    expect(typeof res.body.pagination.total).toBe('number');
  });

  it('returns market overview stats', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/market/overview/stats?period=24h',
    );
    expect(res.status).toBe(200);
    expect(res.body.period).toBe('24h');
    expect(res.body.totals).toBeTruthy();
    expect(typeof res.body.totals.publicReleases).toBe('number');
  });

  it('returns market overview charts', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/market/overview/charts?period=30d',
    );
    expect(res.status).toBe(200);
    expect(res.body.period).toBe('30d');
    expect(res.body.series).toBeTruthy();
  });

  it('rejects invalid pageSize', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/market/overview?pageSize=500',
    );
    expect(res.status).toBe(400);
  });

  it('returns active public releases in overview', async () => {
    const release = await seedPublicRelease();

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/market/overview?search=${encodeURIComponent(release.symbol)}`,
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    const row = res.body.items.find((i: { id: string }) => i.id === release.id);
    expect(row).toBeTruthy();
    expect(row.artist).toBeTruthy();
    expect(row.genre).toBeTruthy();
  });

  it('filters overview by genre', async () => {
    await seedPublicRelease();
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/market/overview?genre=electronic',
    );
    expect(res.status).toBe(200);
    for (const item of res.body.items) {
      expect(
        item.genre.toLowerCase().includes('electronic') ||
          item.segment.toLowerCase().includes('electronic'),
      ).toBe(true);
    }
  });

  it('returns summary alias and depth endpoints', async () => {
    const summary = await request(app!.getHttpServer()).get(
      '/api/v1/market/overview/summary?period=7d',
    );
    expect(summary.status).toBe(200);
    expect(summary.body.period).toBe('7d');

    const depth = await request(app!.getHttpServer()).get(
      '/api/v1/market/overview/depth?period=7d',
    );
    expect(depth.status).toBe(200);
    expect(typeof depth.body.activeListings).toBe('number');
  });

  it('returns listings and trades feeds', async () => {
    const listings = await request(app!.getHttpServer()).get(
      '/api/v1/market/overview/listings?page=1&limit=5',
    );
    expect(listings.status).toBe(200);
    expect(Array.isArray(listings.body.items)).toBe(true);
    expect(listings.body.pagination).toBeTruthy();

    const trades = await request(app!.getHttpServer()).get(
      '/api/v1/market/overview/trades?page=1&limit=5',
    );
    expect(trades.status).toBe(200);
    expect(Array.isArray(trades.body.items)).toBe(true);
  });

  it('returns detail for public release', async () => {
    const release = await seedPublicRelease();

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/market/overview/${release.id}?period=30d`,
    );
    expect(res.status).toBe(200);
    expect(res.body.release.id).toBe(release.id);
    expect(res.body.market).toBeTruthy();
    expect(res.body.priceHistory.points).toBeInstanceOf(Array);
    expect(res.body.recentTrades).toBeInstanceOf(Array);
    expect(res.body.depthSummary).toBeTruthy();
  });

  it('does not expose draft releases in overview', async () => {
    const prisma = new PrismaClient();
    const draft = await prisma.release.create({
      data: {
        slug: `mo-draft-${Date.now()}`,
        symbol: `DR${Date.now() % 99999}`,
        title: 'Draft Secret',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(100),
        unitsAvailablePrimary: new Prisma.Decimal(100),
        primaryUnitPrice: new Prisma.Decimal(5),
        status: ReleaseStatus.DRAFT,
      },
    });
    await prisma.$disconnect();

    const list = await request(app!.getHttpServer()).get(
      '/api/v1/market/overview',
    );
    expect(list.status).toBe(200);
    expect(list.body.items.some((i: { id: string }) => i.id === draft.id)).toBe(
      false,
    );

    const detail = await request(app!.getHttpServer()).get(
      `/api/v1/market/overview/${draft.id}`,
    );
    expect(detail.status).toBe(404);
  });
});
