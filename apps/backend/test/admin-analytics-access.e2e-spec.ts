import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(prefix: string): string {
  return `e2e-analytics-${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password, 'E2E Analytics'));
  expect(reg.status).toBe(201);

  const prisma = new PrismaClient();
  await prisma.user.updateMany({
    where: { email },
    data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() },
  });
  await prisma.$disconnect();
  return password;
}

async function login(app: E2eApp, email: string, password: string) {
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
  const password = await registerUser(app, email);
  await assignRole(email, role);
  return login(app, email, password);
}

const ANALYTICS_SUMMARY_PATHS = [
  '/api/admin/v1/analytics/overview',
  '/api/admin/v1/analytics/finance/summary',
  '/api/admin/v1/analytics/users/summary',
  '/api/admin/v1/analytics/tracks/summary',
  '/api/admin/v1/analytics/market/summary',
  '/api/admin/v1/analytics/revenue/summary',
  '/api/admin/v1/analytics/risk/summary',
  '/api/admin/v1/analytics/support/summary',
] as const;

describe('Admin analytics API (e2e)', () => {
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

  it('analytics endpoints without session return 401', async () => {
    for (const path of ANALYTICS_SUMMARY_PATHS) {
      const res = await request(app!.getHttpServer()).get(path);
      expect(res.status).toBe(401);
    }
    const dash = await request(app!.getHttpServer()).get(
      '/api/admin/v1/dashboard/summary',
    );
    expect(dash.status).toBe(401);
  });

  it('regular user is forbidden from analytics finance summary', async () => {
    const email = staffEmail('holder');
    const password = await registerUser(app!, email);
    const token = await login(app!, email, password);

    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/analytics/finance/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('SUPER_ADMIN receives analytics overview with expected shape', async () => {
    const token = await staffToken(app!, 'super', UserRoleCode.SUPER_ADMIN);

    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/analytics/overview?period=30d')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('finance');
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('market');

    const trends = await request(app!.getHttpServer())
      .get('/api/admin/v1/dashboard/trends?period=7d')
      .set('Authorization', `Bearer ${token}`);
    expect(trends.status).toBe(200);
    expect(trends.body).toHaveProperty('deposits');
    expect(trends.body).toHaveProperty('withdrawals');
    expect(Array.isArray(trends.body.deposits)).toBe(true);
  });

  it('BUSINESS_ANALYST can read analytics and dashboard but cannot approve withdrawals', async () => {
    const token = await staffToken(
      app!,
      'analyst',
      UserRoleCode.BUSINESS_ANALYST,
    );

    const finance = await request(app!.getHttpServer())
      .get('/api/admin/v1/analytics/finance/summary?period=30d')
      .set('Authorization', `Bearer ${token}`);
    expect(finance.status).toBe(200);
    expect(finance.body).toHaveProperty('depositsUsdt');

    const tracks = await request(app!.getHttpServer())
      .get('/api/admin/v1/analytics/tracks/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(tracks.status).toBe(200);

    const mutate = await request(app!.getHttpServer())
      .post(
        '/api/admin/v1/withdrawals/00000000-0000-4000-8000-000000000001/approve',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'e2e' });
    expect(mutate.status).toBe(403);

    const roles = await request(app!.getHttpServer())
      .get('/api/admin/v1/roles')
      .set('Authorization', `Bearer ${token}`);
    expect(roles.status).toBe(403);
  });

  it('ACCOUNTANT can read finance analytics but not tracks summary', async () => {
    const token = await staffToken(app!, 'accountant', UserRoleCode.ACCOUNTANT);

    const finance = await request(app!.getHttpServer())
      .get('/api/admin/v1/analytics/finance/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(finance.status).toBe(200);

    const tracks = await request(app!.getHttpServer())
      .get('/api/admin/v1/analytics/tracks/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(tracks.status).toBe(403);
  });

  it('CONTENT_MANAGER can read tracks analytics but not finance summary', async () => {
    const token = await staffToken(
      app!,
      'content',
      UserRoleCode.CONTENT_MANAGER,
    );

    const tracks = await request(app!.getHttpServer())
      .get('/api/admin/v1/analytics/tracks/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(tracks.status).toBe(200);

    const finance = await request(app!.getHttpServer())
      .get('/api/admin/v1/analytics/finance/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(finance.status).toBe(403);
  });

  it('COMPLIANCE can read risk analytics but not finance summary', async () => {
    const token = await staffToken(app!, 'compliance', UserRoleCode.COMPLIANCE);

    const risk = await request(app!.getHttpServer())
      .get('/api/admin/v1/analytics/risk/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(risk.status).toBe(200);
    expect(risk.body).toHaveProperty('openFlags');
    expect(risk.body).toHaveProperty('overdueSla');

    const riskPaths = [
      '/api/admin/v1/analytics/risk/by-severity',
      '/api/admin/v1/analytics/risk/by-type',
      '/api/admin/v1/analytics/risk/queue-aging',
      '/api/admin/v1/analytics/risk/high-value-operations',
      '/api/admin/v1/analytics/risk/queue',
      '/api/admin/v1/analytics/risk/rules-performance',
      '/api/admin/v1/analytics/risk/repeat-offenders',
      '/api/admin/v1/analytics/risk/freeze-impact',
      '/api/admin/v1/analytics/risk/resolution-quality',
    ] as const;
    for (const path of riskPaths) {
      const res = await request(app!.getHttpServer())
        .get(`${path}?period=30d`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }

    const finance = await request(app!.getHttpServer())
      .get('/api/admin/v1/analytics/finance/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(finance.status).toBe(403);
  });

  it('SUPPORT_MANAGER can read support analytics but not finance summary', async () => {
    const token = await staffToken(
      app!,
      'support',
      UserRoleCode.SUPPORT_MANAGER,
    );

    const support = await request(app!.getHttpServer())
      .get('/api/admin/v1/analytics/support/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(support.status).toBe(200);
    expect(support.body).toHaveProperty('openTickets');
    expect(support.body).toHaveProperty('overdueSla');

    const supportPaths = [
      '/api/admin/v1/analytics/support/by-status',
      '/api/admin/v1/analytics/support/by-category',
      '/api/admin/v1/analytics/support/response-time',
      '/api/admin/v1/analytics/support/queue',
      '/api/admin/v1/analytics/support/sla',
      '/api/admin/v1/analytics/support/finance-related',
      '/api/admin/v1/analytics/support/escalations',
      '/api/admin/v1/analytics/support/workload',
      '/api/admin/v1/analytics/support/resolution-quality',
      '/api/admin/v1/analytics/support/product-pain-points',
    ] as const;
    for (const path of supportPaths) {
      const res = await request(app!.getHttpServer())
        .get(`${path}?period=30d`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }

    const finance = await request(app!.getHttpServer())
      .get('/api/admin/v1/analytics/finance/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(finance.status).toBe(403);
  });

  it('rejects custom analytics period longer than 366 days', async () => {
    const token = await staffToken(app!, 'period', UserRoleCode.SUPER_ADMIN);
    const from = '2020-01-01';
    const to = '2026-01-01';

    const res = await request(app!.getHttpServer())
      .get(`/api/admin/v1/dashboard/trends?dateFrom=${from}&dateTo=${to}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
