import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  NotificationAudienceType,
  NotificationDeliveryChannel,
  NotificationDeliveryStatus,
  NotificationSeverity,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { resolvePagination } from '../../common/pagination/pagination.util';
import { throwAdminError } from '../admin/common/admin-http.util';
import { EmailService } from '../email/email.service';

export type CreateNotificationInput = {
  audience: NotificationAudienceType;
  recipientUserId?: string;
  recipientRoleCode?: string;
  type: string;
  category: string;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  actionUrl?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  sendEmail?: boolean;
};

const DEDUP_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async notifyUser(
    userId: string,
    input: Omit<CreateNotificationInput, 'audience' | 'recipientUserId'>,
  ) {
    return this.create({
      ...input,
      audience: NotificationAudienceType.USER,
      recipientUserId: userId,
    });
  }

  async notifyAdminRoles(
    roleCodes: string[],
    input: Omit<
      CreateNotificationInput,
      'audience' | 'recipientRoleCode' | 'recipientUserId'
    >,
  ) {
    const results = [];
    for (const role of roleCodes) {
      results.push(
        await this.create({
          ...input,
          audience: NotificationAudienceType.ROLE,
          recipientRoleCode: role,
        }),
      );
    }
    return results;
  }

  async create(input: CreateNotificationInput) {
    if (input.idempotencyKey) {
      const existing = await this.prisma.notificationEventDedup.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing && existing.expiresAt.getTime() > Date.now()) {
        if (existing.notificationId) {
          const row = await this.prisma.inAppNotification.findUnique({
            where: { id: existing.notificationId },
          });
          if (row) return this.mapRow(row);
        }
        return null;
      }
    }

    if (
      input.audience === NotificationAudienceType.USER &&
      !input.recipientUserId
    ) {
      throw new Error('recipientUserId required for USER audience');
    }

    const muted = input.recipientUserId
      ? await this.isCategoryMuted(input.recipientUserId, input.category, 'inApp')
      : false;

    try {
      const notification = await this.prisma.inAppNotification.create({
        data: {
          recipientUserId: input.recipientUserId ?? null,
          recipientRoleCode: input.recipientRoleCode ?? null,
          audience: input.audience,
          type: input.type,
          category: input.category,
          severity: input.severity ?? NotificationSeverity.INFO,
          title: input.title,
          message: input.message,
          actionUrl: input.actionUrl ?? null,
          relatedEntityType: input.relatedEntityType ?? null,
          relatedEntityId: input.relatedEntityId ?? null,
          priority: input.priority ?? 0,
          metadata: input.metadata as Prisma.InputJsonValue | undefined,
          idempotencyKey: input.idempotencyKey ?? null,
          deliveries: muted
            ? undefined
            : {
                create: {
                  channel: NotificationDeliveryChannel.IN_APP,
                  status: NotificationDeliveryStatus.SENT,
                  sentAt: new Date(),
                },
              },
        },
      });

      if (input.idempotencyKey) {
        await this.prisma.notificationEventDedup.upsert({
          where: { idempotencyKey: input.idempotencyKey },
          create: {
            idempotencyKey: input.idempotencyKey,
            notificationId: notification.id,
            expiresAt: new Date(Date.now() + DEDUP_TTL_MS),
          },
          update: {
            notificationId: notification.id,
            expiresAt: new Date(Date.now() + DEDUP_TTL_MS),
          },
        });
      }

      if (input.sendEmail && input.recipientUserId && !muted) {
        void this.queueEmailForUser(input.recipientUserId, notification);
      }

      return this.mapRow(notification);
    } catch (err) {
      this.logger.warn(
        `Notification create failed (${input.type}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return null;
    }
  }

  private async queueEmailForUser(
    userId: string,
    notification: {
      id: string;
      title: string;
      message: string;
      category: string;
    },
  ) {
    const prefs = await this.getOrCreatePreferences(userId);
    if (!this.emailAllowedForCategory(prefs, notification.category)) {
      await this.prisma.notificationDelivery.create({
        data: {
          notificationId: notification.id,
          channel: NotificationDeliveryChannel.EMAIL,
          status: NotificationDeliveryStatus.SKIPPED,
          sentAt: new Date(),
        },
      });
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user?.email) return;

    const delivery = await this.prisma.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channel: NotificationDeliveryChannel.EMAIL,
        status: NotificationDeliveryStatus.PENDING,
      },
    });

    try {
      await this.email.sendNotificationEmail({
        to: user.email,
        userId,
        subject: notification.title,
        textBody: notification.message,
      });
      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: NotificationDeliveryStatus.SENT,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Email delivery failed: ${msg}`);
      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: NotificationDeliveryStatus.FAILED,
          error: msg.slice(0, 500),
        },
      });
    }
  }

  private audienceWhereForUser(userId: string, roles: string[]) {
    return {
      dismissedAt: null,
      OR: [
        { audience: NotificationAudienceType.USER, recipientUserId: userId },
        {
          audience: NotificationAudienceType.ROLE,
          recipientRoleCode: { in: roles.length ? roles : ['__none__'] },
        },
        { audience: NotificationAudienceType.ADMIN, recipientUserId: userId },
      ],
    };
  }

  private staffRolesWhere(roles: string[]) {
    const staff = roles.filter((r) =>
      [
        'SUPER_ADMIN',
        'ADMIN',
        'ACCOUNTANT',
        'COMPLIANCE',
        'SUPPORT_MANAGER',
        'SUPPORT',
        'NEWS_MANAGER',
        'CONTENT_MANAGER',
        'BUSINESS_ANALYST',
      ].includes(r),
    );
    return {
      dismissedAt: null,
      OR: [
        {
          audience: NotificationAudienceType.ROLE,
          recipientRoleCode: { in: staff.length ? staff : ['__none__'] },
        },
        {
          audience: NotificationAudienceType.ADMIN,
        },
      ],
    };
  }

  async listForAdmin(
    staffRoles: string[],
    adminUserId: string,
    page = 1,
    pageSize = 20,
    filters?: {
      category?: string;
      unreadOnly?: boolean;
      severity?: string;
    },
  ) {
    const { skip, page: p, pageSize: ps } = resolvePagination(page, pageSize);
    const where: Prisma.InAppNotificationWhereInput = {
      ...this.staffRolesWhere(staffRoles),
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.unreadOnly ? { readAt: null } : {}),
      ...(filters?.severity
        ? {
            severity: filters.severity.toUpperCase() as NotificationSeverity,
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.inAppNotification.count({ where }),
      this.prisma.inAppNotification.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: ps,
      }),
    ]);
    void adminUserId;
    return {
      items: rows.map((r) => this.mapRow(r)),
      total,
      page: p,
      pageSize: ps,
      hasMore: skip + rows.length < total,
    };
  }

  async unreadCountForAdmin(staffRoles: string[]) {
    const count = await this.prisma.inAppNotification.count({
      where: { ...this.staffRolesWhere(staffRoles), readAt: null },
    });
    return { count };
  }

  async listForUser(
    userId: string,
    roles: string[],
    page = 1,
    pageSize = 20,
    filters?: { category?: string; unreadOnly?: boolean },
  ) {
    const { skip, page: p, pageSize: ps } = resolvePagination(page, pageSize);
    const where: Prisma.InAppNotificationWhereInput = {
      ...this.audienceWhereForUser(userId, roles),
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.unreadOnly ? { readAt: null } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.inAppNotification.count({ where }),
      this.prisma.inAppNotification.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: ps,
      }),
    ]);
    return {
      items: rows.map((r) => this.mapRow(r)),
      total,
      page: p,
      pageSize: ps,
      hasMore: skip + rows.length < total,
    };
  }

  async unreadCountForUser(userId: string, roles: string[]) {
    const count = await this.prisma.inAppNotification.count({
      where: {
        ...this.audienceWhereForUser(userId, roles),
        readAt: null,
      },
    });
    return { count };
  }

  async markRead(userId: string, roles: string[], notificationId: string) {
    await this.assertAccess(userId, roles, notificationId);
    const row = await this.prisma.inAppNotification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
    return this.mapRow(row);
  }

  async markAllRead(userId: string, roles: string[]) {
    const result = await this.prisma.inAppNotification.updateMany({
      where: {
        ...this.audienceWhereForUser(userId, roles),
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  async dismiss(userId: string, roles: string[], notificationId: string) {
    await this.assertAccess(userId, roles, notificationId);
    const row = await this.prisma.inAppNotification.update({
      where: { id: notificationId },
      data: { dismissedAt: new Date(), readAt: new Date() },
    });
    return this.mapRow(row);
  }

  private async assertAccess(
    userId: string,
    roles: string[],
    notificationId: string,
  ) {
    const row = await this.prisma.inAppNotification.findFirst({
      where: { id: notificationId, ...this.audienceWhereForUser(userId, roles) },
    });
    if (!row) {
      throwAdminError(
        'NOTIFICATION_NOT_FOUND',
        'Notification not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async getOrCreatePreferences(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updatePreferences(
    userId: string,
    patch: Partial<{
      emailFinance: boolean;
      emailSecurity: boolean;
      emailMarket: boolean;
      emailSupport: boolean;
      emailNews: boolean;
      inAppFinance: boolean;
      inAppMarket: boolean;
      inAppSupport: boolean;
      inAppNews: boolean;
    }>,
  ) {
    if (patch.emailSecurity === false) {
      throwAdminError(
        'SECURITY_EMAIL_REQUIRED',
        'Security email notifications cannot be disabled',
        HttpStatus.BAD_REQUEST,
      );
    }
    const row = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...patch },
      update: patch,
    });
    return row;
  }

  private async isCategoryMuted(
    userId: string,
    category: string,
    channel: 'inApp' | 'email',
  ) {
    const prefs = await this.getOrCreatePreferences(userId);
    const muted = (prefs.mutedCategories as string[] | null) ?? [];
    if (muted.includes(category)) return true;
    if (channel === 'inApp') {
      if (category === 'finance' && !prefs.inAppFinance) return true;
      if (category === 'market' && !prefs.inAppMarket) return true;
      if (category === 'support' && !prefs.inAppSupport) return true;
      if (category === 'news' && !prefs.inAppNews) return true;
    }
    return false;
  }

  private emailAllowedForCategory(
    prefs: {
      emailFinance: boolean;
      emailSecurity: boolean;
      emailMarket: boolean;
      emailSupport: boolean;
      emailNews: boolean;
    },
    category: string,
  ) {
    if (category === 'security') return prefs.emailSecurity;
    if (category === 'finance') return prefs.emailFinance;
    if (category === 'market') return prefs.emailMarket;
    if (category === 'support') return prefs.emailSupport;
    if (category === 'news') return prefs.emailNews;
    return false;
  }

  private mapRow(row: {
    id: string;
    type: string;
    category: string;
    severity: NotificationSeverity;
    title: string;
    message: string;
    actionUrl: string | null;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
    readAt: Date | null;
    dismissedAt: Date | null;
    createdAt: Date;
    priority: number;
  }) {
    return {
      id: row.id,
      type: row.type,
      category: row.category,
      severity: row.severity.toLowerCase(),
      title: row.title,
      message: row.message,
      actionUrl: row.actionUrl,
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      isRead: Boolean(row.readAt),
      isDismissed: Boolean(row.dismissedAt),
      createdAt: row.createdAt.toISOString(),
      priority: row.priority,
    };
  }
}
