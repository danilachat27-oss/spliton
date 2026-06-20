import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Prisma,
  SystemAnnouncementAudience,
  SystemAnnouncementSeverity,
  SystemAnnouncementStatus,
  SystemAnnouncementType,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { throwAdminError } from '../common/admin-http.util';
import { assertMatrixSection } from '../common/admin-role-matrix';
import { CacheInvalidationService } from '../../../common/platform/cache/cache-invalidation.service';
import {
  isSafeAnnouncementActionUrl,
  localizedAnnouncementFields,
  parseTranslations,
  resolveAnnouncementLocale,
  type AnnouncementTranslations,
} from '../../announcements/system-announcements.util';
import { buildPaginated } from '../common/types/paginated-response.type';

const TYPE_API: Record<SystemAnnouncementType, string> = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  MAINTENANCE: 'maintenance',
  INCIDENT: 'incident',
  FEATURE: 'feature',
  RELEASE: 'release',
};

const API_TYPE = Object.fromEntries(
  Object.entries(TYPE_API).map(([k, v]) => [v, k]),
) as Record<string, SystemAnnouncementType>;

const STATUS_API: Record<SystemAnnouncementStatus, string> = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  ARCHIVED: 'archived',
};

const API_STATUS = Object.fromEntries(
  Object.entries(STATUS_API).map(([k, v]) => [v, k]),
) as Record<string, SystemAnnouncementStatus>;

const AUDIENCE_API: Record<SystemAnnouncementAudience, string> = {
  ALL: 'all',
  USERS: 'users',
  ADMINS: 'admins',
  ROLE: 'role',
  GUESTS: 'guests',
};

const API_AUDIENCE = Object.fromEntries(
  Object.entries(AUDIENCE_API).map(([k, v]) => [v, k]),
) as Record<string, SystemAnnouncementAudience>;

const SEVERITY_API: Record<SystemAnnouncementSeverity, string> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const API_SEVERITY = Object.fromEntries(
  Object.entries(SEVERITY_API).map(([k, v]) => [v, k]),
) as Record<string, SystemAnnouncementSeverity>;

type AnnouncementRow = Prisma.SystemAnnouncementGetPayload<object>;

@Injectable()
export class AdminSystemAnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  private assertView(roles: string[]) {
    assertMatrixSection(roles, 'systemStatus', 'view');
  }

  private assertDraft(roles: string[]) {
    const canDraft = roles.some((r) =>
      [
        'SUPER_ADMIN',
        'ADMIN',
        'NEWS_MANAGER',
        'CONTENT_MANAGER',
        'COMPLIANCE',
        'ACCOUNTANT',
        'SUPPORT_MANAGER',
      ].includes(r),
    );
    if (!canDraft) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertPublish(roles: string[], severity: SystemAnnouncementSeverity) {
    if (severity === 'CRITICAL') {
      const ok = roles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r));
      if (!ok) {
        throwAdminError(
          'ADMIN_FORBIDDEN',
          'Critical notices require SUPER_ADMIN',
          HttpStatus.FORBIDDEN,
        );
      }
      return;
    }
    const ok = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'NEWS_MANAGER'].includes(r),
    );
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions to publish',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private mapRow(row: AnnouncementRow) {
    return {
      id: row.id,
      type: TYPE_API[row.type],
      audience: AUDIENCE_API[row.audience],
      targetRoles: row.targetRoles,
      title: row.title,
      message: row.message,
      shortMessage: row.shortMessage,
      severity: SEVERITY_API[row.severity],
      status: STATUS_API[row.status],
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
      actionLabel: row.actionLabel,
      actionUrl: row.actionUrl,
      dismissible: row.dismissible,
      sticky: row.sticky,
      showOnPublic: row.showOnPublic,
      showInApp: row.showInApp,
      showInAdmin: row.showInAdmin,
      translations: parseTranslations(row.translations),
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(
    roles: string[],
    query: { page?: number; limit?: number; status?: string },
  ) {
    this.assertView(roles);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const where: Prisma.SystemAnnouncementWhereInput = {};
    if (query.status && API_STATUS[query.status]) {
      where.status = API_STATUS[query.status];
    }
    const [total, rows] = await Promise.all([
      this.prisma.systemAnnouncement.count({ where }),
      this.prisma.systemAnnouncement.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return buildPaginated(rows.map((row) => this.mapRow(row)), total, page, limit);
  }

  async create(
    actorId: string,
    roles: string[],
    body: Record<string, unknown>,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertDraft(roles);
    const data = this.parseWriteBody(body);
    const actionUrl = this.extractActionUrl(data.actionUrl);
    if (!isSafeAnnouncementActionUrl(actionUrl)) {
      throwAdminError('VALIDATION_ERROR', 'Unsafe action URL', HttpStatus.BAD_REQUEST);
    }
    if (!data.title || !data.message) {
      throwAdminError('VALIDATION_ERROR', 'Title and message are required', HttpStatus.BAD_REQUEST);
    }
    const title = String(data.title);
    const message = String(data.message);
    const row = await this.prisma.systemAnnouncement.create({
      data: {
        type: data.type as SystemAnnouncementType,
        audience: data.audience as SystemAnnouncementAudience,
        severity: data.severity as SystemAnnouncementSeverity,
        targetRoles: data.targetRoles as string[] | undefined,
        title,
        message,
        shortMessage: data.shortMessage as string | null | undefined,
        startsAt: data.startsAt as Date | null | undefined,
        endsAt: data.endsAt as Date | null | undefined,
        actionLabel: data.actionLabel as string | null | undefined,
        actionUrl,
        dismissible: data.dismissible as boolean | undefined,
        sticky: data.sticky as boolean | undefined,
        showOnPublic: data.showOnPublic as boolean | undefined,
        showInApp: data.showInApp as boolean | undefined,
        showInAdmin: data.showInAdmin as boolean | undefined,
        translations: data.translations as Prisma.InputJsonValue | undefined,
        createdByUserId: actorId,
        updatedByUserId: actorId,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'system_announcement',
      entityId: row.id,
      action: 'announcement.created',
      after: { title: row.title, status: row.status },
      ...meta,
    });
    return this.mapRow(row);
  }

  async update(
    actorId: string,
    roles: string[],
    id: string,
    body: Record<string, unknown>,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertDraft(roles);
    const existing = await this.prisma.systemAnnouncement.findUnique({ where: { id } });
    if (!existing) {
      throwAdminError('NOT_FOUND', 'Announcement not found', HttpStatus.NOT_FOUND);
    }
    const data = this.parseWriteBody(body, existing!);
    const actionUrl = this.extractActionUrl(data.actionUrl);
    if (!isSafeAnnouncementActionUrl(actionUrl)) {
      throwAdminError('VALIDATION_ERROR', 'Unsafe action URL', HttpStatus.BAD_REQUEST);
    }
    const row = await this.prisma.systemAnnouncement.update({
      where: { id },
      data: {
        type: data.type,
        audience: data.audience,
        severity: data.severity,
        targetRoles: data.targetRoles as string[] | undefined,
        title: data.title,
        message: data.message,
        shortMessage: data.shortMessage as string | null | undefined,
        startsAt: data.startsAt as Date | null | undefined,
        endsAt: data.endsAt as Date | null | undefined,
        actionLabel: data.actionLabel as string | null | undefined,
        actionUrl,
        dismissible: data.dismissible as boolean | undefined,
        sticky: data.sticky as boolean | undefined,
        showOnPublic: data.showOnPublic as boolean | undefined,
        showInApp: data.showInApp as boolean | undefined,
        showInAdmin: data.showInAdmin as boolean | undefined,
        translations: data.translations as Prisma.InputJsonValue | undefined,
        updatedByUserId: actorId,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'system_announcement',
      entityId: row.id,
      action: 'announcement.updated',
      before: { status: existing!.status },
      after: { status: row.status },
      ...meta,
    });
    this.cacheInvalidation.onSystemStatusChange();
    return this.mapRow(row);
  }

  async publish(
    actorId: string,
    roles: string[],
    id: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    const existing = await this.prisma.systemAnnouncement.findUnique({ where: { id } });
    if (!existing) {
      throwAdminError('NOT_FOUND', 'Announcement not found', HttpStatus.NOT_FOUND);
    }
    this.assertPublish(roles, existing!.severity);
    const now = new Date();
    const status =
      existing!.startsAt && existing!.startsAt > now
        ? SystemAnnouncementStatus.SCHEDULED
        : SystemAnnouncementStatus.ACTIVE;
    const row = await this.prisma.systemAnnouncement.update({
      where: { id },
      data: {
        status,
        publishedAt: now,
        publishedByUserId: actorId,
        updatedByUserId: actorId,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'system_announcement',
      entityId: row.id,
      action: status === 'SCHEDULED' ? 'announcement.scheduled' : 'announcement.published',
      after: { status: row.status, severity: row.severity },
      ...meta,
    });
    this.cacheInvalidation.onSystemStatusChange();
    return this.mapRow(row);
  }

  async archive(
    actorId: string,
    roles: string[],
    id: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    assertMatrixSection(roles, 'systemStatus', 'mutate');
    const existing = await this.prisma.systemAnnouncement.findUnique({ where: { id } });
    if (!existing) {
      throwAdminError('NOT_FOUND', 'Announcement not found', HttpStatus.NOT_FOUND);
    }
    const row = await this.prisma.systemAnnouncement.update({
      where: { id },
      data: {
        status: SystemAnnouncementStatus.ARCHIVED,
        updatedByUserId: actorId,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'system_announcement',
      entityId: row.id,
      action: 'announcement.archived',
      ...meta,
    });
    this.cacheInvalidation.onSystemStatusChange();
    return this.mapRow(row);
  }

  async preview(id: string, roles: string[], locale?: string) {
    this.assertView(roles);
    const row = await this.prisma.systemAnnouncement.findUnique({ where: { id } });
    if (!row) {
      throwAdminError('NOT_FOUND', 'Announcement not found', HttpStatus.NOT_FOUND);
    }
    const resolved = resolveAnnouncementLocale(locale);
    const localized = localizedAnnouncementFields(row!, resolved);
    return {
      locale: resolved,
      preview: {
        ...this.mapRow(row!),
        ...localized,
      },
    };
  }

  private extractActionUrl(
    value: Prisma.SystemAnnouncementUpdateInput['actionUrl'],
  ): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === 'string') return value;
    return undefined;
  }

  private parseWriteBody(
    body: Record<string, unknown>,
    existing?: AnnouncementRow,
  ): Prisma.SystemAnnouncementUpdateInput {
    const type =
      typeof body.type === 'string' && API_TYPE[body.type]
        ? API_TYPE[body.type]
        : existing?.type ?? SystemAnnouncementType.INFO;
    const audience =
      typeof body.audience === 'string' && API_AUDIENCE[body.audience]
        ? API_AUDIENCE[body.audience]
        : existing?.audience ?? SystemAnnouncementAudience.ALL;
    const severity =
      typeof body.severity === 'string' && API_SEVERITY[body.severity]
        ? API_SEVERITY[body.severity]
        : existing?.severity ?? SystemAnnouncementSeverity.MEDIUM;

    return {
      type,
      audience,
      severity,
      targetRoles: Array.isArray(body.targetRoles)
        ? body.targetRoles.filter((r): r is string => typeof r === 'string')
        : existing?.targetRoles ?? [],
      title: typeof body.title === 'string' ? body.title.trim() : existing?.title,
      message: typeof body.message === 'string' ? body.message : existing?.message,
      shortMessage:
        typeof body.shortMessage === 'string'
          ? body.shortMessage
          : body.shortMessage === null
            ? null
            : existing?.shortMessage,
      startsAt:
        typeof body.startsAt === 'string'
          ? new Date(body.startsAt)
          : body.startsAt === null
            ? null
            : existing?.startsAt,
      endsAt:
        typeof body.endsAt === 'string'
          ? new Date(body.endsAt)
          : body.endsAt === null
            ? null
            : existing?.endsAt,
      actionLabel:
        typeof body.actionLabel === 'string'
          ? body.actionLabel
          : body.actionLabel === null
            ? null
            : existing?.actionLabel,
      actionUrl:
        typeof body.actionUrl === 'string'
          ? body.actionUrl
          : body.actionUrl === null
            ? null
            : existing?.actionUrl,
      dismissible:
        typeof body.dismissible === 'boolean'
          ? body.dismissible
          : existing?.dismissible ?? true,
      sticky:
        typeof body.sticky === 'boolean' ? body.sticky : existing?.sticky ?? false,
      showOnPublic:
        typeof body.showOnPublic === 'boolean'
          ? body.showOnPublic
          : existing?.showOnPublic ?? true,
      showInApp:
        typeof body.showInApp === 'boolean'
          ? body.showInApp
          : existing?.showInApp ?? true,
      showInAdmin:
        typeof body.showInAdmin === 'boolean'
          ? body.showInAdmin
          : existing?.showInAdmin ?? false,
      translations:
        body.translations && typeof body.translations === 'object'
          ? (body.translations as AnnouncementTranslations)
          : existing?.translations ?? {},
    };
  }
}
