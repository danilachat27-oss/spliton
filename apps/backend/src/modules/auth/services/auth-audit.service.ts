import { Injectable } from '@nestjs/common';
import { ActorRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type AuthAuditEvent =
  | 'REGISTER'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'REFRESH_SUCCESS'
  | 'REFRESH_FAILED'
  | 'REFRESH_REUSE_DETECTED'
  | 'LOGOUT'
  | 'LOGOUT_ALL'
  | 'TWO_FACTOR_SETUP_STARTED'
  | 'TWO_FACTOR_ENABLED'
  | 'TWO_FACTOR_DISABLED'
  | 'TWO_FACTOR_CHALLENGE_CREATED'
  | 'TWO_FACTOR_CHALLENGE_SUCCESS'
  | 'TWO_FACTOR_CHALLENGE_FAILED'
  | 'TWO_FACTOR_BACKUP_CODE_USED'
  | 'TWO_FACTOR_RECOVERY_CODES_REGENERATED';

@Injectable()
export class AuthAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logEvent(params: {
    event: AuthAuditEvent;
    actorUserId?: string | null;
    entityId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    safeMeta?: Prisma.InputJsonObject;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId ?? null,
        actorRole: params.actorUserId ? ActorRole.USER : ActorRole.SYSTEM,
        entityType: 'auth',
        entityId: params.entityId ?? params.actorUserId ?? null,
        action: params.event,
        afterJsonb: params.safeMeta,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  }
}
