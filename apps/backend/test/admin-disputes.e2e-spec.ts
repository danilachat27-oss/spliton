import request from 'supertest';
import {
  DisputeStatus,
  DisputeType,
  PrismaClient,
  UserRoleCode,
  UserStatus,
} from '@prisma/client';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(prefix: string): string {
  return `e2e-${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  await request(app.getHttpServer())
    .post('/auth/register')
    .send(e2eRegisterPayload(email, password, 'E2E'))
    .expect(201);

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

describe('Admin disputes (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('lists disputes, replies, and patches status with audit', async () => {
    const managerEmail = staffEmail('dispute-mgr');
    await registerUser(app!, managerEmail);
    await assignRole(managerEmail, UserRoleCode.SUPPORT_MANAGER);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: managerEmail, password: 'TestPass123!' });
    const adminToken = login.body.tokens.accessToken as string;

    const prisma = new PrismaClient();
    const holder = await prisma.user.findFirst({
      where: { status: UserStatus.ACTIVE, email: { not: managerEmail } },
    });
    expect(holder).toBeTruthy();
    const dispute = await prisma.dispute.create({
      data: {
        userId: holder!.id,
        type: DisputeType.DEPOSIT_NOT_CREDITED,
        subject: 'E2E admin dispute',
        description: 'Funds missing',
        status: DisputeStatus.WAITING_FOR_ADMIN,
      },
    });
    await prisma.disputeMessage.create({
      data: {
        disputeId: dispute.id,
        authorUserId: holder!.id,
        body: 'User dispute message',
      },
    });
    await prisma.$disconnect();

    const auth = { Authorization: `Bearer ${adminToken}` };

    const list = await request(app!.getHttpServer())
      .get('/api/admin/v1/disputes')
      .set(auth);
    expect(list.status).toBe(200);
    expect(list.body.items?.length).toBeGreaterThan(0);

    const detail = await request(app!.getHttpServer())
      .get(`/api/admin/v1/disputes/${dispute.id}`)
      .set(auth);
    expect(detail.status).toBe(200);
    expect(detail.body.subject).toBe('E2E admin dispute');

    const reply = await request(app!.getHttpServer())
      .post(`/api/admin/v1/disputes/${dispute.id}/reply`)
      .set(auth)
      .send({ body: 'Staff dispute reply' });
    expect([200, 201]).toContain(reply.status);
    expect(
      reply.body.messages?.some((m: { isStaff: boolean }) => m.isStaff),
    ).toBe(true);

    const resolved = await request(app!.getHttpServer())
      .patch(`/api/admin/v1/disputes/${dispute.id}/status`)
      .set(auth)
      .send({ status: 'resolved', note: 'Credited manually' });
    expect(resolved.status).toBe(200);
    expect(resolved.body.status).toBe('resolved');

    const prisma2 = new PrismaClient();
    const audit = await prisma2.auditLog.findFirst({
      where: { entityType: 'dispute', entityId: dispute.id, action: 'dispute.status_change' },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeTruthy();
    await prisma2.$disconnect();
  });

  it('forbids SUPPORT from resolving disputes', async () => {
    const supportEmail = staffEmail('dispute-support');
    await registerUser(app!, supportEmail);
    await assignRole(supportEmail, UserRoleCode.SUPPORT);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: supportEmail, password: 'TestPass123!' });
    const token = login.body.tokens.accessToken as string;

    const prisma = new PrismaClient();
    const holder = await prisma.user.findFirst({ where: { status: UserStatus.ACTIVE } });
    const dispute = await prisma.dispute.create({
      data: {
        userId: holder!.id,
        type: DisputeType.OTHER,
        subject: 'RBAC dispute',
        description: 'Test',
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .patch(`/api/admin/v1/disputes/${dispute.id}/status`)
      .set({ Authorization: `Bearer ${token}` })
      .send({ status: 'resolved' });
    expect(res.status).toBe(403);
  });
});
