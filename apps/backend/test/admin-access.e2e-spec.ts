import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { e2eEmail } from './helpers/e2e-unique';

function staffEmail(prefix: string): string {
  return e2eEmail(`e2e-${prefix}`);
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password, 'E2E'));
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

describe('Admin API role matrix (e2e)', () => {
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

  it('GET /api/admin/v1/access without session returns 401', async () => {
    const res = await request(app!.getHttpServer()).get('/api/admin/v1/access');
    expect(res.status).toBe(401);
  });

  it('regular user is forbidden from admin users list', async () => {
    const token = await registerUser(app!, staffEmail('holder'));
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('SUPPORT_MANAGER can access admin gate', async () => {
    const email = staffEmail('support');
    await registerUser(app!, email);
    await assignRole(email, UserRoleCode.SUPPORT_MANAGER);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const staffToken = login.body.tokens.accessToken as string;

    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/access')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      version: 'v1',
      capabilities: expect.objectContaining({
        assignRoles: expect.any(Boolean),
        patchPlatformFees: expect.any(Boolean),
      }),
    });
    expect(Array.isArray(res.body.sections)).toBe(true);
  });

  it('ACCOUNTANT can view withdrawals but not platform fee PATCH', async () => {
    const email = staffEmail('accountant');
    await registerUser(app!, email);
    await assignRole(email, UserRoleCode.ACCOUNTANT);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const token = login.body.tokens.accessToken as string;

    const access = await request(app!.getHttpServer())
      .get('/api/admin/v1/access')
      .set('Authorization', `Bearer ${token}`);
    expect(access.status).toBe(200);
    expect(access.body.sections).toContain('withdrawals');
    expect(access.body.sections).toContain('referrals');
    expect(access.body.sections).toContain('treasury');
    expect(access.body.sections).toContain('notifications');

    const feesPatch = await request(app!.getHttpServer())
      .patch('/api/admin/v1/platform-fees')
      .set('Authorization', `Bearer ${token}`)
      .send({ withdrawalFeeUsdt: '10' });
    expect(feesPatch.status).toBe(403);
  });

  it('CONTENT_MANAGER is forbidden from withdrawals', async () => {
    const email = staffEmail('content');
    await registerUser(app!, email);
    await assignRole(email, UserRoleCode.CONTENT_MANAGER);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const token = login.body.tokens.accessToken as string;

    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/withdrawals')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('COMPLIANCE access includes legal and referrals sections', async () => {
    const email = staffEmail('compliance-matrix');
    await registerUser(app!, email);
    await assignRole(email, UserRoleCode.COMPLIANCE);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const token = login.body.tokens.accessToken as string;

    const access = await request(app!.getHttpServer())
      .get('/api/admin/v1/access')
      .set('Authorization', `Bearer ${token}`);
    expect(access.status).toBe(200);
    expect(access.body.sections).toContain('legal');
    expect(access.body.sections).toContain('compliance');
    expect(access.body.sections).toContain('referrals');
    expect(access.body.sections).toContain('treasury');
  });

  it('COMPLIANCE can view secondary market listings', async () => {
    const email = staffEmail('compliance');
    await registerUser(app!, email);
    await assignRole(email, UserRoleCode.COMPLIANCE);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const token = login.body.tokens.accessToken as string;

    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/listings')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('SUPER_ADMIN can access panel and search endpoints', async () => {
    const email = staffEmail('super');
    await registerUser(app!, email);
    await assignRole(email, UserRoleCode.SUPER_ADMIN);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const token = login.body.tokens.accessToken as string;

    const access = await request(app!.getHttpServer())
      .get('/api/admin/v1/access')
      .set('Authorization', `Bearer ${token}`);
    expect(access.status).toBe(200);
    expect(access.body.capabilities.assignRoles).toBe(true);
    expect(access.body.capabilities.patchPlatformFees).toBe(true);
    expect(access.body.sections).toContain('referrals');
    expect(access.body.sections).toContain('legal');
    expect(access.body.sections).toContain('treasury');
    expect(access.body.sections).toContain('notifications');
  });

  it('CONTENT_MANAGER can view tracks but not roles list', async () => {
    const email = staffEmail('content-tracks');
    await registerUser(app!, email);
    await assignRole(email, UserRoleCode.CONTENT_MANAGER);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const token = login.body.tokens.accessToken as string;

    const tracks = await request(app!.getHttpServer())
      .get('/api/admin/v1/tracks')
      .set('Authorization', `Bearer ${token}`);
    expect(tracks.status).toBe(200);

    const roles = await request(app!.getHttpServer())
      .get('/api/admin/v1/roles')
      .set('Authorization', `Bearer ${token}`);
    expect(roles.status).toBe(403);
  });
});
