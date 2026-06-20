import { Injectable } from '@nestjs/common';
import { NewsPostStatus } from '@prisma/client';
import { CACHE_TTL_MS } from '../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';
import { resolvePagination } from '../../common/pagination/pagination.util';
import { buildPaginated } from '../admin/common/types/paginated-response.type';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicNewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async list(page?: number, pageSize?: number) {
    const { page: p, pageSize: ps, skip } = resolvePagination(page, pageSize);
    const cacheKey = `news:list:${p}:${ps}`;
    return this.cache.getOrSet(cacheKey, CACHE_TTL_MS.publicNewsList, () =>
      this.loadPage(p, ps, skip),
    );
  }

  private async loadPage(page: number, pageSize: number, skip: number) {
    const now = new Date();
    const where = {
      status: NewsPostStatus.PUBLISHED,
      OR: [{ publishAt: null }, { publishAt: { lte: now } }],
    };
    const [total, rows] = await Promise.all([
      this.prisma.newsPost.count({ where }),
      this.prisma.newsPost.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ pinned: 'desc' }, { publishAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          coverUrl: true,
          category: true,
          publishAt: true,
          pinned: true,
        },
      }),
    ]);

    return buildPaginated(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        shortDescription: r.shortDescription,
        coverUrl: r.coverUrl,
        category: r.category.toLowerCase(),
        publishAt: r.publishAt?.toISOString() ?? null,
        pinned: r.pinned,
      })),
      total,
      page,
      pageSize,
    );
  }

  async bySlug(slug: string) {
    const now = new Date();
    const row = await this.prisma.newsPost.findFirst({
      where: {
        slug: slug.toLowerCase(),
        status: NewsPostStatus.PUBLISHED,
        OR: [{ publishAt: null }, { publishAt: { lte: now } }],
      },
    });
    if (!row) return { error: 'NOT_FOUND' };
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      shortDescription: row.shortDescription,
      content: row.content,
      coverUrl: row.coverUrl,
      category: row.category.toLowerCase(),
      publishAt: row.publishAt?.toISOString() ?? null,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
    };
  }
}
