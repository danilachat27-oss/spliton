import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(prefix: string): string {
  return `e2e-rs-${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password, 'E2E RS'));
  expect(reg.status).toBe(201);

  const prisma = new PrismaClient();
  await prisma.user.updateMany({
    where: { email },
    data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() },
  });
  await prisma.$disconnect();
  return password;
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
}

async function staffToken(app: E2eApp, prefix: string, role: UserRoleCode) {
  const email = staffEmail(prefix);
  const password = await registerUser(app, email);
  await assignRole(email, role);
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });
  expect([200, 201]).toContain(login.status);
  return login.body.tokens.accessToken as string;
}

describe('Admin reports and settings fees (e2e)', () => {
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

  it('CONTENT_MANAGER can generate tracks_round_progress only', async () => {
    const token = await staffToken(
      app!,
      'cm-report',
      UserRoleCode.CONTENT_MANAGER,
    );

    const ok = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate')
      .query({
        type: 'tracks_round_progress',
        dateFrom: '2020-01-01',
        dateTo: '2020-01-31',
      })
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201, 202]).toContain(ok.status);

    const denied = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate')
      .query({
        type: 'withdrawals',
        dateFrom: '2020-01-01',
        dateTo: '2020-01-31',
      })
      .set('Authorization', `Bearer ${token}`);
    expect(denied.status).toBe(403);
  });

  it('ACCOUNTANT can generate finance report', async () => {
    const token = await staffToken(app!, 'acc-report', UserRoleCode.ACCOUNTANT);
    const res = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate')
      .query({
        type: 'withdrawals',
        dateFrom: '2020-01-01',
        dateTo: '2020-01-31',
      })
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
  });

  it('regular USER gets 403 on reports', async () => {
    const email = staffEmail('user-report');
    const password = await registerUser(app!, email);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    const token = login.body.tokens.accessToken as string;

    const res = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate')
      .query({
        type: 'withdrawals',
        dateFrom: '2020-01-01',
        dateTo: '2020-01-31',
      })
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('SUPER_ADMIN can PATCH platform fees; ADMIN and ACCOUNTANT cannot', async () => {
    const superToken = await staffToken(
      app!,
      'super-fees',
      UserRoleCode.SUPER_ADMIN,
    );
    const adminToken = await staffToken(app!, 'admin-fees', UserRoleCode.ADMIN);
    const accToken = await staffToken(
      app!,
      'acc-fees',
      UserRoleCode.ACCOUNTANT,
    );

    const getAdmin = await request(app!.getHttpServer())
      .get('/api/admin/v1/platform-fees')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getAdmin.status).toBe(200);

    const patchSuper = await request(app!.getHttpServer())
      .patch('/api/admin/v1/platform-fees')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        primaryPurchaseFeePct: '2.5',
        withdrawalFeeUsdt: '1',
        secondaryMarketFeePct: '1',
      });
    expect([200, 201]).toContain(patchSuper.status);

    const patchAdmin = await request(app!.getHttpServer())
      .patch('/api/admin/v1/platform-fees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        primaryPurchaseFeePct: '3',
        withdrawalFeeUsdt: '2',
        secondaryMarketFeePct: '2',
      });
    expect(patchAdmin.status).toBe(403);

    const patchAcc = await request(app!.getHttpServer())
      .patch('/api/admin/v1/platform-fees')
      .set('Authorization', `Bearer ${accToken}`)
      .send({
        primaryPurchaseFeePct: '3',
        withdrawalFeeUsdt: '2',
        secondaryMarketFeePct: '2',
      });
    expect(patchAcc.status).toBe(403);
  });

  it('SUPER_ADMIN PATCH platform fees writes audit log', async () => {
    const superToken = await staffToken(
      app!,
      'super-fees-audit',
      UserRoleCode.SUPER_ADMIN,
    );

    const patchSuper = await request(app!.getHttpServer())
      .patch('/api/admin/v1/platform-fees')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        primaryPurchaseFeePct: '2.6',
        withdrawalFeeUsdt: '1.5',
        secondaryMarketFeePct: '1.1',
      });
    expect([200, 201]).toContain(patchSuper.status);

    const prisma = new PrismaClient();
    const audit = await prisma.auditLog.findFirst({
      where: { action: 'platform_fees.update' },
      orderBy: { createdAt: 'desc' },
    });
    await prisma.$disconnect();
    expect(audit).toBeTruthy();
  });
});
