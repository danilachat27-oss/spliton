import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';
import { CACHE_TTL_MS } from '../../common/cache/cache-ttl.constants';
import { PrismaService } from '../../prisma/prisma.service';
import {
  isAnnouncementActiveNow,
  localizedAnnouncementFields,
  matchesAnnouncementAudience,
  matchesAnnouncementSurface,
  resolveAnnouncementLocale,
  type AnnouncementSurface,
} from './system-announcements.util';

@Injectable()
export class PublicAnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async listActive(params: {
    locale?: string;
    surface?: AnnouncementSurface;
    userId?: string | null;
    userRoles?: string[];
  }) {
    const locale = resolveAnnouncementLocale(params.locale);
    const surface = params.surface ?? 'app';
    const isAuthenticated = Boolean(params.userId);
    const userRoles = params.userRoles ?? [];
    const isAdminSurface = surface === 'admin';
    const cacheKey = `announcements:active:${surface}:${locale}:${params.userId ?? 'guest'}`;

    return this.cache.getOrSet(cacheKey, CACHE_TTL_MS.publicSystemStatus, async () => {
      const now = new Date();
      const rows = await this.prisma.systemAnnouncement.findMany({
        where: {
          status: { in: ['ACTIVE', 'SCHEDULED'] },
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        orderBy: [{ sticky: 'desc' }, { severity: 'desc' }, { publishedAt: 'desc' }],
      });

      let dismissed = new Set<string>();
      if (params.userId) {
        const dismissals = await this.prisma.systemAnnouncementDismissal.findMany({
          where: { userId: params.userId },
          select: { announcementId: true },
        });
        dismissed = new Set(dismissals.map((d) => d.announcementId));
      }

      const items = rows
        .filter((row) => isAnnouncementActiveNow(row, now))
        .filter((row) => matchesAnnouncementSurface(row, surface))
        .filter((row) =>
          matchesAnnouncementAudience({
            audience: row.audience,
            targetRoles: row.targetRoles,
            isAuthenticated,
            userRoles,
            isAdminSurface,
          }),
        )
        .filter((row) => !dismissed.has(row.id))
        .map((row) => {
          const localized = localizedAnnouncementFields(row, locale);
          return {
            id: row.id,
            type: row.type.toLowerCase(),
            severity: row.severity.toLowerCase(),
            title: localized.title,
            message: localized.message,
            shortMessage: localized.shortMessage,
            actionLabel: localized.actionLabel,
            actionUrl: row.actionUrl,
            dismissible: row.dismissible,
            sticky: row.sticky,
            startsAt: row.startsAt?.toISOString() ?? null,
            endsAt: row.endsAt?.toISOString() ?? null,
            publishedAt: row.publishedAt?.toISOString() ?? null,
          };
        });

      return { locale, surface, items };
    });
  }

  async dismiss(userId: string, announcementId: string) {
    await this.prisma.systemAnnouncementDismissal.upsert({
      where: {
        announcementId_userId: { announcementId, userId },
      },
      create: { announcementId, userId },
      update: { dismissedAt: new Date() },
    });
    this.cache.invalidatePrefix('announcements:active:');
    return { ok: true };
  }
}
