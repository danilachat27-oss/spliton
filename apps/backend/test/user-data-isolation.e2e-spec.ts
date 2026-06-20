import request from 'supertest';
import { Prisma, PrismaClient, ReleaseStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { seedWalletWithLedger } from './helpers/seed-wallet-ledger';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@example.com`;
}

async function seedUserPosition(userId: string) {
  const prisma = new PrismaClient();
  const release = await prisma.release.create({
    data: {
      slug: `iso-${Date.now()}-${Math.random()}`,
      symbol: `ISO${Date.now() % 10000}`,
      title: 'Isolation Track',
      genre: 'Electronic',
      payoutFrequency: 'MONTHLY',
      totalUnits: new Prisma.Decimal(10000),
      unitsAvailablePrimary: new Prisma.Decimal(0),
      primaryUnitPrice: new Prisma.Decimal('1.00'),
      status: ReleaseStatus.ACTIVE,
    },
  });
  await prisma.userPosition.create({
    data: {
      userId,
      releaseId: release.id,
      unitsTotal: new Prisma.Decimal('10'),
      unitsAvailable: new Prisma.Decimal('10'),
      unitsLocked: new Prisma.Decimal('0'),
      avgEntryPrice: new Prisma.Decimal('1.00'),
    },
  });
  await prisma.$disconnect();
  return release;
}

describe('User data isolation (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('user B cannot read user A portfolio, wallet, statements, or disputes', async () => {
    const userA = await registerE2eUser(app!, uniqueEmail('iso-a'));
    const userB = await registerE2eUser(app!, uniqueEmail('iso-b'));
    const authA = { Authorization: `Bearer ${userA.token}` };
    const authB = { Authorization: `Bearer ${userB.token}` };

    await seedUserPosition(userA.userId);
    await seedWalletWithLedger(userA.userId, '100.00');

    const posA = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/positions')
      .set(authA);
    expect(posA.status).toBe(200);
    expect(posA.body.items.length).toBeGreaterThan(0);

    const posB = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/positions')
      .set(authB);
    expect(posB.status).toBe(200);
    expect(posB.body.items).toEqual([]);

    const activityA = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/activity')
      .set(authA);
    expect(activityA.status).toBe(200);

    const activityB = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/activity')
      .set(authB);
    expect(activityB.status).toBe(200);
    const aIds = new Set(
      (activityA.body.items ?? []).map((i: { id: string }) => i.id),
    );
    for (const item of activityB.body.items ?? []) {
      expect(aIds.has(item.id)).toBe(false);
    }

    const payoutsA = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/payouts/history')
      .set(authA);
    expect(payoutsA.status).toBe(200);

    const payoutsB = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/payouts/history')
      .set(authB);
    expect(payoutsB.status).toBe(200);

    const walletA = await request(app!.getHttpServer()).get('/api/v1/wallet').set(authA);
    expect(walletA.status).toBe(200);
    expect(Number(walletA.body.availableBalance)).toBeGreaterThan(0);

    const walletB = await request(app!.getHttpServer()).get('/api/v1/wallet').set(authB);
    expect(walletB.status).toBe(200);
    expect(walletB.body.availableBalance).toBe('0');

    const dispute = await request(app!.getHttpServer())
      .post('/api/v1/disputes')
      .set(authA)
      .send({
        type: 'other',
        subject: 'Isolation dispute',
        description: 'User A private dispute for isolation test',
      });
    expect(dispute.status).toBe(201);
    const disputeId = dispute.body.id as string;

    await request(app!.getHttpServer())
      .get(`/api/v1/disputes/${disputeId}`)
      .set(authB)
      .expect(404);

    const kinds = await request(app!.getHttpServer())
      .get('/api/v1/accounting/statements')
      .set(authA);
    const kind = kinds.body.items[0].kind as string;
    const queued = await request(app!.getHttpServer())
      .post('/api/v1/accounting/statements/request')
      .set(authA)
      .send({ kind });
    expect(queued.status).toBe(201);
    const docId = queued.body.id as string;

    let completed = false;
    for (let i = 0; i < 30; i++) {
      const statusRes = await request(app!.getHttpServer())
        .get(`/api/v1/accounting/statements/requests/${docId}`)
        .set(authA);
      if (statusRes.body.status === 'completed') {
        completed = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    expect(completed).toBe(true);

    await request(app!.getHttpServer())
      .get(`/api/v1/documents/${docId}/download`)
      .set(authB)
      .expect(404);
  });
});
