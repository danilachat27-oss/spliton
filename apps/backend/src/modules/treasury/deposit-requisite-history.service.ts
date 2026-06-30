import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type RequisiteHistoryEntry = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  before: unknown;
  after: unknown;
  actorUserId: string | null;
  actorRole: string | null;
  reason: string | null;
  createdAt: string;
};

@Injectable()
export class DepositRequisiteHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    entityType: string;
    entityId: string;
    action: string;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
    actorUserId?: string;
    actorRoles?: string[];
    reason?: string;
  }): Promise<void> {
    const primaryRole =
      params.actorRoles?.find((r) => r === 'SUPER_ADMIN') ??
      params.actorRoles?.[0] ??
      null;

    await this.prisma.depositRequisiteChangeHistory.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        beforeJson: params.before ?? undefined,
        afterJson: params.after ?? undefined,
        actorUserId: params.actorUserId ?? null,
        actorRole: primaryRole,
        reason: params.reason?.trim() || null,
      },
    });
  }

  async listRecent(
    limit = 30,
    entityTypes?: string[],
  ): Promise<RequisiteHistoryEntry[]> {
    const rows = await this.prisma.depositRequisiteChangeHistory.findMany({
      where: entityTypes?.length
        ? { entityType: { in: entityTypes } }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => this.map(r));
  }

  async listForEntity(
    entityType: string,
    entityId: string,
    limit = 50,
  ): Promise<RequisiteHistoryEntry[]> {
    const rows = await this.prisma.depositRequisiteChangeHistory.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => this.map(r));
  }

  private map(row: {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    beforeJson: Prisma.JsonValue | null;
    afterJson: Prisma.JsonValue | null;
    actorUserId: string | null;
    actorRole: string | null;
    reason: string | null;
    createdAt: Date;
  }): RequisiteHistoryEntry {
    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      action: row.action,
      before: row.beforeJson,
      after: row.afterJson,
      actorUserId: row.actorUserId,
      actorRole: row.actorRole,
      reason: row.reason,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
