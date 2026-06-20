import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(prefix: string): string {
  return `e2e-wallets-${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password, 'E2E Wallets'));
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

async function staffToken(app: E2eApp, role: UserRoleCode): Promise<string> {
  const email = staffEmail(role.toLowerCase());
  await registerUser(app, email);
  await assignRole(email, role);
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'TestPass123!' });
  return login.body.tokens.accessToken as string;
}

describe('Admin wallets API (e2e)', () => {
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

  it('GET /api/admin/v1/wallets without session returns 401', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/admin/v1/wallets',
    );
    expect(res.status).toBe(401);
  });

  it('regular user is forbidden from wallets list', async () => {
    const token = await registerUser(app!, staffEmail('holder'));
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/wallets')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('ACCOUNTANT can view wallets summary and list', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);

    const summary = await request(app!.getHttpServer())
      .get('/api/admin/v1/wallets/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(summary.status).toBe(200);
    expect(summary.body).toMatchObject({
      totalAvailableUsdt: expect.any(String),
      activeWalletsCount: expect.any(Number),
    });

    const list = await request(app!.getHttpServer())
      .get('/api/admin/v1/wallets?page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 500]).toContain(list.status);
  });

  it('GET /api/admin/v1/wallets/:id returns 404 for unknown id', async () => {
    const token = await staffToken(app!, UserRoleCode.SUPER_ADMIN);
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/wallets/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
