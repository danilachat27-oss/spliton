import { Injectable } from '@nestjs/common';
import { ActorRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logOperatorAction(params: {
    actorUserId: string;
    actorRoles: string[];
    entityType: string;
    entityId?: string | null;
    action: string;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
    ip?: string | null;
    userAgent?: string | null;
    result?: 'success' | 'failure';
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        actorRole: ActorRole.ADMIN,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        action: params.action,
        beforeJsonb: params.before ?? undefined,
        afterJsonb: {
          ...(params.after && typeof params.after === 'object'
            ? params.after
            : {}),
          result: params.result ?? 'success',
          staffRoles: params.actorRoles,
        },
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    });

    await this.prisma.adminAction.create({
      data: {
        adminUserId: params.actorUserId,
        actionType: params.action,
        targetType: params.entityType,
        targetId: params.entityId ?? null,
        reason:
          typeof params.after === 'object' &&
          params.after &&
          'note' in params.after &&
          typeof (params.after as { note?: string }).note === 'string'
            ? (params.after as { note: string }).note
            : null,
      },
    });
  }
}
