import request from 'supertest';
import { LedgerOperationType, PrismaClient, UserRoleCode } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { seedWalletWithLedger } from './helpers/seed-wallet-ledger';
import { uniqueTrc20Address } from './helpers/e2e-trc20-address';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const { token, userId, password } = await registerE2eUser(app, email);
  return { email, password, userId, token };
}

async function assignRole(userId: string, roleCode: UserRoleCode) {
  const prisma = new PrismaClient();
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (role) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      create: { userId, roleId: role.id },
      update: {},
    });
  }
  await prisma.$disconnect();
}

async function staffToken(app: E2eApp): Promise<string> {
  const email = uniqueEmail('recon-staff');
  const { userId, token } = await registerUser(app, email);
  await assignRole(userId, UserRoleCode.ACCOUNTANT);
  return token;
}

describe('Ledger & reconciliation (e2e)', () => {
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

  it('dry-run reconciliation finds no discrepancy for aligned wallet', async () => {
    const staff = await staffToken(app!);
    const userEmail = uniqueEmail('recon-user');
    const { userId } = await registerUser(app!, userEmail);
    const wallet = await seedWalletWithLedger(userId, '100.00');

    const dryRes = await request(app!.getHttpServer())
      .post('/api/admin/v1/ledger/reconciliation/runs')
      .set('Authorization', `Bearer ${staff}`)
      .send({ dryRun: true, walletIds: [wallet.id] });

    expect(dryRes.status).toBe(201);
    expect(dryRes.body.dryRun).toBe(true);
    const hit = (dryRes.body.discrepancies as Array<{ walletId: string }>).find(
      (d) => d.walletId === wallet.id,
    );
    expect(hit).toBeUndefined();
  });

  it('detects artificial balance drift', async () => {
    const staff = await staffToken(app!);
    const userEmail = uniqueEmail('recon-drift-user');
    const { userId } = await registerUser(app!, userEmail);
    const wallet = await seedWalletWithLedger(userId, '50.00');

    const prisma = new PrismaClient();
    await prisma.walletBalance.update({
      where: { walletId: wallet.id },
      data: { available: { increment: 25 } },
    });
    await prisma.$disconnect();

    const dryRes = await request(app!.getHttpServer())
      .post('/api/admin/v1/ledger/reconciliation/runs')
      .set('Authorization', `Bearer ${staff}`)
      .send({ dryRun: true, walletIds: [wallet.id] });

    expect(dryRes.status).toBe(201);
    const hit = (dryRes.body.discrepancies as Array<{ walletId: string }>).find(
      (d) => d.walletId === wallet.id,
    );
    expect(hit).toBeDefined();
  });

  it('withdrawal lock writes ledger postings', async () => {
    const email = uniqueEmail('recon-withdraw');
    const { userId, token } = await registerUser(app!, email);
    const wallet = await seedWalletWithLedger(userId, '300.00');

    const createRes = await request(app!.getHttpServer())
      .post('/api/v1/wallet/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '80.00',
        toAddress: uniqueTrc20Address('recon-wd'),
      });
    expect(createRes.status).toBe(201);

    const prisma = new PrismaClient();
    const postings = await prisma.ledgerPosting.findMany({
      where: {
        walletId: wallet.id,
        operationType: LedgerOperationType.WITHDRAWAL_LOCK,
      },
    });
    expect(postings.length).toBeGreaterThanOrEqual(2);
    await prisma.$disconnect();
  });

  it('persisted reconciliation run and CSV report', async () => {
    const staff = await staffToken(app!);
    const userEmail = uniqueEmail('recon-persist-user');
    const { userId } = await registerUser(app!, userEmail);
    const wallet = await seedWalletWithLedger(userId, '1.00');

    const runRes = await request(app!.getHttpServer())
      .post('/api/admin/v1/ledger/reconciliation/runs')
      .set('Authorization', `Bearer ${staff}`)
      .send({ dryRun: false, walletIds: [wallet.id] });

    expect(runRes.status).toBe(201);
    expect(runRes.body.runId).toBeTruthy();
    expect(runRes.body.dryRun).toBe(false);

    const latest = await request(app!.getHttpServer())
      .get('/api/admin/v1/ledger/reconciliation/runs/latest')
      .set('Authorization', `Bearer ${staff}`);
    expect(latest.status).toBe(200);

    const report = await request(app!.getHttpServer())
      .get(
        `/api/admin/v1/ledger/reconciliation/runs/${runRes.body.runId}/report`,
      )
      .set('Authorization', `Bearer ${staff}`);
    expect(report.status).toBe(200);
    expect(report.text).toContain('wallet_id');
  });
});
