import request from 'supertest';
import { PrismaClient, UserRoleCode } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { seedWalletWithLedger } from './helpers/seed-wallet-ledger';
import { MockDepositProvider } from '../src/modules/deposit-ingestion/providers/mock-deposit.provider';
import { DepositIngestionService } from '../src/modules/deposit-ingestion/deposit-ingestion.service';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@example.com`;
}

/** Unique TRC20-looking address (wallet.address is not globally unique in DB). */
function uniqueTronAddress(label: string): string {
  const raw = `T${label}${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
  return raw.replace(/[^1-9A-HJ-NP-Za-km-z]/g, 'X').padEnd(34, '1').slice(0, 34);
}

async function registerUser(app: E2eApp, email: string) {
  const { userId, password } = await registerE2eUser(app, email);
  return { userId, password };
}

async function staffToken(app: E2eApp) {
  const email = uniqueEmail('deposit-staff');
  const { userId, password } = await registerUser(app, email);
  const prisma = new PrismaClient();
  const role = await prisma.role.findUnique({
    where: { code: UserRoleCode.ACCOUNTANT },
  });
  if (role) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      create: { userId, roleId: role.id },
      update: {},
    });
  }
  await prisma.$disconnect();
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });
  return login.body.tokens.accessToken as string;
}

describe('Deposit ingestion (e2e)', () => {
  let app: E2eApp | undefined;
  let provider: MockDepositProvider;
  let ingestion: DepositIngestionService;

  beforeEach(async () => {
    process.env.TRON_PROVIDER_MODE = 'mock';
    process.env.DEPOSIT_INGESTION_ENABLED = 'false';
    process.env.TRON_CONFIRMATIONS = '20';
    app = await createE2eApp();
    provider = app.get(MockDepositProvider);
    ingestion = app.get(DepositIngestionService);
    provider.clear();
  });

  afterEach(async () => {
    if (app) await app.close();
    app = undefined;
  });

  it('mock incoming tx credits wallet once', async () => {
    const email = uniqueEmail('dep-user');
    const { userId } = await registerUser(app!, email);
    const wallet = await seedWalletWithLedger(userId, '10');
    const depositAddress = uniqueTronAddress('Dep');

    const prisma = new PrismaClient();
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { address: depositAddress },
    });
    await prisma.$disconnect();

    provider.enqueue({
      txHash: `tx-${Date.now()}`,
      fromAddress: 'TFromAddress111111111111111111111111111',
      toAddress: depositAddress,
      amount: '25',
      confirmations: 25,
      blockNumber: 1000n,
      tokenContract: '',
      network: 'TRC20',
      assetCode: 'USDT',
    });
    const out = await ingestion.tick();
    expect(out.credited).toBe(1);

    const prisma2 = new PrismaClient();
    const balance = await prisma2.walletBalance.findUnique({
      where: { walletId: wallet.id },
    });
    expect(Number(balance!.available.toString())).toBe(35);
    const depositCount = await prisma2.deposit.count({
      where: { walletTx: { walletId: wallet.id } },
    });
    expect(depositCount).toBe(1);
    await prisma2.$disconnect();
  });

  it('pending confirmations not credited; second pass credits once', async () => {
    const email = uniqueEmail('dep-pending');
    const { userId } = await registerUser(app!, email);
    const wallet = await seedWalletWithLedger(userId, '0');
    const depositAddress = uniqueTronAddress('Pend');
    const prisma = new PrismaClient();
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { address: depositAddress },
    });
    await prisma.$disconnect();

    const txHash = `tx-pending-${Date.now()}`;
    provider.enqueue({
      txHash,
      fromAddress: 'TFromAddress222222222222222222222222222',
      toAddress: depositAddress,
      amount: '5',
      confirmations: 3,
      blockNumber: 1001n,
      tokenContract: '',
      network: 'TRC20',
      assetCode: 'USDT',
    });
    await ingestion.tick();

    const p1 = new PrismaClient();
    const b1 = await p1.walletBalance.findUnique({
      where: { walletId: wallet.id },
    });
    expect(Number(b1!.available.toString())).toBe(0);
    await p1.$disconnect();

    provider.enqueue({
      txHash,
      fromAddress: 'TFromAddress222222222222222222222222222',
      toAddress: depositAddress,
      amount: '5',
      confirmations: 21,
      blockNumber: 1002n,
      tokenContract: '',
      network: 'TRC20',
      assetCode: 'USDT',
    });
    await ingestion.tick();
    await ingestion.tick();

    const p2 = new PrismaClient();
    const b2 = await p2.walletBalance.findUnique({
      where: { walletId: wallet.id },
    });
    expect(Number(b2!.available.toString())).toBe(5);
    const postings = await p2.ledgerPosting.count({
      where: {
        walletId: wallet.id,
        operationType: 'DEPOSIT_SETTLE',
      },
    });
    expect(postings).toBeGreaterThanOrEqual(2);
    const dep = await p2.deposit.findFirstOrThrow({
      where: { blockchainTxid: txHash },
    });
    expect(dep.status).toBe('CREDITED');
    await p2.$disconnect();
  });

  it('wrong address ignored and admin sees auto deposits', async () => {
    const token = await staffToken(app!);
    provider.enqueue({
      txHash: `tx-wrong-${Date.now()}`,
      fromAddress: 'TFromAddress333333333333333333333333333',
      toAddress: 'TUnknownAddress3333333333333333333333333',
      amount: '3',
      confirmations: 30,
      blockNumber: 1003n,
      tokenContract: '',
      network: 'TRC20',
      assetCode: 'USDT',
    });
    const out = await ingestion.tick();
    expect(out.ignored).toBe(1);

    const list = await request(app!.getHttpServer())
      .get('/api/admin/v1/deposits')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.items)).toBe(true);
  });
});
