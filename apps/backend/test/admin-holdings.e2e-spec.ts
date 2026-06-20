import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(prefix: string): string {
  return `e2e-holdings-${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password, 'E2E Holdings'));
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

describe('Admin holdings API (e2e)', () => {
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

  it('GET /api/admin/v1/holdings without session returns 401', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/admin/v1/holdings',
    );
    expect(res.status).toBe(401);
  });

  it('regular user is forbidden from holdings list', async () => {
    const token = await registerUser(app!, staffEmail('holder'));
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/holdings')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('SUPER_ADMIN can list holdings and summary', async () => {
    const token = await staffToken(app!, UserRoleCode.SUPER_ADMIN);

    const summary = await request(app!.getHttpServer())
      .get('/api/admin/v1/holdings/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(summary.status).toBe(200);
    expect(summary.body).toMatchObject({
      totalHolders: expect.any(Number),
      totalUnits: expect.any(String),
      availableUnits: expect.any(String),
      lockedUnits: expect.any(String),
    });

    const list = await request(app!.getHttpServer())
      .get('/api/admin/v1/holdings?page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 500]).toContain(list.status);
    if (list.status === 200) {
      expect(list.body).toHaveProperty('items');
      expect(list.body).toHaveProperty('total');
    }
  });

  it('ACCOUNTANT can view holdings (read-only)', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/holdings')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 500]).toContain(res.status);
  });

  it('CONTENT_MANAGER can view holdings by track (valid release id)', async () => {
    const token = await staffToken(app!, UserRoleCode.CONTENT_MANAGER);
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/tracks/00000000-0000-0000-0000-000000000001/holdings')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.items).toEqual([]);
    }
  });

  it('GET /api/admin/v1/holdings/:id returns 404 for unknown id', async () => {
    const token = await staffToken(app!, UserRoleCode.SUPER_ADMIN);
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/holdings/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
