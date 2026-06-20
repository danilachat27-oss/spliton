import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { assertAdminArea } from '../common/admin-permissions';
import { throwAdminError } from '../common/admin-http.util';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminListQueryDto } from '../common/dto/admin-list-query.dto';

export type AdminAuditLogItemDto = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  result: string;
};

@Injectable()
export class AdminAuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(roles: string[], query: AdminListQueryDto) {
    assertAdminArea(roles, 'audit', 'view');
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where: Prisma.AuditLogWhereInput = {};
    const and: Prisma.AuditLogWhereInput[] = [];

    if (query.userId?.trim()) {
      const uid = query.userId.trim();
      and.push({
        OR: [
          { actorUserId: uid },
          { AND: [{ entityType: 'user' }, { entityId: uid }] },
        ],
      });
    }
    if (query.search?.trim()) {
      const q = query.search.trim();
      and.push({
        OR: [
          { action: { contains: q, mode: 'insensitive' } },
          { entityType: { contains: q, mode: 'insensitive' } },
          { entityId: q },
          { actorUser: { email: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }
    if (and.length) where.AND = and;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { actorUser: true },
      }),
    ]);

    return buildPaginated(
      rows.map((r) => this.mapRow(r)),
      total,
      page,
      pageSize,
    );
  }

  async getById(roles: string[], id: string): Promise<AdminAuditLogItemDto> {
    assertAdminArea(roles, 'audit', 'view');
    const row = await this.prisma.auditLog.findUnique({
      where: { id },
      include: { actorUser: true },
    });
    if (!row) {
      throwAdminError(
        'AUDIT_NOT_FOUND',
        'Audit log entry not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.mapRow(row);
  }

  private mapRow(row: {
    id: string;
    actorUserId: string | null;
    actorRole: string;
    entityType: string;
    entityId: string | null;
    action: string;
    beforeJsonb: unknown;
    afterJsonb: unknown;
    ip: string | null;
    userAgent: string | null;
    createdAt: Date;
    actorUser: { email: string } | null;
  }): AdminAuditLogItemDto {
    const after =
      row.afterJsonb && typeof row.afterJsonb === 'object'
        ? (row.afterJsonb as Record<string, unknown>)
        : {};
    const result = typeof after.result === 'string' ? after.result : 'success';
    return {
      id: row.id,
      actorId: row.actorUserId,
      actorEmail: row.actorUser?.email ?? null,
      actorRole: row.actorRole,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      before: row.beforeJsonb,
      after: row.afterJsonb,
      ip: row.ip,
      userAgent: row.userAgent,
      createdAt: row.createdAt.toISOString(),
      result,
    };
  }
}
