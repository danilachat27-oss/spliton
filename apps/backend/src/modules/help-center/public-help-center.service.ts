import { Injectable } from '@nestjs/common';
import { HelpArticleStatus, Prisma } from '@prisma/client';

import { CACHE_TTL_MS } from '../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ListHelpArticlesQueryDto } from './dto/list-help-articles-query.dto';
import { resolveHelpLocale } from './help-content-locale.util';
import {
  HelpBreadcrumbDto,
  HelpCategoryPublicDto,
  mapHelpArticleDetail,
  mapHelpArticleSummary,
  mapHelpCategory,
} from './mappers/help-center.mapper';

const categorySelect = {
  id: true,
  slug: true,
  parentId: true,
  titleTranslations: true,
  descriptionTranslations: true,
  icon: true,
  sortOrder: true,
  isPublished: true,
} satisfies Prisma.HelpCategorySelect;

type HelpCategoryRow = Prisma.HelpCategoryGetPayload<{
  select: typeof categorySelect;
}>;

const articleSelect = {
  id: true,
  slug: true,
  categoryId: true,
  titleTranslations: true,
  excerptTranslations: true,
  contentTranslations: true,
  status: true,
  sortOrder: true,
  isFeatured: true,
  isPopular: true,
  isGettingStarted: true,
  viewCount: true,
  publishedAt: true,
  metaTitle: true,
  metaDescription: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.HelpArticleSelect;

@Injectable()
export class PublicHelpCenterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async listCategories(localeInput?: string) {
    const locale = resolveHelpLocale(localeInput);
    const cacheKey = `help:categories:${locale}`;

    return this.cache.getOrSet(cacheKey, CACHE_TTL_MS.publicHelpCenter, async () => {
      const rows = await this.prisma.helpCategory.findMany({
        where: { isPublished: true },
        orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
        select: categorySelect,
      });

      const items = rows.map((row) => mapHelpCategory(row, locale));

      return {
        locale,
        items,
        tree: buildCategoryTree(items),
      };
    });
  }

  async getCategoryBySlug(slug: string, localeInput?: string) {
    const locale = resolveHelpLocale(localeInput);
    const normalizedSlug = normalizeSlug(slug);

    const category = await this.prisma.helpCategory.findFirst({
      where: { slug: normalizedSlug, isPublished: true },
      select: categorySelect,
    });

    if (!category) {
      return { error: 'HELP_CATEGORY_NOT_FOUND' as const };
    }

    const articles = await this.prisma.helpArticle.findMany({
      where: {
        categoryId: category.id,
        ...publishedArticleWhere(),
      },
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { slug: 'asc' }],
      select: articleSelect,
    });

    return {
      locale,
      category: mapHelpCategory(category, locale),
      articles: articles.map((row) => mapHelpArticleSummary(row, locale)),
    };
  }

  async listArticles(query: ListHelpArticlesQueryDto) {
    const locale = resolveHelpLocale(query.locale);
    const limit = query.limit ?? 20;

    const where: Prisma.HelpArticleWhereInput = {
      ...publishedArticleWhere(),
    };

    if (query.featured === true) {
      where.isFeatured = true;
    }
    if (query.popular === true) {
      where.isPopular = true;
    }
    if (query.gettingStarted === true) {
      where.isGettingStarted = true;
    }

    if (query.categorySlug?.trim()) {
      const category = await this.prisma.helpCategory.findFirst({
        where: {
          slug: normalizeSlug(query.categorySlug),
          isPublished: true,
        },
        select: { id: true },
      });
      if (!category) {
        return {
          locale,
          items: [],
          total: 0,
          limit,
        };
      }
      where.categoryId = category.id;
    }

    const [total, rows] = await Promise.all([
      this.prisma.helpArticle.count({ where }),
      this.prisma.helpArticle.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { slug: 'asc' }],
        take: limit,
        select: articleSelect,
      }),
    ]);

    return {
      locale,
      items: rows.map((row) => mapHelpArticleSummary(row, locale)),
      total,
      limit,
    };
  }

  async getArticleBySlug(slug: string, localeInput?: string) {
    const locale = resolveHelpLocale(localeInput);
    const normalizedSlug = normalizeSlug(slug);

    const row = await this.prisma.helpArticle.findFirst({
      where: {
        slug: normalizedSlug,
        ...publishedArticleWhere(),
      },
      select: articleSelect,
    });

    if (!row) {
      return { error: 'HELP_ARTICLE_NOT_FOUND' as const };
    }

    await this.prisma.helpArticle.update({
      where: { id: row.id },
      data: { viewCount: { increment: 1 } },
    });

    const categoryDto = row.categoryId
      ? await this.loadCategoryDto(row.categoryId, locale)
      : null;

    const breadcrumbs = row.categoryId
      ? await this.buildBreadcrumbs(row.categoryId, locale)
      : [];

    return {
      locale,
      article: mapHelpArticleDetail(row, locale, {
        category: categoryDto,
        breadcrumbs,
      }),
      viewCount: row.viewCount + 1,
    };
  }

  private async loadCategoryDto(
    categoryId: string,
    locale: ReturnType<typeof resolveHelpLocale>,
  ): Promise<HelpCategoryPublicDto | null> {
    const category = await this.prisma.helpCategory.findFirst({
      where: { id: categoryId, isPublished: true },
      select: categorySelect,
    });
    return category ? mapHelpCategory(category, locale) : null;
  }

  private async buildBreadcrumbs(
    categoryId: string,
    locale: ReturnType<typeof resolveHelpLocale>,
  ): Promise<HelpBreadcrumbDto[]> {
    const breadcrumbs: HelpBreadcrumbDto[] = [];
    const visited = new Set<string>();
    let currentId: string | null = categoryId;

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const row: HelpCategoryRow | null = await this.prisma.helpCategory.findFirst({
        where: { id: currentId, isPublished: true },
        select: categorySelect,
      });
      if (!row) break;

      const mapped = mapHelpCategory(row, locale);
      breadcrumbs.unshift({ slug: mapped.slug, title: mapped.title });
      currentId = row.parentId;
    }

    return breadcrumbs;
  }
}

function publishedArticleWhere(now = new Date()): Prisma.HelpArticleWhereInput {
  return {
    status: HelpArticleStatus.PUBLISHED,
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

function buildCategoryTree(
  items: HelpCategoryPublicDto[],
): HelpCategoryPublicDto[] {
  const byParent = new Map<string | null, HelpCategoryPublicDto[]>();

  for (const item of items) {
    const key = item.parentId;
    const bucket = byParent.get(key) ?? [];
    bucket.push(item);
    byParent.set(key, bucket);
  }

  const roots = byParent.get(null) ?? [];

  const attachChildren = (
    node: HelpCategoryPublicDto & { children?: HelpCategoryPublicDto[] },
  ) => {
    const children = byParent.get(node.id) ?? [];
    if (children.length > 0) {
      node.children = children.map((child) => {
        const enriched = { ...child } as HelpCategoryPublicDto & {
          children?: HelpCategoryPublicDto[];
        };
        attachChildren(enriched);
        return enriched;
      });
    }
    return node;
  };

  return roots.map((root) => attachChildren({ ...root }));
}
