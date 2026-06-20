import request from 'supertest';
import {
  OwnershipEventType,
  Prisma,
  PrismaClient,
  ReleaseStatus,
  UserRoleCode,
  UserStatus,
} from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { seedWalletWithLedger } from './helpers/seed-wallet-ledger';

function staffEmail(prefix: string): string {
  return `e2e-revenue-${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const { token } = await registerE2eUser(app, email);
  return token;
}

async function assignRole(email: string, roleCode: UserRoleCode) {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (user && role) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      create: { userId: user.id, roleId: role.id },
      update: {},
    });
  }
  await prisma.$disconnect();
  return user!.id;
}

async function staffToken(app: E2eApp, role: UserRoleCode): Promise<string> {
  const email = staffEmail(role.toLowerCase());
  await registerUser(app, email);
  await assignRole(email, role);
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'TestPass123!' });
  return login.body.tokens.accessToken as string;
}

async function seedReleaseWithHolders(app: E2eApp) {
  const prisma = new PrismaClient();
  const investorEmail = `inv-${Date.now()}@example.com`;
  const { userId: investorId, password } = await registerE2eUser(app, investorEmail);
  await seedWalletWithLedger(investorId, '1000');

  const release = await prisma.release.create({
    data: {
      slug: `rev-${Date.now()}`,
      symbol: `REV${Date.now() % 9999}`,
      title: 'Revenue E2E Track',
      genre: 'Electronic',
      payoutFrequency: 'MONTHLY',
      totalUnits: new Prisma.Decimal(1000),
      unitsAvailablePrimary: new Prisma.Decimal(500),
      primaryUnitPrice: new Prisma.Decimal(10),
      status: ReleaseStatus.ACTIVE,
      holderSharePct: new Prisma.Decimal(70),
      platformSharePct: new Prisma.Decimal(15),
      artistSharePct: new Prisma.Decimal(15),
    },
  });

  await prisma.userPosition.create({
    data: {
      userId: investorId,
      releaseId: release.id,
      unitsTotal: new Prisma.Decimal(100),
      unitsAvailable: new Prisma.Decimal(100),
      unitsLocked: new Prisma.Decimal(0),
      avgEntryPrice: new Prisma.Decimal(10),
    },
  });
  await prisma.ownershipLedger.create({
    data: {
      userId: investorId,
      releaseId: release.id,
      eventType: OwnershipEventType.PRIMARY_BUY,
      unitsDelta: new Prisma.Decimal(100),
      pricePerUnit: new Prisma.Decimal(10),
      happenedAt: new Date('2026-01-15T12:00:00.000Z'),
    },
  });

  await prisma.$disconnect();
  return { release, investorId, investorEmail, password };
}

describe('Admin revenue distribution API (e2e)', () => {
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

  it('GET /api/admin/v1/revenue-events without session returns 401', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/admin/v1/revenue-events',
    );
    expect(res.status).toBe(401);
  });

  it('ACCOUNTANT can view revenue summary', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/revenue-events/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalGrossRevenueUsdt: expect.any(String),
      pendingCount: expect.any(Number),
      activeEventsCount: expect.any(Number),
    });
  });

  it('runs full distribution lifecycle and credits investor wallet', async () => {
    const adminToken = await staffToken(app!, UserRoleCode.SUPER_ADMIN);
    const { release, investorId, investorEmail, password } =
      await seedReleaseWithHolders(app!);

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
    expect(preview.body.reconciliationOk).toBe(true);
    expect(Number(preview.body.roundingDelta)).toBe(0);
    expect(Number(preview.body.holdersAmount)).toBe(700);

    const save = await request(app!.getHttpServer())
      .post('/api/admin/v1/distributions/preview/save')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ revenueEventId: eventId });
    expect(save.status).toBe(201);

    await request(app!.getHttpServer())
      .post(`/api/admin/v1/revenue-events/${eventId}/submit-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    await request(app!.getHttpServer())
      .post(`/api/admin/v1/revenue-events/${eventId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const idem = `idem-rev-${Date.now()}`;
    const run = await request(app!.getHttpServer())
      .post('/api/admin/v1/distributions/run')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', idem)
      .send({ revenueEventId: eventId });
    expect(run.status).toBe(201);
    expect(run.body.status).toBe('paid');

    const dup = await request(app!.getHttpServer())
      .post('/api/admin/v1/distributions/run')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', `other-${Date.now()}`)
      .send({ revenueEventId: eventId });
    expect(dup.status).toBe(409);

    const prisma = new PrismaClient();
    const payout = await prisma.payout.findFirst({
      where: { userId: investorId, releaseId: release.id },
    });
    expect(payout).toBeTruthy();
    expect(payout!.status).toBe('PAID');
    expect(Number(payout!.amountNet.toString())).toBe(700);

    const wallet = await prisma.wallet.findFirst({
      where: { userId: investorId, assetCode: 'USDT' },
      include: { balance: true },
    });
    expect(
      Number(wallet!.balance!.available.toString()),
    ).toBeGreaterThanOrEqual(1700);

    const audit = await prisma.auditLog.findFirst({
      where: { entityId: eventId, action: 'distribution.run' },
    });
    expect(audit).toBeTruthy();

    const invLogin = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: investorEmail, password });
    const analytics = await request(app!.getHttpServer())
      .get(`/api/v1/analytics/releases/${release.id}/payouts`)
      .set('Authorization', `Bearer ${invLogin.body.tokens.accessToken}`);
    expect(analytics.status).toBe(200);
    expect(analytics.body.userPayouts.length).toBeGreaterThan(0);

    await prisma.$disconnect();
  });

  it('preview save rejects period with no eligible holders at cutoff', async () => {
    const adminToken = await staffToken(app!, UserRoleCode.SUPER_ADMIN);
    const prisma = new PrismaClient();
    const orphanEmail = `orphan-${Date.now()}@example.com`;
    const { userId } = await registerE2eUser(app!, orphanEmail);
    const release = await prisma.release.create({
      data: {
        slug: `orphan-${Date.now()}`,
        symbol: `OR${Date.now() % 9999}`,
        title: 'Orphan Position',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(100),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(10),
        status: ReleaseStatus.ACTIVE,
        holderSharePct: new Prisma.Decimal(70),
        platformSharePct: new Prisma.Decimal(15),
        artistSharePct: new Prisma.Decimal(15),
      },
    });
    await prisma.userPosition.create({
      data: {
        userId,
        releaseId: release.id,
        unitsTotal: new Prisma.Decimal(5),
        unitsAvailable: new Prisma.Decimal(5),
        unitsLocked: new Prisma.Decimal(0),
        avgEntryPrice: new Prisma.Decimal(10),
      },
    });
    await prisma.$disconnect();

    const create = await request(app!.getHttpServer())
      .post('/api/admin/v1/revenue-events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        trackId: release.id,
        grossRevenue: '100',
        source: 'streaming',
        periodFrom: '2026-01-01',
        periodTo: '2026-01-31',
      });
    expect(create.status).toBe(201);
    const eventId = create.body.id as string;

    const save = await request(app!.getHttpServer())
      .post('/api/admin/v1/distributions/preview/save')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ revenueEventId: eventId });
    expect(save.status).toBe(400);
    expect(save.body.code ?? save.body.error?.code).toMatch(
      /NO_ELIGIBLE_HOLDERS/i,
    );
  });
});
