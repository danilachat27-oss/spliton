import { HttpStatus, Injectable } from '@nestjs/common';
import {
  NewsPostAudience,
  NewsPostCategory,
  NewsPostStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { throwAdminError } from '../common/admin-http.util';
import {
  MediaStorageService,
  type UploadedFilePayload,
} from '../common/media-storage.service';
import { NotificationEventsService } from '../../notifications/notification-events.service';
import { buildPaginated } from '../common/types/paginated-response.type';

const STATUS_API: Record<NewsPostStatus, string> = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

const API_STATUS: Record<string, NewsPostStatus> = {
  draft: NewsPostStatus.DRAFT,
  scheduled: NewsPostStatus.SCHEDULED,
  published: NewsPostStatus.PUBLISHED,
  archived: NewsPostStatus.ARCHIVED,
};

const CATEGORY_API: Record<NewsPostCategory, string> = {
  PLATFORM: 'platform',
  UPDATES: 'updates',
  FINANCE: 'finance',
  RELEASES: 'releases',
  MARKET: 'market',
  MAINTENANCE: 'maintenance',
  WARNING: 'warning',
};

const API_CATEGORY: Record<string, NewsPostCategory> = Object.fromEntries(
  Object.entries(CATEGORY_API).map(([k, v]) => [v, k as NewsPostCategory]),
);

@Injectable()
export class AdminNewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly notificationEvents: NotificationEventsService,
    private readonly mediaStorage: MediaStorageService,
  ) {}

  private assertView(roles: string[]) {
    const ok = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'NEWS_MANAGER', 'CONTENT_MANAGER'].includes(r),
    );
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertManage(roles: string[]) {
    const ok = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'NEWS_MANAGER'].includes(r),
    );
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private map(row: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string | null;
    content: string;
    coverUrl: string | null;
    category: NewsPostCategory;
    status: NewsPostStatus;
    publishAt: Date | null;
    pinned: boolean;
    showOnHomepage: boolean;
    showInDashboard: boolean;
    audience: NewsPostAudience;
    updatedAt: Date;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      shortDescription: row.shortDescription,
      content: row.content,
      coverUrl: row.coverUrl,
      category: CATEGORY_API[row.category],
      status: STATUS_API[row.status],
      publishAt: row.publishAt?.toISOString() ?? null,
      pinned: row.pinned,
      showOnHomepage: row.showOnHomepage,
      showInDashboard: row.showInDashboard,
      audience: row.audience.toLowerCase(),
      updatedAt: row.updatedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(roles: string[], page = 1, pageSize = 20, status?: string) {
    this.assertView(roles);
    const where: Prisma.NewsPostWhereInput = {};
    if (status && API_STATUS[status]) where.status = API_STATUS[status];
    const skip = (page - 1) * pageSize;
    const [total, rows] = await Promise.all([
      this.prisma.newsPost.count({ where }),
      this.prisma.newsPost.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);
    return buildPaginated(
      rows.map((r) => this.map(r)),
      total,
      page,
      pageSize,
    );
  }

  async getById(roles: string[], id: string) {
    this.assertView(roles);
    const row = await this.prisma.newsPost.findUnique({ where: { id } });
    if (!row) {
      throwAdminError(
        'NEWS_NOT_FOUND',
        'News post not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.map(row);
  }

  async create(
    actorId: string,
    roles: string[],
    data: {
      title: string;
      slug: string;
      shortDescription?: string;
      content: string;
      coverUrl?: string;
      category: string;
      audience?: string;
      pinned?: boolean;
      showOnHomepage?: boolean;
      showInDashboard?: boolean;
      publishAt?: string;
    },
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertManage(roles);
    const row = await this.prisma.newsPost.create({
      data: {
        title: data.title.trim(),
        slug: data.slug.trim().toLowerCase(),
        shortDescription: data.shortDescription?.trim(),
        content: data.content,
        coverUrl: data.coverUrl,
        category: API_CATEGORY[data.category] ?? NewsPostCategory.PLATFORM,
        audience:
          (data.audience?.toUpperCase() as NewsPostAudience) ??
          NewsPostAudience.ALL,
        pinned: data.pinned ?? false,
        showOnHomepage: data.showOnHomepage ?? false,
        showInDashboard: data.showInDashboard ?? true,
        publishAt: data.publishAt ? new Date(data.publishAt) : undefined,
        authorUserId: actorId,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'news_post',
      entityId: row.id,
      action: 'news.create',
      after: { slug: row.slug },
      ...meta,
    });
    return this.map(row);
  }

  async patch(
    actorId: string,
    roles: string[],
    id: string,
    data: Partial<{
      title: string;
      slug: string;
      shortDescription: string;
      content: string;
      coverUrl: string;
      category: string;
      status: string;
      publishAt: string;
      pinned: boolean;
      showOnHomepage: boolean;
      showInDashboard: boolean;
      audience: string;
    }>,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertManage(roles);
    const patch: Prisma.NewsPostUpdateInput = {};
    if (data.title) patch.title = data.title.trim();
    if (data.slug) patch.slug = data.slug.trim().toLowerCase();
    if (data.shortDescription !== undefined)
      patch.shortDescription = data.shortDescription;
    if (data.content) patch.content = data.content;
    if (data.coverUrl !== undefined) patch.coverUrl = data.coverUrl;
    if (data.category && API_CATEGORY[data.category])
      patch.category = API_CATEGORY[data.category];
    if (data.status && API_STATUS[data.status])
      patch.status = API_STATUS[data.status];
    if (data.publishAt) patch.publishAt = new Date(data.publishAt);
    if (data.pinned !== undefined) patch.pinned = data.pinned;
    if (data.showOnHomepage !== undefined)
      patch.showOnHomepage = data.showOnHomepage;
    if (data.showInDashboard !== undefined)
      patch.showInDashboard = data.showInDashboard;
    if (data.audience) {
      patch.audience =
        (data.audience.toUpperCase() as NewsPostAudience) ??
        NewsPostAudience.ALL;
    }

    const row = await this.prisma.newsPost.update({
      where: { id },
      data: patch,
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'news_post',
      entityId: id,
      action: 'news.update',
      after: data,
      ...meta,
    });
    return this.map(row);
  }

  async uploadCover(
    actorId: string,
    roles: string[],
    id: string,
    file: UploadedFilePayload,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertManage(roles);
    const existing = await this.prisma.newsPost.findUnique({ where: { id } });
    if (!existing) {
      throwAdminError(
        'NEWS_NOT_FOUND',
        'News post not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const uploaded = await this.mediaStorage.uploadNewsCover(id, file);
    const row = await this.prisma.newsPost.update({
      where: { id },
      data: { coverUrl: uploaded.coverUrl },
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'news_post',
      entityId: id,
      action: 'news.cover_update',
      before: { coverUrl: existing.coverUrl },
      after: { coverUrl: uploaded.coverUrl, storagePath: uploaded.storagePath },
      ...meta,
    });

    return this.map(row);
  }

  async publish(
    actorId: string,
    roles: string[],
    id: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertManage(roles);
    const row = await this.prisma.newsPost.update({
      where: { id },
      data: {
        status: NewsPostStatus.PUBLISHED,
        publishAt: new Date(),
        publishedByUserId: actorId,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'news_post',
      entityId: id,
      action: 'news.publish',
      ...meta,
    });
    void this.notificationEvents.newsPublishedImportant({
      postId: row.id,
      title: row.title,
      slug: row.slug,
    });
    return this.map(row);
  }

  async unpublish(
    actorId: string,
    roles: string[],
    id: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertManage(roles);
    const row = await this.prisma.newsPost.update({
      where: { id },
      data: { status: NewsPostStatus.DRAFT },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'news_post',
      entityId: id,
      action: 'news.unpublish',
      ...meta,
    });
    return this.map(row);
  }

  async archive(
    actorId: string,
    roles: string[],
    id: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertManage(roles);
    const row = await this.prisma.newsPost.update({
      where: { id },
      data: { status: NewsPostStatus.ARCHIVED },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'news_post',
      entityId: id,
      action: 'news.archive',
      ...meta,
    });
    return this.map(row);
  }
}
