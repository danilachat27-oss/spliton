import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PartnerType, PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { e2eEmail } from './helpers/e2e-unique';

function staffEmail(prefix: string): string {
  return e2eEmail(`e2e-${prefix}`);
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password, 'E2E Partner'));
  expect(reg.status).toBe(201);

  const prisma = new PrismaClient();
  await prisma.user.updateMany({
    where: { email },
    data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() },
  });
  await prisma.$disconnect();

  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });
  expect([200, 201]).toContain(login.status);
  return login.body.tokens.accessToken as string;
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
  await registerUser(app, email);
  await assignRole(email, role);
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'TestPass123!' });
  return login.body.tokens.accessToken as string;
}

describe('Admin referrals / partners (e2e)', () => {
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

  it('user apply creates partner profile visible to admin', async () => {
    const userToken = await registerUser(app!, staffEmail('partner-applicant'));
    const apply = await request(app!.getHttpServer())
      .post('/api/v1/partners/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        partnerType: PartnerType.AFFILIATE,
        applicationNote: 'E2E partner application',
        payoutMethod: 'USDT TRC20',
      });
    expect([200, 201]).toContain(apply.status);

    const adminToken = await staffToken(app!, 'partner-admin', UserRoleCode.ACCOUNTANT);
    const list = await request(app!.getHttpServer())
      .get('/api/admin/v1/referrals/partners')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.items.some((p: { status: string }) => p.status === 'APPLIED')).toBe(
      true,
    );
  });

  it('ACCOUNTANT can approve partner; COMPLIANCE cannot approve', async () => {
    const userToken = await registerUser(app!, staffEmail('partner-target'));
    const apply = await request(app!.getHttpServer())
      .post('/api/v1/partners/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ partnerType: PartnerType.AFFILIATE, applicationNote: 'Approve me' });
    expect([200, 201]).toContain(apply.status);
    const partnerId = apply.body.partnerId as string;

    const complianceToken = await staffToken(
      app!,
      'partner-compliance',
      UserRoleCode.COMPLIANCE,
    );
    const denied = await request(app!.getHttpServer())
      .post(`/api/admin/v1/referrals/partners/${partnerId}/approve`)
      .set('Authorization', `Bearer ${complianceToken}`)
      .send({});
    expect(denied.status).toBe(403);

    const financeToken = await staffToken(app!, 'partner-finance', UserRoleCode.ACCOUNTANT);
    const approved = await request(app!.getHttpServer())
      .post(`/api/admin/v1/referrals/partners/${partnerId}/approve`)
      .set('Authorization', `Bearer ${financeToken}`)
      .send({});
    expect([200, 201]).toContain(approved.status);
    expect(approved.body.status).toBe('APPROVED');

    const prisma = new PrismaClient();
    const audit = await prisma.auditLog.findFirst({
      where: { entityId: partnerId, action: 'partner.approve' },
      orderBy: { createdAt: 'desc' },
    });
    await prisma.$disconnect();
    expect(audit).toBeTruthy();
  });

  it('reject requires reason and writes audit log', async () => {
    const userToken = await registerUser(app!, staffEmail('partner-reject'));
    const apply = await request(app!.getHttpServer())
      .post('/api/v1/partners/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ partnerType: PartnerType.AFFILIATE });
    const partnerId = apply.body.partnerId as string;

    const token = await staffToken(app!, 'partner-reject-admin', UserRoleCode.ADMIN);
    const rejected = await request(app!.getHttpServer())
      .post(`/api/admin/v1/referrals/partners/${partnerId}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Incomplete profile' });
    expect([200, 201]).toContain(rejected.status);
    expect(rejected.body.status).toBe('REJECTED');

    const prisma = new PrismaClient();
    const audit = await prisma.auditLog.findFirst({
      where: { entityId: partnerId, action: 'partner.reject' },
    });
    await prisma.$disconnect();
    expect(audit).toBeTruthy();
  });

  it('partner application creates admin notification', async () => {
    const userToken = await registerUser(app!, staffEmail('partner-notify'));
    await request(app!.getHttpServer())
      .post('/api/v1/partners/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ partnerType: PartnerType.AFFILIATE, applicationNote: 'Notify admins' });

    const adminToken = await staffToken(app!, 'partner-notify-admin', UserRoleCode.SUPER_ADMIN);
    const notifications = await request(app!.getHttpServer())
      .get('/api/admin/v1/notifications?unreadOnly=true')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(notifications.status).toBe(200);
    expect(
      notifications.body.items.some(
        (n: { type?: string; actionUrl?: string }) =>
          n.type === 'partner.application.new' || n.actionUrl === '/admin/referrals',
      ),
    ).toBe(true);
  });
});
