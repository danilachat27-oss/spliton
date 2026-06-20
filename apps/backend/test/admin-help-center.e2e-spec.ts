import request from 'supertest';
import {
  HelpArticleStatus,
  PrismaClient,
  UserRoleCode,
  UserStatus,
} from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { e2eRegisterPayload } from './helpers/register-e2e-user';

function staffEmail(prefix: string): string {
  return `e2e-help-${prefix}-${Date.now()}@example.com`;
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

describe('Admin help center API (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('creates category and article, publishes with audit trail', async () => {
    const email = staffEmail('content');
    await registerAndLogin(app!, email);
    await assignRole(email, UserRoleCode.CONTENT_MANAGER);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const token = login.body.tokens.accessToken as string;
    const auth = { Authorization: `Bearer ${token}` };

    const catSlug = `e2e-cat-${Date.now()}`;
    const category = await request(app!.getHttpServer())
      .post('/api/admin/v1/help/categories')
      .set(auth)
      .send({
        slug: catSlug,
        titleTranslations: { ru: 'Категория' },
        isPublished: true,
      });
    expect(category.status).toBe(201);
    const categoryId = category.body.id as string;

    const artSlug = `e2e-art-${Date.now()}`;
    const article = await request(app!.getHttpServer())
      .post('/api/admin/v1/help/articles')
      .set(auth)
      .send({
        slug: artSlug,
        categoryId,
        titleTranslations: { ru: 'Заголовок' },
        contentTranslations: { ru: 'Контент' },
      });
    expect(article.status).toBe(201);
    expect(article.body.status).toBe('draft');
    const articleId = article.body.id as string;

    const published = await request(app!.getHttpServer())
      .patch(`/api/admin/v1/help/articles/${articleId}/publish`)
      .set(auth);
    expect(published.status).toBe(200);
    expect(published.body.status).toBe('published');

    const publicRes = await request(app!.getHttpServer()).get(
      `/api/v1/help/articles/${artSlug}`,
    );
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.article.slug).toBe(artSlug);

    const prisma = new PrismaClient();
    const audits = await prisma.auditLog.findMany({
      where: {
        entityType: { in: ['help_category', 'help_article'] },
        entityId: { in: [categoryId, articleId] },
      },
      orderBy: { createdAt: 'asc' },
    });
    await prisma.$disconnect();
    const actions = audits.map((a) => a.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        'help.category.created',
        'help.article.created',
        'help.article.published',
      ]),
    );
  });

  it('updates and deletes category and article (CONTENT_MANAGER CRUD)', async () => {
    const email = staffEmail('crud');
    await registerAndLogin(app!, email);
    await assignRole(email, UserRoleCode.CONTENT_MANAGER);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const auth = { Authorization: `Bearer ${login.body.tokens.accessToken}` };
    const suffix = Date.now();

    const created = await request(app!.getHttpServer())
      .post('/api/admin/v1/help/categories')
      .set(auth)
      .send({
        slug: `crud-cat-${suffix}`,
        titleTranslations: { ru: 'Original' },
        isPublished: true,
      });
    expect(created.status).toBe(201);
    const categoryId = created.body.id as string;

    await request(app!.getHttpServer())
      .patch(`/api/admin/v1/help/categories/${categoryId}`)
      .set(auth)
      .send({ titleTranslations: { ru: 'Updated title' } })
      .expect(200)
      .expect(({ body }) => {
        expect(body.titlePreview).toBe('Updated title');
      });

    const art = await request(app!.getHttpServer())
      .post('/api/admin/v1/help/articles')
      .set(auth)
      .send({
        slug: `crud-art-${suffix}`,
        categoryId,
        titleTranslations: { ru: 'Art' },
        contentTranslations: { ru: 'Body' },
      });
    expect(art.status).toBe(201);
    const articleId = art.body.id as string;

    await request(app!.getHttpServer())
      .patch(`/api/admin/v1/help/articles/${articleId}`)
      .set(auth)
      .send({ excerptTranslations: { ru: 'New excerpt' } })
      .expect(200);

    await request(app!.getHttpServer())
      .delete(`/api/admin/v1/help/articles/${articleId}`)
      .set(auth)
      .expect(200);

    await request(app!.getHttpServer())
      .delete(`/api/admin/v1/help/categories/${categoryId}`)
      .set(auth)
      .expect(200);
  });

  it('rejects publish when title or content missing', async () => {
    const email = staffEmail('publish-val');
    await registerAndLogin(app!, email);
    await assignRole(email, UserRoleCode.CONTENT_MANAGER);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const auth = { Authorization: `Bearer ${login.body.tokens.accessToken}` };
    const suffix = Date.now();

    const prisma = new PrismaClient();
    const author = await prisma.user.findUnique({ where: { email } });
    const category = await prisma.helpCategory.create({
      data: {
        slug: `pub-val-cat-${suffix}`,
        titleTranslations: { ru: 'Cat' },
        isPublished: true,
      },
    });
    const article = await prisma.helpArticle.create({
      data: {
        slug: `pub-val-art-${suffix}`,
        categoryId: category.id,
        titleTranslations: {},
        contentTranslations: {},
        status: HelpArticleStatus.DRAFT,
        authorUserId: author!.id,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .patch(`/api/admin/v1/help/articles/${article.id}/publish`)
      .set(auth);
    expect(res.status).toBe(400);
    expect(res.body.code).toMatch(/HELP_ARTICLE_(TITLE|CONTENT)_REQUIRED/);
  });

  it('SUPPORT_MANAGER can publish but SUPPORT cannot create categories', async () => {
    const managerEmail = staffEmail('support-mgr');
    await registerAndLogin(app!, managerEmail);
    await assignRole(managerEmail, UserRoleCode.SUPPORT_MANAGER);
    const mgrLogin = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: managerEmail, password: 'TestPass123!' });
    const mgrAuth = { Authorization: `Bearer ${mgrLogin.body.tokens.accessToken}` };

    const supportEmail = staffEmail('support-only');
    await registerAndLogin(app!, supportEmail);
    await assignRole(supportEmail, UserRoleCode.SUPPORT);
    const supLogin = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email: supportEmail, password: 'TestPass123!' });
    const supAuth = { Authorization: `Bearer ${supLogin.body.tokens.accessToken}` };

    await request(app!.getHttpServer())
      .get('/api/admin/v1/help/categories')
      .set(supAuth)
      .expect(200);

    await request(app!.getHttpServer())
      .post('/api/admin/v1/help/categories')
      .set(supAuth)
      .send({ slug: `forbidden-${Date.now()}`, titleTranslations: { ru: 'X' } })
      .expect(403);

    const prisma = new PrismaClient();
    const author = await prisma.user.findUnique({ where: { email: managerEmail } });
    const suffix = Date.now();
    const category = await prisma.helpCategory.create({
      data: {
        slug: `mgr-cat-${suffix}`,
        titleTranslations: { ru: 'Cat' },
        isPublished: true,
      },
    });
    const article = await prisma.helpArticle.create({
      data: {
        slug: `mgr-art-${suffix}`,
        categoryId: category.id,
        titleTranslations: { ru: 'Title' },
        contentTranslations: { ru: 'Content' },
        status: HelpArticleStatus.DRAFT,
        authorUserId: author!.id,
      },
    });
    await prisma.$disconnect();

    await request(app!.getHttpServer())
      .patch(`/api/admin/v1/help/articles/${article.id}/publish`)
      .set(mgrAuth)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('published');
      });
  });

  it('archived article is hidden from public API', async () => {
    const email = staffEmail('archive');
    await registerAndLogin(app!, email);
    await assignRole(email, UserRoleCode.CONTENT_MANAGER);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const auth = { Authorization: `Bearer ${login.body.tokens.accessToken}` };

    const prisma = new PrismaClient();
    const author = await prisma.user.findUnique({ where: { email } });
    const suffix = Date.now();
    const category = await prisma.helpCategory.create({
      data: {
        slug: `arch-cat-${suffix}`,
        titleTranslations: { ru: 'Cat' },
        isPublished: true,
      },
    });
    const slug = `arch-art-${suffix}`;
    const article = await prisma.helpArticle.create({
      data: {
        slug,
        categoryId: category.id,
        titleTranslations: { ru: 'Title' },
        contentTranslations: { ru: 'Body' },
        status: HelpArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        authorUserId: author!.id,
      },
    });
    await prisma.$disconnect();

    await request(app!.getHttpServer())
      .patch(`/api/admin/v1/help/articles/${article.id}/archive`)
      .set(auth)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('archived');
      });

    const list = await request(app!.getHttpServer())
      .get('/api/v1/help/articles')
      .query({ limit: 100 });
    expect(list.body.items.some((i: { slug: string }) => i.slug === slug)).toBe(
      false,
    );

    await request(app!.getHttpServer())
      .get(`/api/v1/help/articles/${slug}`)
      .expect(404);

    const prisma2 = new PrismaClient();
    const audit = await prisma2.auditLog.findFirst({
      where: { entityId: article.id, action: 'help.article.archived' },
    });
    await prisma2.$disconnect();
    expect(audit).toBeTruthy();
  });

  it('blocks category delete when articles exist', async () => {
    const email = staffEmail('delete-block');
    await registerAndLogin(app!, email);
    await assignRole(email, UserRoleCode.CONTENT_MANAGER);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const auth = { Authorization: `Bearer ${login.body.tokens.accessToken}` };

    const prisma = new PrismaClient();
    const author = await prisma.user.findUnique({ where: { email } });
    const suffix = Date.now();
    const category = await prisma.helpCategory.create({
      data: {
        slug: `blocked-cat-${suffix}`,
        titleTranslations: { ru: 'Cat' },
        isPublished: true,
      },
    });
    await prisma.helpArticle.create({
      data: {
        slug: `blocked-art-${suffix}`,
        categoryId: category.id,
        titleTranslations: { ru: 'T' },
        contentTranslations: { ru: 'C' },
        status: HelpArticleStatus.DRAFT,
        authorUserId: author!.id,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .delete(`/api/admin/v1/help/categories/${category.id}`)
      .set(auth);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('HELP_CATEGORY_HAS_ARTICLES');
  });

  it('forbids SUPPORT from publishing articles', async () => {
    const email = staffEmail('support-read');
    await registerAndLogin(app!, email);
    await assignRole(email, UserRoleCode.SUPPORT);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const auth = { Authorization: `Bearer ${login.body.tokens.accessToken}` };

    const prisma = new PrismaClient();
    const author = await prisma.user.findUnique({ where: { email } });
    const suffix = Date.now();
    const category = await prisma.helpCategory.create({
      data: {
        slug: `support-cat-${suffix}`,
        titleTranslations: { ru: 'Cat' },
        isPublished: true,
      },
    });
    const article = await prisma.helpArticle.create({
      data: {
        slug: `support-art-${suffix}`,
        categoryId: category.id,
        titleTranslations: { ru: 'Title' },
        contentTranslations: { ru: 'Body' },
        status: HelpArticleStatus.DRAFT,
        authorUserId: author!.id,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .patch(`/api/admin/v1/help/articles/${article.id}/publish`)
      .set(auth);
    expect(res.status).toBe(403);
  });
});
