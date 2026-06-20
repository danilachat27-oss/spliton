import request from 'supertest';
import {
  Prisma,
  PrismaClient,
  PrimaryRaiseRoundStatus,
  ReleaseStatus,
  UserStatus,
} from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { e2eEmail, e2eKey, e2eSlug, e2eSymbol } from './helpers/e2e-unique';
import { seedWalletWithLedger } from './helpers/seed-wallet-ledger';

function uniqueEmail(prefix: string): string {
  return e2eEmail(prefix);
}

async function registerAndLogin(app: E2eApp, email: string) {
  const { token, userId } = await registerE2eUser(app, email);
  return { token, userId };
}

async function seedPrimaryRound(units: string, price = '10') {
  const prisma = new PrismaClient();
  const release = await prisma.release.create({
    data: {
      slug: e2eSlug('e2e-rel'),
      symbol: e2eSymbol('E'),
      title: 'E2E Release',
      payoutFrequency: 'MONTHLY',
      totalUnits: new Prisma.Decimal(1000),
      unitsAvailablePrimary: new Prisma.Decimal(units),
      primaryUnitPrice: new Prisma.Decimal(price),
      status: ReleaseStatus.ACTIVE,
    },
  });
  const round = await prisma.primaryRaiseRound.create({
    data: {
      releaseId: release.id,
      status: PrimaryRaiseRoundStatus.LIVE,
      raiseTargetUsdt: new Prisma.Decimal(10000),
      hardCapUsdt: new Prisma.Decimal(10000),
      totalUnits: new Prisma.Decimal(units),
      soldUnits: new Prisma.Decimal(0),
    },
  });
  await prisma.$disconnect();
  return { release, round };
}

describe('Primary order (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('purchases units with ledger, fee row, ownership, position, and idempotency', async () => {
    const email = uniqueEmail('primary-buy');
    const { token, userId } = await registerAndLogin(app!, email);
    const { release, round } = await seedPrimaryRound('100');
    const wallet = await seedWalletWithLedger(userId, '500');

    const idem = e2eKey('idem');
    const body = { roundId: round.id, units: 2, idempotencyKey: idem };

    const first = await request(app!.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idem)
      .send(body);
    expect(first.status).toBe(201);
    expect(first.body.status).toBe('settled');
    expect(first.body.orderId).toBeTruthy();
    expect(first.body.grossAmount).toBe('20');

    const second = await request(app!.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idem)
      .send(body);
    expect(second.status).toBe(201);
    expect(second.body.orderId).toBe(first.body.orderId);
    expect(second.body.idempotentReplay).toBe(true);

    const prisma2 = new PrismaClient();
    const orderCount = await prisma2.order.count({
      where: { userId, idempotencyKey: idem },
    });
    const bal = await prisma2.walletBalance.findUnique({
      where: { walletId: wallet.id },
    });
    const feeCount = await prisma2.fee.count({
      where: {
        feeCode: 'primary_purchase_fee',
        subjectType: 'primary_order',
        subjectId: first.body.orderId,
      },
    });
    const pos = await prisma2.userPosition.findUnique({
      where: { userId_releaseId: { userId, releaseId: release.id } },
    });
    const ownership = await prisma2.ownershipLedger.count({
      where: { userId, releaseId: release.id, eventType: 'PRIMARY_BUY' },
    });
    const updatedRound = await prisma2.primaryRaiseRound.findUnique({
      where: { id: round.id },
    });
    await prisma2.$disconnect();

    expect(orderCount).toBe(1);
    expect(bal!.available.lessThan(new Prisma.Decimal(500))).toBe(true);
    expect(feeCount).toBe(1);
    expect(pos!.unitsTotal.toString()).toBe('2');
    expect(ownership).toBe(1);
    expect(updatedRound!.soldUnits.toString()).toBe('2');
  });

  it('requires idempotency key', async () => {
    const email = uniqueEmail('primary-no-idem');
    const { token } = await registerAndLogin(app!, email);
    const { round } = await seedPrimaryRound('10');

    const res = await request(app!.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ roundId: round.id, units: 1 });
    expect(res.status).toBe(400);
  });

  it('rejects insufficient balance', async () => {
    const email = uniqueEmail('primary-poor');
    const { token, userId } = await registerAndLogin(app!, email);
    const { round } = await seedPrimaryRound('10');
    await seedWalletWithLedger(userId, '5');

    const idem = e2eKey('poor');
    const res = await request(app!.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idem)
      .send({ roundId: round.id, units: 2, idempotencyKey: idem });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('rejects sold out round', async () => {
    const email = uniqueEmail('primary-sold');
    const { token, userId } = await registerAndLogin(app!, email);
    const prisma = new PrismaClient();
    const { release, round } = await seedPrimaryRound('1');
    await prisma.primaryRaiseRound.update({
      where: { id: round.id },
      data: { soldUnits: new Prisma.Decimal(1) },
    });
    await prisma.$disconnect();
    await seedWalletWithLedger(userId, '500');

    const key = e2eKey('sold');
    const res = await request(app!.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', key)
      .send({ roundId: round.id, units: 1, idempotencyKey: key });
    expect(res.status).toBe(409);
    expect(['SOLD_OUT', 'INSUFFICIENT_PRIMARY_UNITS']).toContain(res.body.code);

    const prisma2 = new PrismaClient();
    const orderCount = await prisma2.order.count({
      where: { userId, releaseId: release.id },
    });
    await prisma2.$disconnect();
    expect(orderCount).toBe(0);
  });

  it('rejects concurrent oversell on last unit', async () => {
    const email = uniqueEmail('primary-race');
    const { token, userId } = await registerAndLogin(app!, email);
    const { release, round } = await seedPrimaryRound('1');
    await seedWalletWithLedger(userId, '1000');

    const keyA = e2eKey('race-a');
    const keyB = e2eKey('race-b');
    const [a, b] = await Promise.all([
      request(app!.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', keyA)
        .send({ roundId: round.id, units: 1, idempotencyKey: keyA }),
      request(app!.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', keyB)
        .send({ roundId: round.id, units: 1, idempotencyKey: keyB }),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual(expect.arrayContaining([201, 409]));

    const prisma2 = new PrismaClient();
    const updated = await prisma2.primaryRaiseRound.findUnique({
      where: { id: round.id },
    });
    const orderCount = await prisma2.order.count({
      where: { userId, releaseId: release.id },
    });
    await prisma2.$disconnect();
    expect(updated!.soldUnits.toString()).toBe('1');
    expect(orderCount).toBe(1);
  });
});
