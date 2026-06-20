import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(prefix: string): string {
  return `e2e-rbac15-${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password, 'E2E RBAC15'));
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

describe('Admin RBAC hardening (e2e)', () => {
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

  it('GET /api/admin/v1/access returns role matrix sections and capabilities', async () => {
    const token = await staffToken(app!, 'acc-access', UserRoleCode.ACCOUNTANT);
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/access')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      version: 'v1',
      capabilities: {
        assignRoles: false,
        patchPlatformFees: false,
        readOnly: false,
      },
    });
    expect(Array.isArray(res.body.sections)).toBe(true);
    expect(res.body.sections).toContain('withdrawals');
    expect(res.body.sections).toContain('tracks');
  });

  it('BUSINESS_ANALYST access is read-only and includes analytics', async () => {
    const token = await staffToken(app!, 'ba', UserRoleCode.BUSINESS_ANALYST);
    const access = await request(app!.getHttpServer())
      .get('/api/admin/v1/access')
      .set('Authorization', `Bearer ${token}`);
    expect(access.status).toBe(200);
    expect(access.body.capabilities.readOnly).toBe(true);
    expect(access.body.sections).toContain('analytics');
    expect(access.body.sections).toContain('disputes');
    expect(access.body.sections).not.toContain('deposits');

    const mutate = await request(app!.getHttpServer())
      .post('/api/admin/v1/revenue-events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        trackId: '00000000-0000-0000-0000-000000000001',
        grossRevenue: '100',
        periodFrom: '2026-01-01',
        periodTo: '2026-01-31',
      });
    expect(mutate.status).toBe(403);
  });

  it('SUPPORT_MANAGER can access support; withdrawals visible in matrix; tracks forbidden', async () => {
    const token = await staffToken(
      app!,
      'support',
      UserRoleCode.SUPPORT_MANAGER,
    );
    const access = await request(app!.getHttpServer())
      .get('/api/admin/v1/access')
      .set('Authorization', `Bearer ${token}`);
    expect(access.body.sections).toContain('support');
    expect(access.body.sections).toContain('withdrawals');

    const tracks = await request(app!.getHttpServer())
      .get('/api/admin/v1/tracks')
      .set('Authorization', `Bearer ${token}`);
    expect(tracks.status).toBe(403);
  });

  it('COMPLIANCE can view listings and block user with audit', async () => {
    const token = await staffToken(app!, 'compliance', UserRoleCode.COMPLIANCE);
    const listings = await request(app!.getHttpServer())
      .get('/api/admin/v1/listings')
      .set('Authorization', `Bearer ${token}`);
    expect(listings.status).toBe(200);

    const targetEmail = staffEmail('block-target');
    const password = await registerUser(app!, targetEmail);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: targetEmail, password });
    const targetId = login.body.user?.id as string;

    const block = await request(app!.getHttpServer())
      .post(`/api/admin/v1/compliance/users/${targetId}/block`)
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'e2e risk' });
    expect([200, 201]).toContain(block.status);

    const audit = await request(app!.getHttpServer())
      .get('/api/admin/v1/audit-logs?pageSize=30&search=compliance.user.block')
      .set('Authorization', `Bearer ${token}`);
    expect(audit.status).toBe(200);
    const actions = (audit.body.items as Array<{ action: string }>).map(
      (i) => i.action,
    );
    expect(actions).toContain('compliance.user.block');
  });

  it('ACCOUNTANT can view users list (read)', async () => {
    const token = await staffToken(app!, 'acc-users', UserRoleCode.ACCOUNTANT);
    const users = await request(app!.getHttpServer())
      .get('/api/admin/v1/users')
      .set('Authorization', `Bearer ${token}`);
    expect(users.status).toBe(200);
  });

  it('NEWS_MANAGER cannot read admin order detail (rounds forbidden)', async () => {
    const token = await staffToken(app!, 'news-ord', UserRoleCode.NEWS_MANAGER);
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/orders/00000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('regular investor cannot access admin API', async () => {
    const email = staffEmail('investor');
    const password = await registerUser(app!, email);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    const token = login.body.tokens.accessToken as string;

    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/access')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
