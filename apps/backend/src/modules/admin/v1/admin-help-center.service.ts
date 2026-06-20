import { HttpStatus, Injectable } from '@nestjs/common';
import {
  HelpArticle,
  HelpArticleStatus,
  HelpCategory,
  Prisma,
} from '@prisma/client';

import { TtlCacheService } from '../../../common/cache/ttl-cache.service';
import { resolvePagination } from '../../../common/pagination/pagination.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { throwAdminError } from '../common/admin-http.util';
import { buildPaginated } from '../common/types/paginated-response.type';
import {
  assertHelpCenterArticleDelete,
  assertHelpCenterArticleMutate,
  assertHelpCenterArticlePublish,
  assertHelpCenterArticleReorder,
  assertHelpCenterCategoryMutate,
  assertHelpCenterCategoryReorder,
  assertHelpCenterView,
} from './admin-help-center-permissions';
import {
  API_HELP_ARTICLE_STATUS,
  assertPublishableHelpArticle,
  HELP_ARTICLE_STATUS_API,
  mergeTranslations,
  normalizeHelpSlug,
  previewHelpTranslation,
} from './admin-help-center.util';
import type {
  CreateHelpArticleDto,
  CreateHelpCategoryDto,
  ListHelpArticlesAdminQueryDto,
  ReorderHelpArticlesDto,
  ReorderHelpCategoriesDto,
  UpdateHelpArticleDto,
  UpdateHelpCategoryDto,
} from './dto/help-center/admin-help-center.dto';

type AuditMeta = { ip: string | null; userAgent: string | null };

@Injectable()
export class AdminHelpCenterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly cache: TtlCacheService,
  ) {}

  async listCategories(roles: string[]) {
    assertHelpCenterView(roles);
    const rows = await this.prisma.helpCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
    });
    return { items: rows.map((row) => this.mapCategory(row)) };
  }

  async createCategory(
    actorId: string,
    roles: string[],
    body: CreateHelpCategoryDto,
    meta?: AuditMeta,
  ) {
    assertHelpCenterCategoryMutate(roles);
    const slug = normalizeHelpSlug(body.slug);
    if (!slug) {
      throwAdminError(
        'HELP_CATEGORY_SLUG_REQUIRED',
        'Category slug is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (body.parentId) {
      await this.assertCategoryExists(body.parentId);
    }

    try {
      const row = await this.prisma.helpCategory.create({
        data: {
          slug,
          parentId: body.parentId ?? null,
          titleTranslations: mergeTranslations({}, body.titleTranslations),
          descriptionTranslations: mergeTranslations(
            {},
            body.descriptionTranslations,
          ),
          icon: body.icon?.trim() || null,
          sortOrder: body.sortOrder ?? 0,
          isPublished: body.isPublished ?? false,
        },
      });

      await this.logAudit({
        actorId,
        roles,
        entityType: 'help_category',
        entityId: row.id,
        action: 'help.category.created',
        after: this.mapCategory(row),
        meta,
      });
      this.invalidateHelpCache();
      return this.mapCategory(row);
    } catch (error) {
      this.handleUniqueViolation(error, 'HELP_CATEGORY_SLUG_CONFLICT', 'Category slug already exists');
    }
  }

  async updateCategory(
    actorId: string,
    roles: string[],
    id: string,
    body: UpdateHelpCategoryDto,
    meta?: AuditMeta,
  ) {
    assertHelpCenterCategoryMutate(roles);
    const existing = await this.getCategoryOrThrow(id);

    if (body.parentId !== undefined && body.parentId !== null) {
      if (body.parentId === id) {
        throwAdminError(
          'HELP_CATEGORY_PARENT_INVALID',
          'Category cannot be its own parent',
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.assertCategoryExists(body.parentId);
    }

    const data: Prisma.HelpCategoryUpdateInput = {};
    if (body.slug !== undefined) {
      const slug = normalizeHelpSlug(body.slug);
      if (!slug) {
        throwAdminError(
          'HELP_CATEGORY_SLUG_REQUIRED',
          'Category slug is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      data.slug = slug;
    }
    if (body.parentId !== undefined) {
      data.parent = body.parentId
        ? { connect: { id: body.parentId } }
        : { disconnect: true };
    }
    if (body.titleTranslations !== undefined) {
      data.titleTranslations = mergeTranslations(
        existing.titleTranslations,
        body.titleTranslations,
      );
    }
    if (body.descriptionTranslations !== undefined) {
      data.descriptionTranslations = mergeTranslations(
        existing.descriptionTranslations,
        body.descriptionTranslations,
      );
    }
    if (body.icon !== undefined) data.icon = body.icon?.trim() || null;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.isPublished !== undefined) data.isPublished = body.isPublished;

    try {
      const row = await this.prisma.helpCategory.update({
        where: { id },
        data,
      });

      await this.logAudit({
        actorId,
        roles,
        entityType: 'help_category',
        entityId: row.id,
        action: 'help.category.updated',
        before: this.mapCategory(existing),
        after: this.mapCategory(row),
        meta,
      });
      this.invalidateHelpCache();
      return this.mapCategory(row);
    } catch (error) {
      this.handleUniqueViolation(error, 'HELP_CATEGORY_SLUG_CONFLICT', 'Category slug already exists');
    }
  }

  async deleteCategory(
    actorId: string,
    roles: string[],
    id: string,
    meta?: AuditMeta,
  ) {
    assertHelpCenterCategoryMutate(roles);
    const existing = await this.getCategoryOrThrow(id);

    const [articleCount, childCount] = await Promise.all([
      this.prisma.helpArticle.count({ where: { categoryId: id } }),
      this.prisma.helpCategory.count({ where: { parentId: id } }),
    ]);

    if (articleCount > 0) {
      throwAdminError(
        'HELP_CATEGORY_HAS_ARTICLES',
        'Cannot delete category while it contains articles. Move or delete articles first.',
        HttpStatus.CONFLICT,
        { articleCount },
      );
    }

    if (childCount > 0) {
      throwAdminError(
        'HELP_CATEGORY_HAS_CHILDREN',
        'Cannot delete category while it has subcategories. Reassign or delete subcategories first.',
        HttpStatus.CONFLICT,
        { childCount },
      );
    }

    await this.prisma.helpCategory.delete({ where: { id } });
    await this.logAudit({
      actorId,
      roles,
      entityType: 'help_category',
      entityId: id,
      action: 'help.category.deleted',
      before: this.mapCategory(existing),
      meta,
    });
    this.invalidateHelpCache();
    return { ok: true, id };
  }

  async reorderCategories(
    actorId: string,
    roles: string[],
    body: ReorderHelpCategoriesDto,
    meta?: AuditMeta,
  ) {
    assertHelpCenterCategoryReorder(roles);

    await this.prisma.$transaction(
      body.items.map((item) =>
        this.prisma.helpCategory.update({
          where: { id: item.id },
          data: {
            sortOrder: item.sortOrder,
            ...(item.parentId !== undefined ? { parentId: item.parentId } : {}),
          },
        }),
      ),
    );

    await this.logAudit({
      actorId,
      roles,
      entityType: 'help_category',
      entityId: null,
      action: 'help.category.reordered',
      after: { items: body.items },
      meta,
    });
    this.invalidateHelpCache();
    return { ok: true, count: body.items.length };
  }

  async listArticles(roles: string[], query: ListHelpArticlesAdminQueryDto) {
    assertHelpCenterView(roles);
    const { page, pageSize, skip } = resolvePagination(query.page, query.pageSize);
    const where: Prisma.HelpArticleWhereInput = {};

    if (query.status) {
      const mapped = API_HELP_ARTICLE_STATUS[query.status.toLowerCase()];
      if (!mapped) {
        throwAdminError(
          'HELP_ARTICLE_STATUS_INVALID',
          'Invalid article status filter',
          HttpStatus.BAD_REQUEST,
        );
      }
      where.status = mapped;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    const [total, rows] = await Promise.all([
      this.prisma.helpArticle.count({ where }),
      this.prisma.helpArticle.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        include: { category: { select: { id: true, slug: true } } },
      }),
    ]);

    return buildPaginated(
      rows.map((row) => this.mapArticle(row)),
      total,
      page,
      pageSize,
    );
  }

  async createArticle(
    actorId: string,
    roles: string[],
    body: CreateHelpArticleDto,
    meta?: AuditMeta,
  ) {
    assertHelpCenterArticleMutate(roles);
    const slug = normalizeHelpSlug(body.slug);
    if (!slug) {
      throwAdminError(
        'HELP_ARTICLE_SLUG_REQUIRED',
        'Article slug is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.assertCategoryExists(body.categoryId);

    try {
      const row = await this.prisma.helpArticle.create({
        data: {
          slug,
          categoryId: body.categoryId,
          titleTranslations: mergeTranslations({}, body.titleTranslations),
          excerptTranslations: mergeTranslations({}, body.excerptTranslations),
          contentTranslations: mergeTranslations({}, body.contentTranslations),
          status: HelpArticleStatus.DRAFT,
          sortOrder: body.sortOrder ?? 0,
          isFeatured: body.isFeatured ?? false,
          isPopular: body.isPopular ?? false,
          isGettingStarted: body.isGettingStarted ?? false,
          metaTitle: body.metaTitle?.trim() || null,
          metaDescription: body.metaDescription?.trim() || null,
          authorUserId: actorId,
        },
        include: { category: { select: { id: true, slug: true } } },
      });

      await this.logAudit({
        actorId,
        roles,
        entityType: 'help_article',
        entityId: row.id,
        action: 'help.article.created',
        after: this.mapArticle(row),
        meta,
      });
      this.invalidateHelpCache();
      return this.mapArticle(row);
    } catch (error) {
      this.handleUniqueViolation(error, 'HELP_ARTICLE_SLUG_CONFLICT', 'Article slug already exists');
    }
  }

  async updateArticle(
    actorId: string,
    roles: string[],
    id: string,
    body: UpdateHelpArticleDto,
    meta?: AuditMeta,
  ) {
    assertHelpCenterArticleMutate(roles);
    const existing = await this.getArticleOrThrow(id);

    if (body.categoryId) {
      await this.assertCategoryExists(body.categoryId);
    }

    const data: Prisma.HelpArticleUpdateInput = {};
    if (body.slug !== undefined) {
      const slug = normalizeHelpSlug(body.slug);
      if (!slug) {
        throwAdminError(
          'HELP_ARTICLE_SLUG_REQUIRED',
          'Article slug is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      data.slug = slug;
    }
    if (body.categoryId !== undefined) {
      data.category = { connect: { id: body.categoryId } };
    }
    if (body.titleTranslations !== undefined) {
      data.titleTranslations = mergeTranslations(
        existing.titleTranslations,
        body.titleTranslations,
      );
    }
    if (body.excerptTranslations !== undefined) {
      data.excerptTranslations = mergeTranslations(
        existing.excerptTranslations,
        body.excerptTranslations,
      );
    }
    if (body.contentTranslations !== undefined) {
      data.contentTranslations = mergeTranslations(
        existing.contentTranslations,
        body.contentTranslations,
      );
    }
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured;
    if (body.isPopular !== undefined) data.isPopular = body.isPopular;
    if (body.isGettingStarted !== undefined) {
      data.isGettingStarted = body.isGettingStarted;
    }
    if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle?.trim() || null;
    if (body.metaDescription !== undefined) {
      data.metaDescription = body.metaDescription?.trim() || null;
    }

    try {
      const row = await this.prisma.helpArticle.update({
        where: { id },
        data,
        include: { category: { select: { id: true, slug: true } } },
      });

      await this.logAudit({
        actorId,
        roles,
        entityType: 'help_article',
        entityId: row.id,
        action: 'help.article.updated',
        before: this.mapArticle(existing),
        after: this.mapArticle(row),
        meta,
      });
      this.invalidateHelpCache();
      return this.mapArticle(row);
    } catch (error) {
      this.handleUniqueViolation(error, 'HELP_ARTICLE_SLUG_CONFLICT', 'Article slug already exists');
    }
  }

  async deleteArticle(
    actorId: string,
    roles: string[],
    id: string,
    meta?: AuditMeta,
  ) {
    assertHelpCenterArticleDelete(roles);
    const existing = await this.getArticleOrThrow(id);

    await this.prisma.helpArticle.delete({ where: { id } });
    await this.logAudit({
      actorId,
      roles,
      entityType: 'help_article',
      entityId: id,
      action: 'help.article.deleted',
      before: this.mapArticle(existing),
      meta,
    });
    this.invalidateHelpCache();
    return { ok: true, id };
  }

  async publishArticle(
    actorId: string,
    roles: string[],
    id: string,
    meta?: AuditMeta,
  ) {
    assertHelpCenterArticlePublish(roles);
    const existing = await this.getArticleOrThrow(id);

    try {
      assertPublishableHelpArticle(existing);
    } catch (error) {
      const code =
        error instanceof Error && 'code' in error && typeof error.code === 'string'
          ? error.code
          : 'HELP_ARTICLE_PUBLISH_INVALID';
      throwAdminError(
        code,
        error instanceof Error ? error.message : 'Article cannot be published',
        HttpStatus.BAD_REQUEST,
      );
    }

    const row = await this.prisma.helpArticle.update({
      where: { id },
      data: {
        status: HelpArticleStatus.PUBLISHED,
        publishedAt: existing.publishedAt ?? new Date(),
      },
      include: { category: { select: { id: true, slug: true } } },
    });

    await this.logAudit({
      actorId,
      roles,
      entityType: 'help_article',
      entityId: row.id,
      action: 'help.article.published',
      before: { status: HELP_ARTICLE_STATUS_API[existing.status] },
      after: { status: HELP_ARTICLE_STATUS_API[row.status] },
      meta,
    });
    this.invalidateHelpCache();
    return this.mapArticle(row);
  }

  async archiveArticle(
    actorId: string,
    roles: string[],
    id: string,
    meta?: AuditMeta,
  ) {
    assertHelpCenterArticlePublish(roles);
    const existing = await this.getArticleOrThrow(id);

    const row = await this.prisma.helpArticle.update({
      where: { id },
      data: { status: HelpArticleStatus.ARCHIVED },
      include: { category: { select: { id: true, slug: true } } },
    });

    await this.logAudit({
      actorId,
      roles,
      entityType: 'help_article',
      entityId: row.id,
      action: 'help.article.archived',
      before: { status: HELP_ARTICLE_STATUS_API[existing.status] },
      after: { status: HELP_ARTICLE_STATUS_API[row.status] },
      meta,
    });
    this.invalidateHelpCache();
    return this.mapArticle(row);
  }

  async reorderArticles(
    actorId: string,
    roles: string[],
    body: ReorderHelpArticlesDto,
    meta?: AuditMeta,
  ) {
    assertHelpCenterArticleReorder(roles);

    await this.prisma.$transaction(
      body.items.map((item) =>
        this.prisma.helpArticle.update({
          where: { id: item.id },
          data: {
            sortOrder: item.sortOrder,
            ...(item.categoryId !== undefined ? { categoryId: item.categoryId } : {}),
          },
        }),
      ),
    );

    await this.logAudit({
      actorId,
      roles,
      entityType: 'help_article',
      entityId: null,
      action: 'help.article.reordered',
      after: { items: body.items },
      meta,
    });
    this.invalidateHelpCache();
    return { ok: true, count: body.items.length };
  }

  private mapCategory(row: HelpCategory) {
    return {
      id: row.id,
      slug: row.slug,
      parentId: row.parentId,
      titleTranslations: parseJsonRecord(row.titleTranslations),
      descriptionTranslations: parseJsonRecord(row.descriptionTranslations),
      titlePreview: previewHelpTranslation(row.titleTranslations),
      icon: row.icon,
      sortOrder: row.sortOrder,
      isPublished: row.isPublished,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapArticle(
    row: HelpArticle & { category?: { id: string; slug: string } | null },
  ) {
    return {
      id: row.id,
      slug: row.slug,
      categoryId: row.categoryId,
      categorySlug: row.category?.slug ?? null,
      titleTranslations: parseJsonRecord(row.titleTranslations),
      excerptTranslations: parseJsonRecord(row.excerptTranslations),
      contentTranslations: parseJsonRecord(row.contentTranslations),
      titlePreview: previewHelpTranslation(row.titleTranslations),
      status: HELP_ARTICLE_STATUS_API[row.status],
      sortOrder: row.sortOrder,
      isFeatured: row.isFeatured,
      isPopular: row.isPopular,
      isGettingStarted: row.isGettingStarted,
      viewCount: row.viewCount,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      authorUserId: row.authorUserId,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async getCategoryOrThrow(id: string) {
    const row = await this.prisma.helpCategory.findUnique({ where: { id } });
    if (!row) {
      throwAdminError(
        'HELP_CATEGORY_NOT_FOUND',
        'Help category not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }

  private async getArticleOrThrow(id: string) {
    const row = await this.prisma.helpArticle.findUnique({
      where: { id },
      include: { category: { select: { id: true, slug: true } } },
    });
    if (!row) {
      throwAdminError(
        'HELP_ARTICLE_NOT_FOUND',
        'Help article not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }

  private async assertCategoryExists(id: string) {
    const row = await this.prisma.helpCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!row) {
      throwAdminError(
        'HELP_CATEGORY_NOT_FOUND',
        'Help category not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private invalidateHelpCache() {
    this.cache.invalidatePrefix('help:');
  }

  private async logAudit(params: {
    actorId: string;
    roles: string[];
    entityType: string;
    entityId: string | null;
    action: string;
    before?: unknown;
    after?: unknown;
    meta?: AuditMeta;
  }) {
    await this.audit.logOperatorAction({
      actorUserId: params.actorId,
      actorRoles: params.roles,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      before: params.before as Prisma.InputJsonValue | undefined,
      after: params.after as Prisma.InputJsonValue | undefined,
      ip: params.meta?.ip ?? null,
      userAgent: params.meta?.userAgent ?? null,
    });
  }

  private handleUniqueViolation(
    error: unknown,
    code: string,
    message: string,
  ): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throwAdminError(code, message, HttpStatus.CONFLICT);
    }
    throw error;
  }
}

function parseJsonRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}
