import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(prefix: string): string {
  return `e2e-rbac-${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password, 'E2E RBAC'));
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
  return user?.id;
}

async function staffToken(app: E2eApp, prefix: string, role: UserRoleCode) {
  const email = staffEmail(prefix);
  const password = await registerUser(app, email);
  await assignRole(email, role);
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });
  expect([200, 201]).toContain(login.status);
  return { token: login.body.tokens.accessToken as string, email, password };
}

describe('Admin role mutations (e2e)', () => {
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

  it('SUPER_ADMIN can assign and remove ACCOUNTANT role with audit', async () => {
    const superStaff = await staffToken(
      app!,
      'super-assign',
      UserRoleCode.SUPER_ADMIN,
    );
    const targetEmail = staffEmail('target');
    const password = await registerUser(app!, targetEmail);

    const loginTarget = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: targetEmail, password });
    const targetId = loginTarget.body.user?.id as string;

    const assign = await request(app!.getHttpServer())
      .post(`/api/admin/v1/users/${targetId}/roles`)
      .set('Authorization', `Bearer ${superStaff.token}`)
      .send({ role: UserRoleCode.ACCOUNTANT, note: 'e2e assign' });
    expect([200, 201]).toContain(assign.status);

    const remove = await request(app!.getHttpServer())
      .delete(
        `/api/admin/v1/users/${targetId}/roles/${UserRoleCode.ACCOUNTANT}`,
      )
      .set('Authorization', `Bearer ${superStaff.token}`);
    expect(remove.status).toBe(200);

    const audit = await request(app!.getHttpServer())
      .get('/api/admin/v1/audit-logs?pageSize=20')
      .set('Authorization', `Bearer ${superStaff.token}`);
    expect(audit.status).toBe(200);
    const actions = (audit.body.items as Array<{ action: string }>).map(
      (i) => i.action,
    );
    expect(actions).toEqual(
      expect.arrayContaining(['user.role_assign', 'user.role_remove']),
    );
  });

  it('COMPLIANCE cannot assign roles', async () => {
    const compliance = await staffToken(
      app!,
      'compliance',
      UserRoleCode.COMPLIANCE,
    );
    const targetEmail = staffEmail('target2');
    const password = await registerUser(app!, targetEmail);
    const loginTarget = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: targetEmail, password });
    const targetId = loginTarget.body.user?.id as string;

    const res = await request(app!.getHttpServer())
      .post(`/api/admin/v1/users/${targetId}/roles`)
      .set('Authorization', `Bearer ${compliance.token}`)
      .send({ role: UserRoleCode.SUPPORT_MANAGER });
    expect(res.status).toBe(403);
  });

  it('ADMIN legacy cannot assign roles (only SUPER_ADMIN)', async () => {
    const admin = await staffToken(app!, 'admin-legacy', UserRoleCode.ADMIN);
    const targetEmail = staffEmail('target3');
    const password = await registerUser(app!, targetEmail);
    const loginTarget = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: targetEmail, password });
    const targetId = loginTarget.body.user?.id as string;

    const res = await request(app!.getHttpServer())
      .post(`/api/admin/v1/users/${targetId}/roles`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: UserRoleCode.ACCOUNTANT });
    expect(res.status).toBe(403);
  });

  it('SUPER_ADMIN can remove another user SUPER_ADMIN when multiple exist', async () => {
    const superA = await staffToken(app!, 'super-a', UserRoleCode.SUPER_ADMIN);
    const superB = await staffToken(app!, 'super-b', UserRoleCode.SUPER_ADMIN);

    const prisma = new PrismaClient();
    const userB = await prisma.user.findUnique({
      where: { email: superB.email },
    });
    await prisma.$disconnect();
    expect(userB).toBeTruthy();

    const removeB = await request(app!.getHttpServer())
      .delete(
        `/api/admin/v1/users/${userB!.id}/roles/${UserRoleCode.SUPER_ADMIN}`,
      )
      .set('Authorization', `Bearer ${superA.token}`);
    expect(removeB.status).toBe(200);
  });

  it('ADMIN cannot PATCH platform fees (SUPER_ADMIN only)', async () => {
    const admin = await staffToken(app!, 'admin-fees', UserRoleCode.ADMIN);
    const res = await request(app!.getHttpServer())
      .patch('/api/admin/v1/platform-fees')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ withdrawalFeeUsdt: '5' });
    expect(res.status).toBe(403);
  });

  it('CONTENT_MANAGER can list reports but cannot generate withdrawals report', async () => {
    const cm = await staffToken(app!, 'content', UserRoleCode.CONTENT_MANAGER);

    const list = await request(app!.getHttpServer())
      .get('/api/admin/v1/reports')
      .set('Authorization', `Bearer ${cm.token}`);
    expect(list.status).toBe(200);

    const denied = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate?type=withdrawals')
      .set('Authorization', `Bearer ${cm.token}`);
    expect(denied.status).toBe(403);
  });
});
