import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(prefix: string): string {
  return `e2e-detail-${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password, 'E2E Detail'));
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
  return { token: login.body.tokens.accessToken as string, email };
}

describe('Admin user detail access (e2e)', () => {
  let app: E2eApp | undefined;
  let targetUserId: string;

  beforeEach(async () => {
    app = await createE2eApp();
    const targetEmail = staffEmail('target-user');
    const password = await registerUser(app, targetEmail);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: targetEmail, password });
    targetUserId = login.body.user?.id as string;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('SUPER_ADMIN can open user detail', async () => {
    const superStaff = await staffToken(
      app!,
      'super-detail',
      UserRoleCode.SUPER_ADMIN,
    );
    const res = await request(app!.getHttpServer())
      .get(`/api/admin/v1/users/${targetUserId}`)
      .set('Authorization', `Bearer ${superStaff.token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(targetUserId);
  });

  it('SUPPORT can open user detail read-only (no role mutation)', async () => {
    const support = await staffToken(
      app!,
      'support-detail',
      UserRoleCode.SUPPORT,
    );
    const getRes = await request(app!.getHttpServer())
      .get(`/api/admin/v1/users/${targetUserId}`)
      .set('Authorization', `Bearer ${support.token}`);
    expect(getRes.status).toBe(200);

    const assign = await request(app!.getHttpServer())
      .post(`/api/admin/v1/users/${targetUserId}/roles`)
      .set('Authorization', `Bearer ${support.token}`)
      .send({ role: UserRoleCode.ACCOUNTANT });
    expect(assign.status).toBe(403);
  });

  it('regular USER cannot open admin user detail', async () => {
    const userEmail = staffEmail('plain-user');
    const password = await registerUser(app!, userEmail);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password });
    const token = login.body.tokens.accessToken as string;

    const res = await request(app!.getHttpServer())
      .get(`/api/admin/v1/users/${targetUserId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('role mutations on user detail are SUPER_ADMIN only', async () => {
    const admin = await staffToken(app!, 'admin-detail', UserRoleCode.ADMIN);
    const assign = await request(app!.getHttpServer())
      .post(`/api/admin/v1/users/${targetUserId}/roles`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: UserRoleCode.SUPPORT });
    expect(assign.status).toBe(403);
  });
});
