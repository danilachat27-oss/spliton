import request from 'supertest';
import { Prisma, PrismaClient, ReleaseStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

describe('Public catalog (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  async function seedRelease(
    status: ReleaseStatus,
    opts?: { withArtist?: boolean; title?: string; genre?: string },
  ) {
    const prisma = new PrismaClient();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const artist = opts?.withArtist
      ? await prisma.artist.create({
          data: {
            name: `Artist ${suffix}`,
            slug: `art-${suffix}`,
          },
        })
      : null;

    const release = await prisma.release.create({
      data: {
        slug: `cat-${suffix}`,
        symbol: `CAT${Date.now() % 99999}`,
        title: opts?.title ?? 'Catalog Track',
        genre: opts?.genre ?? 'Electronic',
        segment: opts?.genre ?? 'Electronic',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(1000),
        unitsAvailablePrimary: new Prisma.Decimal(500),
        primaryUnitPrice: new Prisma.Decimal(12),
        status,
        coverUrl: 'https://cdn.example.com/cover.jpg',
        description: 'Short catalog description for tests.',
        ...(artist
          ? {
              releaseArtists: {
                create: { artistId: artist.id, role: 'MAIN' },
              },
            }
          : {}),
      },
    });

    if (status === ReleaseStatus.ACTIVE) {
      await prisma.primaryRaiseRound.create({
        data: {
          releaseId: release.id,
          status: 'LIVE',
          raiseTargetUsdt: new Prisma.Decimal(50000),
          hardCapUsdt: new Prisma.Decimal(60000),
          totalUnits: new Prisma.Decimal(1000),
          soldUnits: new Prisma.Decimal(100),
        },
      });
    }

    await prisma.$disconnect();
    return release;
  }

  it('hides draft releases from catalog list', async () => {
    const draft = await seedRelease(ReleaseStatus.DRAFT, { withArtist: true });
    const active = await seedRelease(ReleaseStatus.ACTIVE, {
      withArtist: true,
    });

    const res = await request(app!.getHttpServer()).get(
      '/api/v1/catalog/releases',
    );
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeTruthy();
    const ids = res.body.items.map((i: { id: string }) => i.id);
    expect(ids).toContain(active.id);
    expect(ids).not.toContain(draft.id);
  });

  it('returns artist name and cover on active release', async () => {
    const release = await seedRelease(ReleaseStatus.ACTIVE, {
      withArtist: true,
    });

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/catalog/releases/${release.id}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.artist).not.toBe(release.symbol);
    expect(res.body.coverUrl).toBeTruthy();
    expect(res.body.primaryRound).toBeTruthy();
    expect(res.body.purchaseState).toBe('available');
    expect(res.body.primaryUnitPriceUsdt).toBeTruthy();
  });

  it('returns release detail by slug without UUID parse error', async () => {
    const release = await seedRelease(ReleaseStatus.ACTIVE, {
      withArtist: true,
    });

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/catalog/releases/${release.slug}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(release.id);
    expect(res.body.slug).toBe(release.slug);
  });

  it('returns 404 for draft release detail', async () => {
    const draft = await seedRelease(ReleaseStatus.DRAFT, { withArtist: true });

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/catalog/releases/${draft.id}`,
    );
    expect(res.status).toBe(404);
  });

  it('legacy GET /releases hides drafts', async () => {
    const draft = await seedRelease(ReleaseStatus.DRAFT);
    const res = await request(app!.getHttpServer()).get('/releases');
    expect(res.status).toBe(200);
    const ids = res.body.map((r: { id: string }) => r.id);
    expect(ids).not.toContain(draft.id);
  });

  it('search by title returns matching release', async () => {
    const uniqueTitle = `Spliton Search ${Date.now()}`;
    const release = await seedRelease(ReleaseStatus.ACTIVE, {
      withArtist: true,
      title: uniqueTitle,
    });

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/catalog/releases?search=${encodeURIComponent(uniqueTitle)}`,
    );
    expect(res.status).toBe(200);
    const ids = res.body.items.map((i: { id: string }) => i.id);
    expect(ids).toContain(release.id);
  });

  it('genre filter returns expected items', async () => {
    const jazz = await seedRelease(ReleaseStatus.ACTIVE, {
      withArtist: true,
      genre: 'JazzCatalogTest',
    });

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/catalog/releases?genre=${encodeURIComponent('JazzCatalogTest')}`,
    );
    expect(res.status).toBe(200);
    const ids = res.body.items.map((i: { id: string }) => i.id);
    expect(ids).toContain(jazz.id);
  });

  it('genre filter matches normalized slug (electronic)', async () => {
    const release = await seedRelease(ReleaseStatus.ACTIVE, {
      withArtist: true,
      genre: 'Deep Electronic',
    });

    const res = await request(app!.getHttpServer()).get(
      '/api/v1/catalog/releases?genre=electronic',
    );
    expect(res.status).toBe(200);
    const ids = res.body.items.map((i: { id: string }) => i.id);
    expect(ids).toContain(release.id);
  });

  it('funding payouts filter uses kind=payouts without status conflict', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const prisma = new PrismaClient();
    const soldOut = await prisma.release.create({
      data: {
        slug: `payout-${suffix}`,
        symbol: `PAY${Date.now() % 99999}`,
        title: 'Payout Track',
        genre: 'Electronic',
        segment: 'Electronic',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(1000),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(12),
        status: ReleaseStatus.SOLD_OUT,
        coverUrl: 'https://cdn.example.com/cover.jpg',
        description: 'Sold out release.',
      },
    });
    await prisma.primaryRaiseRound.create({
      data: {
        releaseId: soldOut.id,
        status: 'COMPLETED',
        raiseTargetUsdt: new Prisma.Decimal(50000),
        hardCapUsdt: new Prisma.Decimal(60000),
        totalUnits: new Prisma.Decimal(1000),
        soldUnits: new Prisma.Decimal(1000),
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer()).get(
      '/api/v1/catalog/releases?kind=payouts',
    );
    expect(res.status).toBe(200);
    const ids = res.body.items.map((i: { id: string }) => i.id);
    expect(ids).toContain(soldOut.id);
  });

  it('phase open with kind=all keeps secondary market cards', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const prisma = new PrismaClient();
    const seller = await prisma.user.create({
      data: {
        email: `seller-${suffix}@example.com`,
        passwordHash: 'hash',
      },
    });
    const soldOut = await prisma.release.create({
      data: {
        slug: `sec-${suffix}`,
        symbol: `SEC${Date.now() % 99999}`,
        title: 'Secondary Track',
        genre: 'Electronic',
        segment: 'Electronic',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(1000),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(12),
        status: ReleaseStatus.SOLD_OUT,
        secondaryEnabled: true,
        coverUrl: 'https://cdn.example.com/cover.jpg',
        description: 'Secondary listing release.',
      },
    });
    await prisma.primaryRaiseRound.create({
      data: {
        releaseId: soldOut.id,
        status: 'COMPLETED',
        raiseTargetUsdt: new Prisma.Decimal(50000),
        hardCapUsdt: new Prisma.Decimal(60000),
        totalUnits: new Prisma.Decimal(1000),
        soldUnits: new Prisma.Decimal(1000),
      },
    });
    await prisma.marketListing.create({
      data: {
        releaseId: soldOut.id,
        sellerUserId: seller.id,
        status: 'ACTIVE',
        pricePerUnit: new Prisma.Decimal(15),
        unitsAvailable: new Prisma.Decimal(10),
        unitsTotal: new Prisma.Decimal(10),
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer()).get(
      '/api/v1/catalog/releases?status=open',
    );
    expect(res.status).toBe(200);
    const ids = res.body.items.map((i: { id: string }) => i.id);
    expect(ids).toContain(soldOut.id);
  });

  it('filters endpoint returns normalized genres with counts', async () => {
    await seedRelease(ReleaseStatus.ACTIVE, {
      withArtist: true,
      genre: 'FilterGenreTest',
    });

    const res = await request(app!.getHttpServer()).get('/api/v1/catalog/filters');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.genres)).toBe(true);
    if (res.body.genres.length > 0) {
      expect(res.body.genres[0]).toHaveProperty('name');
      expect(res.body.genres[0]).toHaveProperty('count');
    }
  });

  it('stats endpoint returns numbers', async () => {
    const res = await request(app!.getHttpServer()).get('/api/v1/catalog/stats');
    expect(res.status).toBe(200);
    expect(typeof res.body.publicReleases).toBe('number');
    expect(typeof res.body.activeSecondaryListings).toBe('number');
  });

  it('rejects invalid pageSize', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/catalog/releases?pageSize=500',
    );
    expect(res.status).toBe(400);
  });

  it('suggestions returns typed items for query', async () => {
    const title = `Suggest ${Date.now()}`;
    await seedRelease(ReleaseStatus.ACTIVE, { withArtist: true, title });

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/catalog/search/suggestions?q=${encodeURIComponent(title.slice(0, 8))}`,
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
