import request from 'supertest';
import {
  HelpArticleStatus,
  PrismaClient,
} from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

describe('Public help center API (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('lists only published categories', async () => {
    const prisma = new PrismaClient();
    const suffix = Date.now();

    await prisma.helpCategory.create({
      data: {
        slug: `draft-cat-${suffix}`,
        titleTranslations: { ru: 'Draft cat' },
        isPublished: false,
      },
    });

    const published = await prisma.helpCategory.create({
      data: {
        slug: `live-cat-${suffix}`,
        titleTranslations: { ru: 'Live cat', en: 'Live cat EN' },
        descriptionTranslations: { ru: 'Desc' },
        isPublished: true,
        sortOrder: 1,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .get('/api/v1/help/categories')
      .query({ locale: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.locale).toBe('en');
    expect(
      res.body.items.some((i: { slug: string }) => i.slug === published.slug),
    ).toBe(true);
    expect(
      res.body.items.some(
        (i: { slug: string }) => i.slug === `draft-cat-${suffix}`,
      ),
    ).toBe(false);
    expect(res.body.tree).toBeDefined();
  });

  it('returns category with published articles only', async () => {
    const prisma = new PrismaClient();
    const suffix = Date.now();
    const author = await prisma.user.findFirst();
    expect(author).toBeTruthy();

    const category = await prisma.helpCategory.create({
      data: {
        slug: `cat-articles-${suffix}`,
        titleTranslations: { ru: 'Категория' },
        isPublished: true,
      },
    });

    const liveSlug = `live-article-${suffix}`;
    await prisma.helpArticle.create({
      data: {
        slug: liveSlug,
        categoryId: category.id,
        titleTranslations: { ru: 'Live article' },
        excerptTranslations: { ru: 'Excerpt' },
        contentTranslations: { ru: 'Body' },
        status: HelpArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        authorUserId: author!.id,
      },
    });

    await prisma.helpArticle.create({
      data: {
        slug: `draft-article-${suffix}`,
        categoryId: category.id,
        titleTranslations: { ru: 'Draft article' },
        contentTranslations: { ru: 'Hidden' },
        status: HelpArticleStatus.DRAFT,
        authorUserId: author!.id,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/help/categories/${category.slug}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.category.slug).toBe(category.slug);
    expect(res.body.articles).toHaveLength(1);
    expect(res.body.articles[0].slug).toBe(liveSlug);
  });

  it('filters published articles by flags', async () => {
    const prisma = new PrismaClient();
    const suffix = Date.now();
    const author = await prisma.user.findFirst();

    await prisma.helpArticle.create({
      data: {
        slug: `featured-${suffix}`,
        titleTranslations: { ru: 'Featured' },
        excerptTranslations: { ru: 'Excerpt' },
        contentTranslations: { ru: 'Body' },
        status: HelpArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        isFeatured: true,
        authorUserId: author!.id,
      },
    });

    await prisma.helpArticle.create({
      data: {
        slug: `plain-${suffix}`,
        titleTranslations: { ru: 'Plain' },
        excerptTranslations: { ru: 'Excerpt' },
        contentTranslations: { ru: 'Body' },
        status: HelpArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        authorUserId: author!.id,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer())
      .get('/api/v1/help/articles')
      .query({ featured: 'true', limit: 50 });

    expect(res.status).toBe(200);
    expect(
      res.body.items.some((i: { slug: string }) => i.slug === `featured-${suffix}`),
    ).toBe(true);
    expect(
      res.body.items.some((i: { slug: string }) => i.slug === `plain-${suffix}`),
    ).toBe(false);
  });

  it('returns article by slug with breadcrumbs and increments viewCount', async () => {
    const prisma = new PrismaClient();
    const suffix = Date.now();
    const author = await prisma.user.findFirst();

    const parent = await prisma.helpCategory.create({
      data: {
        slug: `parent-${suffix}`,
        titleTranslations: { ru: 'Parent' },
        isPublished: true,
      },
    });

    const child = await prisma.helpCategory.create({
      data: {
        slug: `child-${suffix}`,
        parentId: parent.id,
        titleTranslations: { ru: 'Child' },
        isPublished: true,
      },
    });

    const slug = `article-detail-${suffix}`;
    const article = await prisma.helpArticle.create({
      data: {
        slug,
        categoryId: child.id,
        titleTranslations: { ru: 'Article title' },
        excerptTranslations: { ru: 'Excerpt' },
        contentTranslations: { ru: 'Full content' },
        status: HelpArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        viewCount: 3,
        authorUserId: author!.id,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/help/articles/${slug}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.article.slug).toBe(slug);
    expect(res.body.article.content).toBe('Full content');
    expect(res.body.article.breadcrumbs).toEqual([
      { slug: parent.slug, title: 'Parent' },
      { slug: child.slug, title: 'Child' },
    ]);
    expect(res.body.viewCount).toBe(4);

    const prisma2 = new PrismaClient();
    const updated = await prisma2.helpArticle.findUnique({
      where: { id: article.id },
    });
    await prisma2.$disconnect();
    expect(updated?.viewCount).toBe(4);
  });

  it('returns 404 for archived article', async () => {
    const prisma = new PrismaClient();
    const suffix = Date.now();
    const author = await prisma.user.findFirst();
    const slug = `archived-only-${suffix}`;

    await prisma.helpArticle.create({
      data: {
        slug,
        titleTranslations: { ru: 'Archived' },
        contentTranslations: { ru: 'Hidden' },
        status: HelpArticleStatus.ARCHIVED,
        publishedAt: new Date(),
        authorUserId: author!.id,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/help/articles/${slug}`,
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 for draft article', async () => {
    const prisma = new PrismaClient();
    const suffix = Date.now();
    const author = await prisma.user.findFirst();
    const slug = `draft-only-${suffix}`;

    await prisma.helpArticle.create({
      data: {
        slug,
        titleTranslations: { ru: 'Draft' },
        contentTranslations: { ru: 'Hidden' },
        status: HelpArticleStatus.DRAFT,
        authorUserId: author!.id,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer()).get(
      `/api/v1/help/articles/${slug}`,
    );

    expect(res.status).toBe(404);
    expect(res.body.message?.error ?? res.body.error).toBe('HELP_ARTICLE_NOT_FOUND');
  });

  it('returns 404 for unknown category slug', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/help/categories/does-not-exist-404',
    );
    expect(res.status).toBe(404);
    expect(res.body.message?.error ?? res.body.error).toBe('HELP_CATEGORY_NOT_FOUND');
  });
});
