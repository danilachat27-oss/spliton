import request from 'supertest';
import { PrismaClient, UserRoleCode } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { seedWalletWithLedger } from './helpers/seed-wallet-ledger';
import { uniqueTrc20Address } from './helpers/e2e-trc20-address';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@example.com`;
}

async function registerAndLogin(
  app: E2eApp,
  email: string,
  password = 'TestPass123!',
): Promise<{ token: string; userId: string }> {
  const result = await registerE2eUser(app, email);
  expect(result.password).toBe(password);
  return { token: result.token, userId: result.userId };
}

async function grantStaffRole(userId: string, roleCode: UserRoleCode) {
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

describe('Withdrawal ledger flow (e2e)', () => {
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

  it('user create → admin approve → complete → reject flow with ledger safety', async () => {
    const email = uniqueEmail('withdraw-user');
    const { token, userId } = await registerAndLogin(app!, email);
    const wallet = await seedWalletWithLedger(userId, '500.00');
    const toAddress = uniqueTrc20Address('wd-main');

    const createRes = await request(app!.getHttpServer())
      .post('/api/v1/wallet/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '100.00', toAddress });
    expect(createRes.status).toBe(201);
    const withdrawalId = createRes.body.id as string;
    expect(createRes.body.status).toBe('pending');

    const prisma = new PrismaClient();
    const afterCreateBalance = await prisma.walletBalance.findUnique({
      where: { walletId: wallet.id },
    });
    expect(Number(afterCreateBalance!.available.toString())).toBe(400);
    expect(Number(afterCreateBalance!.locked.toString())).toBe(100);

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { walletTx: true },
    });
    expect(withdrawal?.status).toBe('LOCKED');
    expect(withdrawal?.walletTx.txType).toBe('WITHDRAWAL');
    expect(withdrawal?.walletTx.status).toBe('PENDING');

    const staffEmail = uniqueEmail('withdraw-staff');
    const staffLogin = await registerAndLogin(app!, staffEmail);
    await grantStaffRole(staffLogin.userId, UserRoleCode.ACCOUNTANT);

    const staffTokenRes = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: staffEmail, password: 'TestPass123!' });
    const staffToken = staffTokenRes.body.tokens.accessToken as string;

    const approveRes = await request(app!.getHttpServer())
      .post(`/api/admin/v1/withdrawals/${withdrawalId}/approve`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ note: 'e2e approve' });
    expect(approveRes.status).toBe(201);

    const afterApproveBalance = await prisma.walletBalance.findUnique({
      where: { walletId: wallet.id },
    });
    expect(Number(afterApproveBalance!.available.toString())).toBe(400);
    expect(Number(afterApproveBalance!.locked.toString())).toBe(100);

    const afterApproveRow = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });
    expect(afterApproveRow?.status).toBe('APPROVED');

    const completeRes = await request(app!.getHttpServer())
      .post(`/api/admin/v1/withdrawals/${withdrawalId}/complete`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ note: 'e2e complete', blockchainTxid: `0xabc-${Date.now()}` });
    expect(completeRes.status).toBe(201);

    const afterCompleteBalance = await prisma.walletBalance.findUnique({
      where: { walletId: wallet.id },
    });
    expect(Number(afterCompleteBalance!.locked.toString())).toBe(0);
    expect(Number(afterCompleteBalance!.available.toString())).toBe(400);

    const completedTx = await prisma.walletTransaction.findUnique({
      where: { id: withdrawal!.walletTxId },
    });
    expect(completedTx?.status).toBe('COMPLETED');

    const repeatComplete = await request(app!.getHttpServer())
      .post(`/api/admin/v1/withdrawals/${withdrawalId}/complete`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({});
    expect(repeatComplete.status).toBe(409);

    const rejectEmail = uniqueEmail('withdraw-reject');
    const rejectUser = await registerAndLogin(app!, rejectEmail);
    const rejectWallet = await seedWalletWithLedger(rejectUser.userId, '200.00');

    const rejectCreate = await request(app!.getHttpServer())
      .post('/api/v1/wallet/withdrawals')
      .set('Authorization', `Bearer ${rejectUser.token}`)
      .send({ amount: '50.00', toAddress: uniqueTrc20Address('wd-reject') });
    expect(rejectCreate.status).toBe(201);
    const rejectId = rejectCreate.body.id as string;

    const rejectRes = await request(app!.getHttpServer())
      .post(`/api/admin/v1/withdrawals/${rejectId}/reject`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ note: 'e2e reject', rejectionReason: 'compliance risk' });
    expect(rejectRes.status).toBe(201);

    const afterRejectBalance = await prisma.walletBalance.findUnique({
      where: { walletId: rejectWallet.id },
    });
    expect(Number(afterRejectBalance!.available.toString())).toBe(200);
    expect(Number(afterRejectBalance!.locked.toString())).toBe(0);

    await prisma.$disconnect();
  });

  it('rejects invalid TRC20 and insufficient balance', async () => {
    const email = uniqueEmail('withdraw-invalid');
    const { token, userId } = await registerAndLogin(app!, email);
    await seedWalletWithLedger(userId, '10.00');

    const badAddress = await request(app!.getHttpServer())
      .post('/api/v1/wallet/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '100.00', toAddress: 'invalid-address' });
    expect(badAddress.status).toBe(400);

    const insufficient = await request(app!.getHttpServer())
      .post('/api/v1/wallet/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '100.00', toAddress: uniqueTrc20Address('wd-insuf') });
    expect(insufficient.status).toBe(409);
  });
});
