import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthAuditService } from '../auth/services/auth-audit.service';
import { SessionService } from '../auth/services/session.service';

export type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class UserPasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly authAudit: AuthAuditService,
  ) {}

  async changePassword(params: {
    userId: string;
    sessionId?: string;
    currentPassword: string;
    newPassword: string;
    meta?: RequestMeta;
  }) {
    if (params.currentPassword === params.newPassword) {
      throw new BadRequestException('Новый пароль должен отличаться от текущего');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw new BadRequestException('Смена пароля недоступна для этого способа входа');
    }

    const matches = await bcrypt.compare(params.currentPassword, user.passwordHash);
    if (!matches) {
      await this.authAudit.logEvent({
        event: 'PASSWORD_CHANGE_FAILED',
        actorUserId: params.userId,
        entityId: params.userId,
        ip: params.meta?.ip,
        userAgent: params.meta?.userAgent,
        safeMeta: { reason: 'INVALID_CURRENT_PASSWORD' },
      });
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    const passwordHash = await bcrypt.hash(params.newPassword, 12);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: params.userId },
        data: { passwordHash },
      }),
      this.prisma.userProfile.upsert({
        where: { userId: params.userId },
        create: { userId: params.userId, passwordChangedAt: now },
        update: { passwordChangedAt: now },
      }),
    ]);

    const revokedOther = await this.sessionService.revokeAllUserSessions({
      userId: params.userId,
      reason: 'PASSWORD_CHANGED',
      excludeSessionId: params.sessionId,
    });

    await this.authAudit.logEvent({
      event: 'PASSWORD_CHANGED',
      actorUserId: params.userId,
      entityId: params.userId,
      ip: params.meta?.ip,
      userAgent: params.meta?.userAgent,
      safeMeta: {
        userId: params.userId,
        revokedOtherSessions: revokedOther,
      },
    });

    return {
      ok: true,
      revokedOtherSessions: revokedOther,
      message:
        revokedOther > 0
          ? 'Пароль обновлён. Другие активные сессии завершены.'
          : 'Пароль обновлён.',
    };
  }
}
