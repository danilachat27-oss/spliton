import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(prefix: string): string {
  return `e2e-news-${prefix}-${Date.now()}@example.com`;
}

async function registerAndLogin(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password))
    .expect(201);

  const prisma = new PrismaClient();
  await prisma.user.update({
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

describe('Admin news CRUD (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('creates, publishes and unpublishes with audit trail', async () => {
    const email = staffEmail('manager');
    await registerAndLogin(app!, email);
    await assignRole(email, UserRoleCode.NEWS_MANAGER);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const token = login.body.tokens.accessToken as string;
    const auth = { Authorization: `Bearer ${token}` };

    const slug = `e2e-news-${Date.now()}`;
    const created = await request(app!.getHttpServer())
      .post('/api/admin/v1/news')
      .set(auth)
      .send({
        title: 'E2E headline',
        slug,
        content: 'Body',
        category: 'platform',
      });
    expect(created.status).toBe(201);
    const id = created.body.id as string;
    expect(created.body.status).toBe('draft');

    await request(app!.getHttpServer())
      .post(`/api/admin/v1/news/${id}/publish`)
      .set(auth)
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('published');
      });

    const publicList = await request(app!.getHttpServer()).get('/api/v1/news');
    expect(
      publicList.body.items.some((i: { slug: string }) => i.slug === slug),
    ).toBe(true);

    await request(app!.getHttpServer())
      .post(`/api/admin/v1/news/${id}/unpublish`)
      .set(auth)
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('draft');
      });

    const prisma = new PrismaClient();
    const audits = await prisma.auditLog.findMany({
      where: { entityId: id, entityType: 'news_post' },
      orderBy: { createdAt: 'asc' },
    });
    await prisma.$disconnect();
    const actions = audits.map((a) => a.action);
    expect(actions).toEqual(
      expect.arrayContaining(['news.create', 'news.publish', 'news.unpublish']),
    );
  });
});
