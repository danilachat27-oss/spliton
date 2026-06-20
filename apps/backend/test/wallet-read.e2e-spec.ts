import request from 'supertest';
import { Prisma, PrismaClient, WalletStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@example.com`;
}

describe('User wallet read (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns wallet summary and transactions for authenticated user', async () => {
    const email = uniqueEmail('wallet-read');
    const { token, userId } = await registerE2eUser(app!, email);

    const prisma = new PrismaClient();
    const wallet = await prisma.wallet.create({
      data: {
        userId,
        assetCode: 'USDT',
        network: 'TRC20',
        status: WalletStatus.ACTIVE,
        balance: {
          create: {
            available: new Prisma.Decimal('100'),
            locked: new Prisma.Decimal(0),
            pending: new Prisma.Decimal(0),
          },
        },
      },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        txType: 'DEPOSIT',
        direction: 'IN',
        amount: new Prisma.Decimal(100),
        feeAmount: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(100),
        currency: 'USDT',
        status: 'COMPLETED',
        referenceType: 'deposit',
        referenceId: wallet.id,
        happenedAt: new Date(),
      },
    });
    await prisma.$disconnect();

    const summary = await request(app!.getHttpServer())
      .get('/api/v1/wallet')
      .set('Authorization', `Bearer ${token}`);
    expect(summary.status).toBe(200);
    expect(summary.body.availableBalance).toBe('100');

    const txs = await request(app!.getHttpServer())
      .get('/api/v1/wallet/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(txs.status).toBe(200);
    expect(txs.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects unauthenticated wallet access', async () => {
    const res = await request(app!.getHttpServer()).get('/api/v1/wallet');
    expect(res.status).toBe(401);
  });
});
