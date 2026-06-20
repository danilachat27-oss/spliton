import request from 'supertest';
import {
  Prisma,
  PrismaClient,
  ReleaseStatus,
  WalletTxDirection,
  WalletTxStatus,
  WalletTxType,
} from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { seedWalletWithLedger } from './helpers/seed-wallet-ledger';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@example.com`;
}

async function registerAndLogin(app: E2eApp, email: string) {
  const { token, userId } = await registerE2eUser(app, email);
  return { token, userId };
}

describe('Wallet activity (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('paginates deterministically by createdAt desc', async () => {
    const email = uniqueEmail('wa-page');
    const { token, userId } = await registerAndLogin(app!, email);
    const wallet = await seedWalletWithLedger(userId, '0');
    const prisma = new PrismaClient();
    const base = new Date('2026-05-01T12:00:00Z');
    for (let i = 0; i < 5; i++) {
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          txType: WalletTxType.DEPOSIT,
          direction: WalletTxDirection.IN,
          amount: new Prisma.Decimal(10 + i),
          feeAmount: new Prisma.Decimal(0),
          netAmount: new Prisma.Decimal(10 + i),
          currency: 'USDT',
          status: WalletTxStatus.COMPLETED,
          happenedAt: new Date(base.getTime() + i * 3600_000),
        },
      });
    }
    await prisma.$disconnect();

    const p1 = await request(app!.getHttpServer())
      .get('/api/v1/wallet/activity?page=1&pageSize=2')
      .set('Authorization', `Bearer ${token}`);
    expect(p1.status).toBe(200);
    expect(p1.body.items).toHaveLength(2);
    expect(p1.body.total).toBeGreaterThanOrEqual(5);
    expect(p1.body.hasMore).toBe(true);

    const p2 = await request(app!.getHttpServer())
      .get('/api/v1/wallet/activity?page=2&pageSize=2')
      .set('Authorization', `Bearer ${token}`);
    expect(p2.body.items).toHaveLength(2);
    expect(p2.body.items[0].id).not.toBe(p1.body.items[0].id);

    const times = p1.body.items.map((r: { createdAt: string }) =>
      new Date(r.createdAt).getTime(),
    );
    expect(times[0]).toBeGreaterThanOrEqual(times[1]);
  });

  it('rejects pageSize above server max', async () => {
    const email = uniqueEmail('wa-max');
    const { token } = await registerAndLogin(app!, email);
    const res = await request(app!.getHttpServer())
      .get('/api/v1/wallet/activity?pageSize=101')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('filters by type=deposit', async () => {
    const email = uniqueEmail('wa-dep');
    const { token, userId } = await registerAndLogin(app!, email);
    const wallet = await seedWalletWithLedger(userId, '0');
    const prisma = new PrismaClient();
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        txType: WalletTxType.DEPOSIT,
        direction: WalletTxDirection.IN,
        amount: new Prisma.Decimal(50),
        feeAmount: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(50),
        currency: 'USDT',
        status: WalletTxStatus.COMPLETED,
        happenedAt: new Date(),
      },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        txType: WalletTxType.FEE,
        direction: WalletTxDirection.OUT,
        amount: new Prisma.Decimal(1),
        feeAmount: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(1),
        currency: 'USDT',
        status: WalletTxStatus.COMPLETED,
        happenedAt: new Date(),
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .get('/api/v1/wallet/activity?type=deposit')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(
      res.body.items.every((i: { type: string }) => i.type === 'deposit'),
    ).toBe(true);
  });

  it('includes primary purchase, fee, and payout rows from ledger', async () => {
    const email = uniqueEmail('wa-mix');
    const { token, userId } = await registerAndLogin(app!, email);
    const wallet = await seedWalletWithLedger(userId, '500');
    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `wa-${Date.now()}`,
        symbol: `WA${Date.now() % 9999}`,
        title: 'WA Release',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(1000),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(10),
        status: ReleaseStatus.ACTIVE,
      },
    });
    const order = await prisma.order.create({
      data: {
        userId,
        releaseId: release.id,
        side: 'BUY',
        orderType: 'MARKET',
        timeInForce: 'IOC',
        unitsTotal: new Prisma.Decimal(2),
        unitsFilled: new Prisma.Decimal(2),
        status: 'PAID',
      },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        txType: WalletTxType.TRADE_SETTLEMENT,
        direction: WalletTxDirection.OUT,
        amount: new Prisma.Decimal(20),
        feeAmount: new Prisma.Decimal(1),
        netAmount: new Prisma.Decimal(20),
        currency: 'USDT',
        status: WalletTxStatus.COMPLETED,
        referenceType: 'primary_order',
        referenceId: order.id,
        happenedAt: new Date('2026-06-02T10:00:00Z'),
      },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        txType: WalletTxType.FEE,
        direction: WalletTxDirection.OUT,
        amount: new Prisma.Decimal(1),
        feeAmount: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(1),
        currency: 'USDT',
        status: WalletTxStatus.COMPLETED,
        referenceType: 'primary_order_fee',
        referenceId: order.id,
        happenedAt: new Date('2026-06-02T10:01:00Z'),
      },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        txType: WalletTxType.PAYOUT,
        direction: WalletTxDirection.IN,
        amount: new Prisma.Decimal(5),
        feeAmount: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(5),
        currency: 'USDT',
        status: WalletTxStatus.COMPLETED,
        referenceType: 'earning_distribution',
        referenceId: order.id,
        happenedAt: new Date('2026-06-03T10:00:00Z'),
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .get('/api/v1/wallet/activity?pageSize=50')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const types = res.body.items.map((i: { type: string }) => i.type);
    expect(types).toContain('primary_purchase');
    expect(types).toContain('fee');
    expect(types).toContain('payout');
    const primary = res.body.items.find(
      (i: { type: string }) => i.type === 'primary_purchase',
    );
    expect(primary.referenceId).toBeTruthy();
    expect(primary.relatedEntity?.releaseTitle).toBe('WA Release');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/wallet/activity',
    );
    expect(res.status).toBe(401);
  });

  it('returns empty list for user without transactions', async () => {
    const email = uniqueEmail('wa-empty');
    const { token } = await registerAndLogin(app!, email);
    const res = await request(app!.getHttpServer())
      .get('/api/v1/wallet/activity')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('filters by period=7d', async () => {
    const email = uniqueEmail('wa-period');
    const { token, userId } = await registerAndLogin(app!, email);
    const wallet = await seedWalletWithLedger(userId, '0');
    const prisma = new PrismaClient();
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        txType: WalletTxType.DEPOSIT,
        direction: WalletTxDirection.IN,
        amount: new Prisma.Decimal(10),
        feeAmount: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(10),
        currency: 'USDT',
        status: WalletTxStatus.COMPLETED,
        happenedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        txType: WalletTxType.DEPOSIT,
        direction: WalletTxDirection.IN,
        amount: new Prisma.Decimal(20),
        feeAmount: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(20),
        currency: 'USDT',
        status: WalletTxStatus.COMPLETED,
        happenedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .get('/api/v1/wallet/activity?period=7d')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].type).toBe('deposit');
  });

  it('filters by direction=in', async () => {
    const email = uniqueEmail('wa-dir');
    const { token, userId } = await registerAndLogin(app!, email);
    const wallet = await seedWalletWithLedger(userId, '0');
    const prisma = new PrismaClient();
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        txType: WalletTxType.DEPOSIT,
        direction: WalletTxDirection.IN,
        amount: new Prisma.Decimal(10),
        feeAmount: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(10),
        currency: 'USDT',
        status: WalletTxStatus.COMPLETED,
        happenedAt: new Date(),
      },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        txType: WalletTxType.FEE,
        direction: WalletTxDirection.OUT,
        amount: new Prisma.Decimal(1),
        feeAmount: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(1),
        currency: 'USDT',
        status: WalletTxStatus.COMPLETED,
        happenedAt: new Date(),
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .get('/api/v1/wallet/activity?direction=in')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items.every((i: { direction: string }) => i.direction === 'in')).toBe(
      true,
    );
  });

  it('rejects invalid sort with 400', async () => {
    const email = uniqueEmail('wa-sort');
    const { token } = await registerAndLogin(app!, email);
    const res = await request(app!.getHttpServer())
      .get('/api/v1/wallet/activity?sort=invalid')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('portfolio activity alias returns same shape', async () => {
    const email = uniqueEmail('wa-alias');
    const { token } = await registerAndLogin(app!, email);
    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/activity?limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
  });
});
