import request from 'supertest';
import {
  OwnershipEventType,
  Prisma,
  PrismaClient,
  ReleaseStatus,
  UserRoleCode,
} from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { seedWalletWithLedger } from './helpers/seed-wallet-ledger';

async function staffToken(app: E2eApp, role: UserRoleCode): Promise<string> {
  const email = `e2e-cutoff-${role.toLowerCase()}-${Date.now()}@example.com`;
  await registerE2eUser(app, email);
  const prisma = new PrismaClient();
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const roleRow = await prisma.role.findUniqueOrThrow({ where: { code: role } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: roleRow.id } },
    create: { userId: user.id, roleId: roleRow.id },
    update: {},
  });
  await prisma.$disconnect();
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'TestPass123!' });
  return login.body.tokens.accessToken as string;
}

async function approveAndRun(
  app: E2eApp,
  adminToken: string,
  eventId: string,
  idem: string,
) {
  await request(app.getHttpServer())
    .post('/api/admin/v1/distributions/preview/save')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ revenueEventId: eventId })
    .expect(201);
  await request(app.getHttpServer())
    .post(`/api/admin/v1/revenue-events/${eventId}/submit-review`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(201);
  await request(app.getHttpServer())
    .post(`/api/admin/v1/revenue-events/${eventId}/approve`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(201);
  return request(app.getHttpServer())
    .post('/api/admin/v1/distributions/run')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('Idempotency-Key', idem)
    .send({ revenueEventId: eventId });
}

describe('Revenue payout cutoff model (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('pays seller who held units at period cutoff after post-cutoff transfer', async () => {
    const adminToken = await staffToken(app!, UserRoleCode.SUPER_ADMIN);
    const seller = await registerE2eUser(app!, `cutoff-seller-${Date.now()}@example.com`);
    const buyer = await registerE2eUser(app!, `cutoff-buyer-${Date.now()}@example.com`);
    await seedWalletWithLedger(seller.userId, '100');
    await seedWalletWithLedger(buyer.userId, '100');

    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `cutoff-${Date.now()}`,
        symbol: `CO${Date.now() % 9999}`,
        title: 'Cutoff Track',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(100),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(10),
        status: ReleaseStatus.ACTIVE,
        holderSharePct: new Prisma.Decimal(100),
        platformSharePct: new Prisma.Decimal(0),
        artistSharePct: new Prisma.Decimal(0),
      },
    });

    const periodEnd = new Date('2026-01-31T00:00:00.000Z');
    const beforeCutoff = new Date('2026-01-20T12:00:00.000Z');
    const afterCutoff = new Date('2026-02-05T12:00:00.000Z');

    for (const userId of [seller.userId, buyer.userId]) {
      await prisma.userPosition.upsert({
        where: { userId_releaseId: { userId, releaseId: release.id } },
        create: {
          userId,
          releaseId: release.id,
          unitsTotal: userId === seller.userId ? new Prisma.Decimal(10) : new Prisma.Decimal(0),
          unitsAvailable:
            userId === seller.userId ? new Prisma.Decimal(10) : new Prisma.Decimal(0),
          unitsLocked: new Prisma.Decimal(0),
          avgEntryPrice: new Prisma.Decimal(10),
        },
        update: {
          unitsTotal: userId === seller.userId ? new Prisma.Decimal(10) : new Prisma.Decimal(0),
          unitsAvailable:
            userId === seller.userId ? new Prisma.Decimal(10) : new Prisma.Decimal(0),
          unitsLocked: new Prisma.Decimal(0),
        },
      });
    }

    await prisma.ownershipLedger.create({
      data: {
        userId: seller.userId,
        releaseId: release.id,
        eventType: OwnershipEventType.PRIMARY_BUY,
        unitsDelta: new Prisma.Decimal(10),
        pricePerUnit: new Prisma.Decimal(10),
        happenedAt: beforeCutoff,
      },
    });
    await prisma.ownershipLedger.createMany({
      data: [
        {
          userId: seller.userId,
          releaseId: release.id,
          eventType: OwnershipEventType.SECONDARY_SELL,
          unitsDelta: new Prisma.Decimal(-10),
          pricePerUnit: new Prisma.Decimal(12),
          happenedAt: afterCutoff,
        },
        {
          userId: buyer.userId,
          releaseId: release.id,
          eventType: OwnershipEventType.SECONDARY_BUY,
          unitsDelta: new Prisma.Decimal(10),
          pricePerUnit: new Prisma.Decimal(12),
          happenedAt: afterCutoff,
        },
      ],
    });
    await prisma.$disconnect();

    const create = await request(app!.getHttpServer())
      .post('/api/admin/v1/revenue-events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        trackId: release.id,
        grossRevenue: '1000',
        source: 'streaming',
        periodFrom: '2026-01-01',
        periodTo: '2026-01-31',
      });
    expect(create.status).toBe(201);
    const eventId = create.body.id as string;

    const preview = await request(app!.getHttpServer())
      .post('/api/admin/v1/distributions/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ revenueEventId: eventId });
    expect(preview.status).toBe(201);
    expect(preview.body.holders).toHaveLength(1);
    expect(preview.body.holders[0].userId).toBe(seller.userId);
    expect(preview.body.holders[0].units).toBe('10');

    const run = await approveAndRun(
      app!,
      adminToken,
      eventId,
      `cutoff-idem-${Date.now()}`,
    );
    expect(run.status).toBe(201);

    const prisma2 = new PrismaClient();
    const sellerPayout = await prisma2.payout.findFirst({
      where: { userId: seller.userId, releaseId: release.id },
    });
    const buyerPayout = await prisma2.payout.findFirst({
      where: { userId: buyer.userId, releaseId: release.id },
    });
    await prisma2.$disconnect();
    expect(sellerPayout).toBeTruthy();
    expect(Number(sellerPayout!.amountNet.toString())).toBe(1000);
    expect(buyerPayout).toBeNull();
  });

  it('splits payout when partial sale happens before cutoff', async () => {
    const adminToken = await staffToken(app!, UserRoleCode.SUPER_ADMIN);
    const seller = await registerE2eUser(app!, `split-seller-${Date.now()}@example.com`);
    const buyer = await registerE2eUser(app!, `split-buyer-${Date.now()}@example.com`);
    await seedWalletWithLedger(seller.userId, '100');
    await seedWalletWithLedger(buyer.userId, '100');

    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `split-${Date.now()}`,
        symbol: `SP${Date.now() % 9999}`,
        title: 'Split Track',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(100),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(10),
        status: ReleaseStatus.ACTIVE,
        holderSharePct: new Prisma.Decimal(100),
        platformSharePct: new Prisma.Decimal(0),
        artistSharePct: new Prisma.Decimal(0),
      },
    });

    const beforeCutoff = new Date('2026-01-20T12:00:00.000Z');
    await prisma.ownershipLedger.createMany({
      data: [
        {
          userId: seller.userId,
          releaseId: release.id,
          eventType: OwnershipEventType.PRIMARY_BUY,
          unitsDelta: new Prisma.Decimal(10),
          pricePerUnit: new Prisma.Decimal(10),
          happenedAt: new Date('2026-01-10T12:00:00.000Z'),
        },
        {
          userId: seller.userId,
          releaseId: release.id,
          eventType: OwnershipEventType.SECONDARY_SELL,
          unitsDelta: new Prisma.Decimal(-4),
          pricePerUnit: new Prisma.Decimal(12),
          happenedAt: beforeCutoff,
        },
        {
          userId: buyer.userId,
          releaseId: release.id,
          eventType: OwnershipEventType.SECONDARY_BUY,
          unitsDelta: new Prisma.Decimal(4),
          pricePerUnit: new Prisma.Decimal(12),
          happenedAt: beforeCutoff,
        },
      ],
    });
    await prisma.$disconnect();

    const create = await request(app!.getHttpServer())
      .post('/api/admin/v1/revenue-events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        trackId: release.id,
        grossRevenue: '1000',
        source: 'streaming',
        periodFrom: '2026-01-01',
        periodTo: '2026-01-31',
      });
    const eventId = create.body.id as string;

    const preview = await request(app!.getHttpServer())
      .post('/api/admin/v1/distributions/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ revenueEventId: eventId });
    expect(preview.status).toBe(201);
    const sellerRow = preview.body.holders.find(
      (h: { userId: string }) => h.userId === seller.userId,
    );
    const buyerRow = preview.body.holders.find(
      (h: { userId: string }) => h.userId === buyer.userId,
    );
    expect(sellerRow.units).toBe('6');
    expect(buyerRow.units).toBe('4');
    expect(Number(sellerRow.payoutAmount)).toBe(600);
    expect(Number(buyerRow.payoutAmount)).toBe(400);
  });
});
