import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AppLocale } from '@prisma/client';
import { normalizeAppLocale } from '../../common/i18n/app-locale';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountCenterService } from './account-center.service';
import { AuthAuditService } from '../auth/services/auth-audit.service';
import { SessionService } from '../auth/services/session.service';
import type { RequestMeta } from './user-password.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly accountCenter: AccountCenterService,
    private readonly sessionService: SessionService,
    private readonly authAudit: AuthAuditService,
  ) {}

  async getMe(userId: string, roles: string[] = []) {
    const user = await this.usersRepository.findUserWithProfileAndRoles(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const [twoFaEnabled, sessionCount, accountCenter] = await Promise.all([
      this.prisma.twoFactorMethod.count({
        where: { userId, status: 'ENABLED' },
      }),
      this.prisma.userSession.count({
        where: { userId, revokedAt: null },
      }),
      this.accountCenter.buildSummary(userId, roles),
    ]);

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      emailVerified: Boolean(user.emailVerifiedAt),
      profile: user.profile,
      roles: user.userRoles.map((item) => item.role.code),
      preferredLocale: user.profile?.preferredLocale ?? 'ru',
      security: {
        twoFaEnabled: twoFaEnabled > 0,
        activeSessions: sessionCount,
      },
      createdAt: user.createdAt,
      accountCenter,
    };
  }

  async getAccountCenter(userId: string, roles: string[] = []) {
    return this.accountCenter.buildSummary(userId, roles);
  }

  async updatePreferences(
    userId: string,
    body: {
      preferredLocale?: AppLocale;
      displayName?: string;
      timezone?: string;
    },
  ) {
    const user = await this.usersRepository.findUserWithProfileAndRoles(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const profile = await this.usersRepository.upsertProfile(userId, {
      preferredLocale: body.preferredLocale
        ? normalizeAppLocale(body.preferredLocale)
        : undefined,
      displayName: body.displayName,
      timezone: body.timezone,
    });

    return {
      id: user.id,
      email: user.email,
      profile,
      preferredLocale: profile.preferredLocale,
    };
  }

  async listSessions(userId: string) {
    const rows = await this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
      take: 20,
    });
    return {
      items: rows.map((s) => ({
        id: s.id,
        device: s.device,
        ip: s.ip,
        userAgent: s.userAgent,
        lastActiveAt: s.lastActiveAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
        active: !s.revokedAt && (!s.expiresAt || s.expiresAt.getTime() > Date.now()),
        revokedAt: s.revokedAt?.toISOString() ?? null,
      })),
    };
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date(), revokedReason: 'USER_REVOKED' },
    });
    return { ok: true };
  }

  async revokeAllSessions(userId: string) {
    const result = await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'USER_LOGOUT_ALL' },
    });
    return { revoked: result.count };
  }

  async logoutAllSessions(
    userId: string,
    sessionId: string | undefined,
    meta?: RequestMeta,
  ) {
    const revoked = await this.sessionService.revokeAllUserSessions({
      userId,
      reason: 'LOGOUT_ALL',
      excludeSessionId: sessionId,
    });
    await this.authAudit.logEvent({
      event: 'LOGOUT_ALL',
      actorUserId: userId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId, sessionId: sessionId ?? null, revoked },
    });
    return { revoked, success: true };
  }

  async listSecurityEvents(userId: string) {
    const rows = await this.prisma.auditLog.findMany({
      where: { entityType: 'auth', actorUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        action: r.action,
        ip: r.ip,
        userAgent: r.userAgent,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }
}
