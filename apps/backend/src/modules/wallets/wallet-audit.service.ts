import { Injectable } from '@nestjs/common';
import { ActorRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WalletAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logUserAction(params: {
    actorUserId: string;
    entityType: string;
    entityId?: string | null;
    action: string;
    after?: Prisma.InputJsonValue;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        actorRole: ActorRole.USER,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        action: params.action,
        afterJsonb: params.after,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  }
}
