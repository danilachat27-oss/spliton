import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(prefix: string): string {
  return `e2e-${prefix}-${Date.now()}@example.com`;
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

async function userIdByEmail(email: string) {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  await prisma.$disconnect();
  return user!.id;
}

async function staffToken(app: E2eApp, role: UserRoleCode) {
  const email = staffEmail(role.toLowerCase());
  await registerUser(app, email);
  await assignRole(email, role);
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'TestPass123!' });
  return login.body.tokens.accessToken as string;
}

describe('Admin compliance API (e2e)', () => {
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

  it('COMPLIANCE can read summary and risk flags', async () => {
    const token = await staffToken(app!, UserRoleCode.COMPLIANCE);
    const summary = await request(app!.getHttpServer())
      .get('/api/admin/v1/compliance/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(summary.status).toBe(200);
    expect(summary.body).toHaveProperty('openCount');

    const list = await request(app!.getHttpServer())
      .get('/api/admin/v1/compliance/risk-flags')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveProperty('items');
  });

  it('BUSINESS_ANALYST can read but not create risk flag', async () => {
    const token = await staffToken(app!, UserRoleCode.BUSINESS_ANALYST);
    const list = await request(app!.getHttpServer())
      .get('/api/admin/v1/compliance/risk-flags')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);

    const create = await request(app!.getHttpServer())
      .post('/api/admin/v1/compliance/risk-flags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: '00000000-0000-0000-0000-000000000001',
        flagCode: 'manual_flag',
      });
    expect(create.status).toBe(403);
  });

  it('COMPLIANCE can create flag, add note, resolve with note', async () => {
    const token = await staffToken(app!, UserRoleCode.COMPLIANCE);
    const holderEmail = staffEmail('holder');
    await registerUser(app!, holderEmail);
    const userId = await userIdByEmail(holderEmail);

    const created = await request(app!.getHttpServer())
      .post('/api/admin/v1/compliance/risk-flags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        flagCode: 'manual_flag',
        severity: 'medium',
        note: 'e2e test flag',
        kind: 'user',
        reference: userId,
        riskScore: 50,
      });
    expect([200, 201]).toContain(created.status);
    const flagId = created.body.id as string;

    const noteRes = await request(app!.getHttpServer())
      .post(`/api/admin/v1/compliance/risk-flags/${flagId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'internal note' });
    expect([200, 201]).toContain(noteRes.status);

    const resolve = await request(app!.getHttpServer())
      .post(`/api/admin/v1/compliance/risk-flags/${flagId}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'reviewed ok' });
    expect([200, 201]).toContain(resolve.status);
    expect(resolve.body.status).toBe('resolved');
  });

  it('resolve without note returns 400', async () => {
    const token = await staffToken(app!, UserRoleCode.COMPLIANCE);
    const holderEmail = staffEmail('holder2');
    await registerUser(app!, holderEmail);
    const userId = await userIdByEmail(holderEmail);

    const created = await request(app!.getHttpServer())
      .post('/api/admin/v1/compliance/risk-flags')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, flagCode: 'manual_flag' });
    expect([200, 201]).toContain(created.status);

    const resolve = await request(app!.getHttpServer())
      .post(`/api/admin/v1/compliance/risk-flags/${created.body.id}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(resolve.status).toBe(400);
  });

  it('GET risk-rules returns catalog', async () => {
    const token = await staffToken(app!, UserRoleCode.COMPLIANCE);
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/compliance/risk-rules')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
  });
});
