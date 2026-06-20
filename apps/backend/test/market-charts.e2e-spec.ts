import { INestApplication } from '@nestjs/common';
import { PriceBucket, Prisma, PrismaClient, ReleaseStatus } from '@prisma/client';
import request from 'supertest';
import { createE2eApp } from './helpers/create-e2e-app';
import { e2eSlug, e2eSymbol } from './helpers/e2e-unique';

describe('Market charts (e2e)', () => {
  let app: INestApplication;
  let releaseId: string;

  beforeEach(async () => {
    app = await createE2eApp();
    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: e2eSlug('chart-rel'),
        symbol: e2eSymbol('C'),
        title: 'Chart Test Release',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(1000),
        unitsAvailablePrimary: new Prisma.Decimal(500),
        primaryUnitPrice: new Prisma.Decimal(10),
        status: ReleaseStatus.ACTIVE,
      },
    });
    releaseId = release.id;
    await prisma.priceHistory.create({
      data: {
        releaseId,
        bucket: PriceBucket.D1,
        ts: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        openPrice: 10,
        highPrice: 11,
        lowPrice: 9,
        closePrice: 10.5,
        volumeUnits: 100,
        volumeNotional: 1000,
      },
    });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/market/charts/price returns chart DTO', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/market/charts/price')
      .query({ releaseId, period: '30d' })
      .expect(200);

    expect(res.body.period).toBe('30d');
    expect(res.body.points.length).toBeGreaterThan(0);
    expect(res.body.source).toBe('price_history');
  });

  it('rejects invalid period', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/market/charts/price')
      .query({ releaseId, period: 'invalid' })
      .expect(400);
  });
});
