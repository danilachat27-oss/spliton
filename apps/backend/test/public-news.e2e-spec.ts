import request from 'supertest';
import { NewsPostStatus, PrismaClient } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

describe('Public news API (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('lists only published posts', async () => {
    const prisma = new PrismaClient();
    const suffix = Date.now();
    const author = await prisma.user.findFirst();
    expect(author).toBeTruthy();

    await prisma.newsPost.create({
      data: {
        title: `Draft ${suffix}`,
        slug: `draft-${suffix}`,
        content: 'hidden',
        status: NewsPostStatus.DRAFT,
        authorUserId: author!.id,
      },
    });

    const published = await prisma.newsPost.create({
      data: {
        title: `Live ${suffix}`,
        slug: `live-${suffix}`,
        shortDescription: 'Public excerpt',
        content: 'body',
        status: NewsPostStatus.PUBLISHED,
        publishAt: new Date(),
        authorUserId: author!.id,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer()).get('/api/v1/news');
    expect(res.status).toBe(200);
    expect(
      res.body.items.some((i: { slug: string }) => i.slug === published.slug),
    ).toBe(true);
    expect(
      res.body.items.some(
        (i: { slug: string }) => i.slug === `draft-${suffix}`,
      ),
    ).toBe(false);
  });

  it('returns post by slug', async () => {
    const prisma = new PrismaClient();
    const suffix = Date.now();
    const author = await prisma.user.findFirst();
    const slug = `slug-${suffix}`;
    await prisma.newsPost.create({
      data: {
        title: 'By slug',
        slug,
        content: 'full',
        status: NewsPostStatus.PUBLISHED,
        publishAt: new Date(),
        authorUserId: author!.id,
      },
    });
    await prisma.$disconnect();

    const res = await request(app!.getHttpServer()).get(`/api/v1/news/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(slug);
    expect(res.body.content).toBe('full');
  });
});
