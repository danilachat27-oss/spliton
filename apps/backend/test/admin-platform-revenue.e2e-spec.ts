import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(prefix: string): string {
  return `e2e-platform-revenue-${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password, 'E2E Platform Revenue'));
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

describe('Admin platform revenue API (e2e)', () => {
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

  it('GET /api/admin/v1/platform-revenue/summary without session returns 401', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/admin/v1/platform-revenue/summary',
    );
    expect(res.status).toBe(401);
  });

  it('ACCOUNTANT can view platform revenue summary', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/platform-revenue/summary?period=30d')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalUsdt: expect.any(String),
      periodUsdt: expect.any(String),
      transactionCount: expect.any(Number),
    });
  });

  it('ACCOUNTANT can read platform fees but not patch', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const getRes = await request(app!.getHttpServer())
      .get('/api/admin/v1/platform-fees')
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);

    const patchRes = await request(app!.getHttpServer())
      .patch('/api/admin/v1/platform-fees')
      .set('Authorization', `Bearer ${token}`)
      .send({ primaryPurchaseFeePct: '3' });
    expect(patchRes.status).toBe(403);
  });
});
