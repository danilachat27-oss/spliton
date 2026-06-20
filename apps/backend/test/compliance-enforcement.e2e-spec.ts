import request from 'supertest';
import {
  Prisma,
  PrismaClient,
  ReleaseStatus,
  UserRoleCode,
  UserStatus,
  WithdrawalStatus,
} from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { seedWalletWithLedger } from './helpers/seed-wallet-ledger';
import { uniqueTrc20Address } from './helpers/e2e-trc20-address';

function email(prefix: string) {
  return `e2e-compliance16-${prefix}-${Date.now()}@example.com`;
}

async function register(app: E2eApp, addr: string) {
  const { token, userId, password } = await registerE2eUser(app, addr);
  return { token, userId, password };
}

async function assignRole(addr: string, role: UserRoleCode) {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email: addr } });
  const roleRow = await prisma.role.findUnique({ where: { code: role } });
  if (user && roleRow) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleRow.id } },
      create: { userId: user.id, roleId: roleRow.id },
      update: {},
    });
  }
  await prisma.$disconnect();
}

describe('Compliance enforcement (e2e)', () => {
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

  it('large withdrawal creates risk flag', async () => {
    const holder = email('holder');
    const { token, userId } = await register(app!, holder);
    await seedWalletWithLedger(userId, '5000');

    const wd = await request(app!.getHttpServer())
      .post('/api/v1/wallet/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '1500',
        toAddress: uniqueTrc20Address('cmp-flag'),
        idempotencyKey: `wd-flag-${Date.now()}`,
      });
    expect([200, 201]).toContain(wd.status);
    expect(wd.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const prisma = new PrismaClient();
    const posting = await prisma.ledgerPosting.findFirst({
      where: {
        sourceEntityType: 'withdrawal',
        sourceEntityId: wd.body.id as string,
      },
    });
    expect(posting).toBeTruthy();
    let flag = null;
    for (let i = 0; i < 20; i++) {
      flag = await prisma.riskFlag.findFirst({
        where: { userId, entityType: 'withdrawal', isActive: true },
      });
      if (flag) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(flag).toBeTruthy();
    expect(flag!.flagCode).toBe('first_wd_large');
    await prisma.$disconnect();
  });

  it('COMPLIANCE can hold withdrawal; ACCOUNTANT cannot freeze', async () => {
    const holder = email('wd-hold');
    const { token: holderToken, userId } = await register(app!, holder);
    await seedWalletWithLedger(userId, '3000');

    const wd = await request(app!.getHttpServer())
      .post('/api/v1/wallet/withdrawals')
      .set('Authorization', `Bearer ${holderToken}`)
      .send({
        amount: '1200',
        toAddress: uniqueTrc20Address('cmp-hold'),
        idempotencyKey: `wd-hold-${Date.now()}`,
      });
    expect([200, 201]).toContain(wd.status);
    const withdrawalId = wd.body.id as string;

    const complianceEmail = email('compliance');
    await register(app!, complianceEmail);
    await assignRole(complianceEmail, UserRoleCode.COMPLIANCE);
    const complianceLogin = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: complianceEmail, password: 'TestPass123!' });
    const complianceToken = complianceLogin.body.tokens.accessToken as string;

    const freeze = await request(app!.getHttpServer())
      .post(`/api/admin/v1/compliance/operations/${withdrawalId}/freeze`)
      .set('Authorization', `Bearer ${complianceToken}`)
      .send({ operationType: 'withdrawal', note: 'e2e hold' });
    expect([200, 201]).toContain(freeze.status);

    const accountantEmail = email('accountant');
    await register(app!, accountantEmail);
    await assignRole(accountantEmail, UserRoleCode.ACCOUNTANT);
    const accLogin = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: accountantEmail, password: 'TestPass123!' });
    const accToken = accLogin.body.tokens.accessToken as string;

    const denied = await request(app!.getHttpServer())
      .post(`/api/admin/v1/compliance/operations/${withdrawalId}/freeze`)
      .set('Authorization', `Bearer ${accToken}`)
      .send({ operationType: 'withdrawal', note: 'should fail' });
    expect(denied.status).toBe(403);

    const prisma = new PrismaClient();
    const row = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });
    expect(row!.status).toBe(WithdrawalStatus.ON_HOLD);

    const freezeRow = await prisma.complianceFreeze.findFirst({
      where: { operationId: withdrawalId, operationType: 'withdrawal', isActive: true },
    });
    expect(freezeRow).toBeTruthy();

    const audit = await prisma.auditLog.findFirst({
      where: {
        action: 'compliance.operation.freeze',
        entityType: 'compliance_freeze',
        entityId: freezeRow!.id,
      },
    });
    expect(audit).toBeTruthy();
    await prisma.$disconnect();
  });

  it('frozen wallet blocks new withdrawal', async () => {
    const holder = email('frozen');
    const { token, userId } = await register(app!, holder);
    await seedWalletWithLedger(userId, '2000');

    const complianceEmail = email('comp-freeze');
    await register(app!, complianceEmail);
    await assignRole(complianceEmail, UserRoleCode.COMPLIANCE);
    const cLogin = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: complianceEmail, password: 'TestPass123!' });
    const cToken = cLogin.body.tokens.accessToken as string;

    const prisma = new PrismaClient();
    const wallet = await prisma.wallet.findFirst({ where: { userId } });
    await prisma.$disconnect();

    const freeze = await request(app!.getHttpServer())
      .post(`/api/admin/v1/compliance/operations/${wallet!.id}/freeze`)
      .set('Authorization', `Bearer ${cToken}`)
      .send({ operationType: 'wallet', note: 'e2e wallet freeze' });
    expect([200, 201]).toContain(freeze.status);

    const blocked = await request(app!.getHttpServer())
      .post('/api/v1/wallet/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '100',
        toAddress: uniqueTrc20Address('cmp-block'),
        idempotencyKey: `wd-blocked-${Date.now()}`,
      });
    expect(blocked.status).toBe(403);
  });

  it('frozen wallet blocks secondary listing create', async () => {
    const holder = email('list-frozen');
    const { token, userId } = await register(app!, holder);
    await seedWalletWithLedger(userId, '1000');

    const complianceEmail = email('comp-list');
    await register(app!, complianceEmail);
    await assignRole(complianceEmail, UserRoleCode.COMPLIANCE);
    const cLogin = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: complianceEmail, password: 'TestPass123!' });
    const cToken = cLogin.body.tokens.accessToken as string;

    const prisma = new PrismaClient();
    const wallet = await prisma.wallet.findFirst({ where: { userId } });
    const release = await prisma.release.create({
      data: {
        slug: `e2e-cmp-list-${Date.now()}`,
        symbol: `CL${Date.now() % 10000}`,
        title: 'Compliance List',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(100),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(5),
        status: ReleaseStatus.ACTIVE,
      },
    });
    await prisma.userPosition.create({
      data: {
        userId,
        releaseId: release.id,
        unitsTotal: new Prisma.Decimal(5),
        unitsAvailable: new Prisma.Decimal(5),
        unitsLocked: new Prisma.Decimal(0),
        avgEntryPrice: new Prisma.Decimal(5),
      },
    });
    await prisma.$disconnect();

    const freeze = await request(app!.getHttpServer())
      .post(`/api/admin/v1/compliance/operations/${wallet!.id}/freeze`)
      .set('Authorization', `Bearer ${cToken}`)
      .send({ operationType: 'wallet', note: 'e2e list block' });
    expect([200, 201]).toContain(freeze.status);

    const listing = await request(app!.getHttpServer())
      .post('/api/v1/market/listings')
      .set('Authorization', `Bearer ${token}`)
      .send({ releaseId: release.id, units: 1, pricePerUnit: 10 });
    expect(listing.status).toBe(403);
  });

  it('suspended user cannot create withdrawal', async () => {
    const holder = email('suspended');
    const { token, userId } = await register(app!, holder);
    await seedWalletWithLedger(userId, '500');

    const prisma = new PrismaClient();
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    });
    await prisma.$disconnect();

    const wd = await request(app!.getHttpServer())
      .post('/api/v1/wallet/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '50',
        toAddress: uniqueTrc20Address('cmp-susp'),
        idempotencyKey: `wd-susp-${Date.now()}`,
      });
    expect(wd.status).toBe(401);
  });
});
