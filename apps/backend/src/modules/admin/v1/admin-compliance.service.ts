import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ComplianceRiskStatus,
  ListingStatus,
  Prisma,
  UserRoleCode,
  UserStatus,
  WalletStatus,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import {
  throwAdminError,
  coerceUnknownString,
} from '../common/admin-http.util';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminComplianceQueryDto } from './dto/admin-compliance-query.dto';
import {
  buildEvidence,
  COMPLIANCE_RISK_RULES,
  computeSla,
  mapFlagListItem,
} from './mappers/admin-compliance.mapper';
import { ComplianceEnforcementService } from '../../compliance/compliance-enforcement.service';

const STATUS_TO_API: Record<ComplianceRiskStatus, string> = {
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
  REVIEWED: 'resolved',
  BLOCKED: 'blocked',
  ON_HOLD: 'in_review',
};

const API_TO_STATUS: Record<string, ComplianceRiskStatus> = {
  open: ComplianceRiskStatus.OPEN,
  in_review: ComplianceRiskStatus.IN_REVIEW,
  resolved: ComplianceRiskStatus.RESOLVED,
  dismissed: ComplianceRiskStatus.DISMISSED,
  reviewed: ComplianceRiskStatus.RESOLVED,
  blocked: ComplianceRiskStatus.BLOCKED,
  on_hold: ComplianceRiskStatus.IN_REVIEW,
};

const flagInclude = {
  user: true,
  reviewedBy: { select: { email: true } },
} as const;

type FlagRow = Prisma.RiskFlagGetPayload<{ include: typeof flagInclude }>;

@Injectable()
export class AdminComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly enforcement: ComplianceEnforcementService,
  ) {}

  private mapFlag(row: FlagRow) {
    return mapFlagListItem({
      ...row,
      status: STATUS_TO_API[row.status],
    });
  }

  async getSummary(roles: string[]) {
    this.assertView(roles);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const slaCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      openCount,
      criticalCount,
      highCount,
      onHoldCount,
      blockedUsersCount,
      frozenOpsCount,
      new24h,
      overdueCount,
      repeatOffenders,
      reviewedFlags,
    ] = await Promise.all([
      this.prisma.riskFlag.count({
        where: { isActive: true, status: ComplianceRiskStatus.OPEN },
      }),
      this.prisma.riskFlag.count({
        where: {
          isActive: true,
          status: ComplianceRiskStatus.OPEN,
          severity: 'critical',
        },
      }),
      this.prisma.riskFlag.count({
        where: {
          isActive: true,
          status: ComplianceRiskStatus.OPEN,
          severity: 'high',
        },
      }),
      this.prisma.riskFlag.count({
        where: {
          isActive: true,
          status: {
            in: [ComplianceRiskStatus.IN_REVIEW, ComplianceRiskStatus.ON_HOLD],
          },
        },
      }),
      this.prisma.user.count({
        where: { status: UserStatus.SUSPENDED, deletedAt: null },
      }),
      this.prisma.complianceFreeze.count({ where: { isActive: true } }),
      this.prisma.riskFlag.count({ where: { createdAt: { gte: since24h } } }),
      this.prisma.riskFlag.count({
        where: {
          isActive: true,
          status: ComplianceRiskStatus.OPEN,
          createdAt: { lt: slaCutoff },
        },
      }),
      this.prisma.riskFlag
        .groupBy({
          by: ['userId'],
          where: { isActive: true },
          _count: { id: true },
        })
        .then((rows) => rows.filter((r) => r._count.id > 1)),
      this.prisma.riskFlag.findMany({
        where: {
          reviewedAt: { not: null },
          status: {
            in: [
              ComplianceRiskStatus.RESOLVED,
              ComplianceRiskStatus.DISMISSED,
              ComplianceRiskStatus.REVIEWED,
            ],
          },
        },
        select: { createdAt: true, reviewedAt: true },
        take: 200,
        orderBy: { reviewedAt: 'desc' },
      }),
    ]);

    let avgReviewHours: number | null = null;
    if (reviewedFlags.length) {
      const totalH = reviewedFlags.reduce((s, f) => {
        if (!f.reviewedAt) return s;
        return (
          s +
          (f.reviewedAt.getTime() - f.createdAt.getTime()) / (60 * 60 * 1000)
        );
      }, 0);
      avgReviewHours = Math.round((totalH / reviewedFlags.length) * 10) / 10;
    }

    const bySeverity = await this.prisma.riskFlag.groupBy({
      by: ['severity'],
      where: { isActive: true },
      _count: true,
    });

    const byKind = await this.prisma.riskFlag.groupBy({
      by: ['entityType'],
      where: { isActive: true },
      _count: true,
    });

    return {
      openCount,
      criticalCount,
      highCount,
      onHoldCount,
      blockedUsersCount,
      frozenOpsCount,
      avgReviewHours,
      overdueCount,
      new24hCount: new24h,
      repeatOffendersCount: repeatOffenders.length,
      blockedCount: blockedUsersCount,
      frozenCount: frozenOpsCount,
      usersCount: byKind.find((k) => k.entityType === 'user')?._count ?? 0,
      withdrawalsCount:
        byKind.find((k) => k.entityType === 'withdrawal')?._count ?? 0,
      tradesCount: byKind.find((k) => k.entityType === 'trade')?._count ?? 0,
      bySeverity: bySeverity.map((s) => ({
        severity: s.severity,
        count: s._count,
      })),
      byEntityType: byKind.map((k) => ({
        entityType: k.entityType ?? 'user',
        count: k._count,
      })),
    };
  }

  getRiskRules(roles: string[]) {
    this.assertView(roles);
    return { items: COMPLIANCE_RISK_RULES };
  }

  async getHistory(roles: string[], query: AdminComplianceQueryDto) {
    this.assertView(roles);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where: Prisma.AuditLogWhereInput = {
      action: { startsWith: 'compliance.' },
    };
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
        include: { actorUser: { select: { email: true } } },
      }),
    ]);

    return buildPaginated(
      rows.map((r) => ({
        id: r.id,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        actorEmail: r.actorUser?.email ?? null,
        before: r.beforeJsonb,
        after: r.afterJsonb,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  async listRiskFlags(roles: string[], query: AdminComplianceQueryDto) {
    this.assertView(roles);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(query);

    const orderBy = this.buildOrderBy(query);

    const [total, rows] = await Promise.all([
      this.prisma.riskFlag.count({ where }),
      this.prisma.riskFlag.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: flagInclude,
      }),
    ]);

    return buildPaginated(
      rows.map((r) => this.mapFlag(r)),
      total,
      page,
      pageSize,
    );
  }

  async getRiskFlag(roles: string[], id: string, include?: string) {
    this.assertView(roles);
    const row = await this.prisma.riskFlag.findUnique({
      where: { id },
      include: flagInclude,
    });
    if (!row) {
      throwAdminError(
        'RISK_FLAG_NOT_FOUND',
        'Risk flag not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const base = this.mapFlag(row);
    const parts = new Set(
      (include ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    const result: Record<string, unknown> = { ...base };

    if (parts.has('evidence')) {
      result.evidence = buildEvidence(row);
    }
    if (parts.has('timeline')) {
      result.timeline = await this.loadTimeline(id, row);
    }
    if (parts.has('activity')) {
      result.relatedActivity = await this.loadRelatedActivity(row);
    }
    if (parts.has('audit')) {
      result.audit = await this.loadAudit(id);
    }
    if (parts.has('object')) {
      result.relatedObject = await this.loadRelatedObject(row);
    }

    const sla = computeSla(row.createdAt, STATUS_TO_API[row.status]);
    result.slaDeadline = sla.deadline || null;
    result.slaOverdue = sla.overdue;

    return result;
  }

  async addNote(
    actorId: string,
    roles: string[],
    id: string,
    note: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    if (!note?.trim()) {
      throwAdminError(
        'NOTE_REQUIRED',
        'Комментарий обязателен',
        HttpStatus.BAD_REQUEST,
      );
    }
    const existing = await this.prisma.riskFlag.findUnique({ where: { id } });
    if (!existing) {
      throwAdminError(
        'RISK_FLAG_NOT_FOUND',
        'Risk flag not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.prisma.complianceNote.create({
      data: {
        riskFlagId: id,
        userId: existing.userId,
        authorUserId: actorId,
        body: note.trim(),
      },
    });
    const combined = [existing.note, note.trim()]
      .filter(Boolean)
      .join('\n---\n');
    const saved = await this.prisma.riskFlag.update({
      where: { id },
      data: { note: combined, updatedAt: new Date() },
      include: flagInclude,
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'compliance_risk',
      entityId: id,
      action: 'compliance.note.add',
      after: { note: note.trim() },
      ...meta,
    });
    return this.mapFlag(saved);
  }

  async assignFlag(
    actorId: string,
    roles: string[],
    id: string,
    assigneeEmail: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const row = await this.prisma.riskFlag.findUnique({ where: { id } });
    if (!row) {
      throwAdminError(
        'RISK_FLAG_NOT_FOUND',
        'Risk flag not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const assignee = await this.prisma.user.findFirst({
      where: { email: { equals: assigneeEmail.trim(), mode: 'insensitive' } },
      select: { id: true },
    });
    await this.prisma.riskFlag.update({
      where: { id },
      data: {
        status: ComplianceRiskStatus.IN_REVIEW,
        assignedToUserId: assignee?.id ?? null,
        updatedAt: new Date(),
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'compliance_risk',
      entityId: id,
      action: 'compliance.flag.assign',
      after: { assigneeEmail },
      ...meta,
    });
    const updated = await this.prisma.riskFlag.findUnique({
      where: { id },
      include: flagInclude,
    });
    const mapped = this.mapFlag(updated!);
    return { ...mapped, assignedToEmail: assigneeEmail };
  }

  async escalateFlag(
    actorId: string,
    roles: string[],
    id: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'compliance_risk',
      entityId: id,
      action: 'compliance.flag.escalate',
      after: { note, target: 'SUPER_ADMIN' },
      ...meta,
    });
    return { ok: true as const, id };
  }

  async resolveFlag(
    actorId: string,
    roles: string[],
    id: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    return this.patchRiskFlagStatus(actorId, roles, id, 'resolved', note, meta);
  }

  async dismissFlag(
    actorId: string,
    roles: string[],
    id: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    if (!note?.trim()) {
      throwAdminError(
        'NOTE_REQUIRED',
        'Укажите причину отклонения (false positive)',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.patchRiskFlagStatus(
      actorId,
      roles,
      id,
      'dismissed',
      note.trim(),
      meta,
    );
  }

  async createRiskFlag(
    actorId: string,
    roles: string[],
    body: Record<string, unknown>,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const userId = coerceUnknownString(body.userId).trim();
    if (!userId) {
      throwAdminError(
        'INVALID_RISK_FLAG',
        'userId is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const saved = await this.prisma.riskFlag.create({
      data: {
        userId,
        flagCode: coerceUnknownString(body.flagCode, 'manual_flag'),
        severity: coerceUnknownString(body.severity, 'medium'),
        note: body.note ? coerceUnknownString(body.note) : null,
        entityType: body.kind ? coerceUnknownString(body.kind) : 'user',
        entityId: body.reference ? coerceUnknownString(body.reference) : userId,
        riskScore: body.riskScore ? Number(body.riskScore) : null,
        status: ComplianceRiskStatus.OPEN,
      },
      include: flagInclude,
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'compliance_risk',
      entityId: saved.id,
      action: 'compliance.risk_flag.create',
      after: this.mapFlag(saved),
      ...meta,
    });

    return this.mapFlag(saved);
  }

  async patchRiskFlagStatus(
    actorId: string,
    roles: string[],
    id: string,
    status: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    if (
      (status === 'reviewed' ||
        status === 'resolved' ||
        status === 'dismissed') &&
      !note?.trim()
    ) {
      throwAdminError(
        'NOTE_REQUIRED',
        'Результат проверки обязателен',
        HttpStatus.BAD_REQUEST,
      );
    }
    const existing = await this.prisma.riskFlag.findUnique({ where: { id } });
    if (!existing) {
      throwAdminError(
        'RISK_FLAG_NOT_FOUND',
        'Risk flag not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (!existing.isActive && status !== 'open') {
      throwAdminError(
        'FLAG_CLOSED',
        'Closed flag cannot be changed without reopen',
        HttpStatus.BAD_REQUEST,
      );
    }

    const apiStatus = status;
    const dbStatus =
      API_TO_STATUS[apiStatus] ??
      (apiStatus === 'reviewed'
        ? ComplianceRiskStatus.RESOLVED
        : ComplianceRiskStatus.OPEN);
    const saved = await this.prisma.riskFlag.update({
      where: { id },
      data: {
        status: dbStatus,
        note: note ?? existing.note,
        reviewedAt: new Date(),
        reviewedByUserId: actorId,
        isActive: !['resolved', 'dismissed', 'reviewed'].includes(apiStatus),
      },
      include: flagInclude,
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'compliance_risk',
      entityId: id,
      action: 'compliance.risk_flag.status_change',
      before: { status: STATUS_TO_API[existing.status] },
      after: { status: apiStatus, note },
      ...meta,
    });

    return this.mapFlag(saved);
  }

  async blockUser(
    actorId: string,
    roles: string[],
    userId: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    if (!note?.trim()) {
      throwAdminError(
        'NOTE_REQUIRED',
        'Причина блокировки обязательна',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.assertCanBlockUser(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throwAdminError('USER_NOT_FOUND', 'User not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'user',
      entityId: userId,
      action: 'compliance.user.block',
      after: { note },
      ...meta,
    });

    return { ok: true as const, userId, status: 'suspended' };
  }

  async unblockUser(
    actorId: string,
    roles: string[],
    userId: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    if (!note?.trim()) {
      throwAdminError(
        'NOTE_REQUIRED',
        'Причина разблокировки обязательна',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'user',
      entityId: userId,
      action: 'compliance.user.unblock',
      after: { note },
      ...meta,
    });

    return { ok: true as const, userId, status: 'active' };
  }

  async freezeUserWallets(
    actorId: string,
    roles: string[],
    userId: string,
    reason: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.enforcement.assertComplianceFreezeRole(roles);
    if (!reason?.trim()) {
      throwAdminError(
        'NOTE_REQUIRED',
        'Причина заморозки обязательна',
        HttpStatus.BAD_REQUEST,
      );
    }
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      select: { id: true },
    });
    await this.prisma.wallet.updateMany({
      where: { userId },
      data: { status: WalletStatus.BLOCKED },
    });
    for (const w of wallets) {
      const existingFreeze = await this.prisma.complianceFreeze.findFirst({
        where: {
          operationId: w.id,
          operationType: 'wallet',
          isActive: true,
        },
      });
      if (existingFreeze) continue;
      await this.prisma.complianceFreeze.create({
        data: {
          operationType: 'wallet',
          operationId: w.id,
          reason: reason ?? null,
          frozenByUserId: actorId,
        },
      });
    }
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'user',
      entityId: userId,
      action: 'compliance.wallet.freeze',
      after: { reason, wallets: wallets.length },
      ...meta,
    });
    return { ok: true as const, userId, walletsFrozen: wallets.length };
  }

  async freezeOperation(
    actorId: string,
    roles: string[],
    operationId: string,
    operationType: string,
    reason: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.enforcement.assertComplianceFreezeRole(roles);
    if (!reason?.trim()) {
      throwAdminError(
        'NOTE_REQUIRED',
        'Причина заморозки обязательна',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingFreeze = await this.prisma.complianceFreeze.findFirst({
      where: { operationId, operationType, isActive: true },
    });
    if (existingFreeze) {
      throwAdminError(
        'ALREADY_FROZEN',
        'Operation is already frozen',
        HttpStatus.BAD_REQUEST,
      );
    }

    const saved = await this.prisma.complianceFreeze.create({
      data: {
        operationType,
        operationId,
        reason: reason ?? null,
        frozenByUserId: actorId,
      },
    });

    if (operationType === 'withdrawal') {
      await this.prisma.withdrawal.updateMany({
        where: { id: operationId, status: { not: WithdrawalStatus.COMPLETED } },
        data: { status: WithdrawalStatus.ON_HOLD },
      });
    } else if (operationType === 'listing') {
      await this.prisma.marketListing.updateMany({
        where: { id: operationId },
        data: { status: ListingStatus.PAUSED },
      });
    } else if (operationType === 'wallet') {
      await this.prisma.wallet.update({
        where: { id: operationId },
        data: { status: WalletStatus.BLOCKED },
      });
    }

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'compliance_freeze',
      entityId: saved.id,
      action: 'compliance.operation.freeze',
      after: { operationType, operationId, reason },
      ...meta,
    });

    return { ok: true as const, freezeId: saved.id };
  }

  async releaseOperation(
    actorId: string,
    roles: string[],
    operationId: string,
    operationType: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.enforcement.assertComplianceFreezeRole(roles);

    const active = await this.prisma.complianceFreeze.findFirst({
      where: { operationId, operationType, isActive: true },
      orderBy: { frozenAt: 'desc' },
    });
    if (!active) {
      throwAdminError(
        'FREEZE_NOT_FOUND',
        'Active freeze not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.complianceFreeze.update({
      where: { id: active.id },
      data: {
        isActive: false,
        releasedAt: new Date(),
        releasedByUserId: actorId,
      },
    });

    if (operationType === 'withdrawal') {
      await this.prisma.withdrawal.updateMany({
        where: { id: operationId, status: WithdrawalStatus.ON_HOLD },
        data: { status: WithdrawalStatus.LOCKED },
      });
    } else if (operationType === 'listing') {
      await this.prisma.marketListing.updateMany({
        where: { id: operationId, status: ListingStatus.PAUSED },
        data: { status: ListingStatus.ACTIVE },
      });
    } else if (operationType === 'wallet') {
      await this.prisma.wallet.update({
        where: { id: operationId },
        data: { status: WalletStatus.ACTIVE },
      });
    }

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'compliance_freeze',
      entityId: active.id,
      action: 'compliance.operation.release',
      after: { operationType, operationId, note },
      ...meta,
    });

    return { ok: true as const, freezeId: active.id };
  }

  private buildWhere(
    query: AdminComplianceQueryDto,
  ): Prisma.RiskFlagWhereInput {
    const where: Prisma.RiskFlagWhereInput = { isActive: true };

    if (query.queueFilter === 'queue' || query.status === 'open') {
      where.status = ComplianceRiskStatus.OPEN;
    } else if (query.userId?.trim()) {
      where.userId = query.userId.trim();
    }

    if (query.status && query.status !== 'all') {
      if (query.status === 'frozen') {
        where.status = {
          in: [
            ComplianceRiskStatus.IN_REVIEW,
            ComplianceRiskStatus.ON_HOLD,
            ComplianceRiskStatus.BLOCKED,
          ],
        };
      } else if (query.status === 'blocked_users') {
        where.OR = [
          { status: ComplianceRiskStatus.BLOCKED },
          { user: { status: UserStatus.SUSPENDED } },
        ];
      } else {
        where.status = API_TO_STATUS[query.status] ?? ComplianceRiskStatus.OPEN;
      }
    }

    if (query.queueFilter === 'critical') {
      where.severity = 'critical';
      where.status = ComplianceRiskStatus.OPEN;
    } else if (query.queueFilter === 'high') {
      where.severity = 'high';
    } else if (query.queueFilter === 'overdue') {
      where.status = ComplianceRiskStatus.OPEN;
      where.createdAt = { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) };
    } else if (query.queueFilter === 'frozen') {
      where.status = {
        in: [ComplianceRiskStatus.IN_REVIEW, ComplianceRiskStatus.ON_HOLD],
      };
    } else if (query.queueFilter === 'blocked') {
      where.status = ComplianceRiskStatus.BLOCKED;
    }

    if (query.entityType?.trim()) {
      where.entityType = query.entityType.trim();
    }
    if (query.severity && query.severity !== 'all') {
      where.severity = query.severity;
    }
    if (query.minRiskScore) {
      where.riskScore = {
        ...(where.riskScore as object),
        gte: Number(query.minRiskScore),
      };
    }
    if (query.maxRiskScore) {
      where.riskScore = {
        ...(where.riskScore as object),
        lte: Number(query.maxRiskScore),
      };
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom)
        (where.createdAt as Prisma.DateTimeFilter).gte = new Date(
          query.dateFrom,
        );
      if (query.dateTo)
        (where.createdAt as Prisma.DateTimeFilter).lte = new Date(query.dateTo);
    }
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { flagCode: { contains: q, mode: 'insensitive' } },
        { note: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { entityId: q },
        { id: q },
      ];
    }
    return where;
  }

  private buildOrderBy(
    query: AdminComplianceQueryDto,
  ): Prisma.RiskFlagOrderByWithRelationInput {
    switch (query.sortBy) {
      case 'oldest':
        return { createdAt: 'asc' };
      case 'highest_risk':
        return { riskScore: 'desc' };
      case 'critical_first':
        return { severity: 'desc' };
      case 'sla_first':
        return { createdAt: 'asc' };
      case 'recently_updated':
        return { updatedAt: 'desc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }

  private async loadTimeline(flagId: string, row: FlagRow) {
    const audits = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'compliance_risk', entityId: flagId },
          {
            entityType: 'compliance_freeze',
            entityId: row.entityId ?? undefined,
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: { actorUser: { select: { email: true } } },
    });
    const items = [
      {
        action: 'compliance.flag.create',
        actorEmail: null,
        createdAt: row.createdAt.toISOString(),
        detail: row.flagCode,
      },
      ...audits.map((a) => ({
        action: a.action,
        actorEmail: a.actorUser?.email ?? null,
        createdAt: a.createdAt.toISOString(),
        detail: a.afterJsonb,
      })),
    ];
    return items;
  }

  private async loadAudit(flagId: string) {
    const audits = await this.prisma.auditLog.findMany({
      where: { entityType: 'compliance_risk', entityId: flagId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { actorUser: { select: { email: true } } },
    });
    return audits.map((a) => ({
      id: a.id,
      action: a.action,
      actorEmail: a.actorUser?.email ?? null,
      before: a.beforeJsonb,
      after: a.afterJsonb,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  private async loadRelatedActivity(row: FlagRow) {
    const walletIds = (
      await this.prisma.wallet.findMany({
        where: { userId: row.userId },
        select: { id: true },
      })
    ).map((w) => w.id);

    const [withdrawals, trades, deposits] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where: { walletTx: { walletId: { in: walletIds } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { walletTx: { select: { amount: true, netAmount: true } } },
      }),
      this.prisma.trade.findMany({
        where: {
          OR: [{ buyerUserId: row.userId }, { sellerUserId: row.userId }],
        },
        orderBy: { executedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          grossAmount: true,
          settlementStatus: true,
          executedAt: true,
        },
      }),
      this.prisma.deposit.findMany({
        where: { walletTx: { walletId: { in: walletIds } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { walletTx: { select: { amount: true } } },
      }),
    ]);
    return {
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        amount: w.walletTx.amount.toString(),
        status: w.status.toLowerCase(),
        at: w.createdAt.toISOString(),
      })),
      trades: trades.map((t) => ({
        id: t.id,
        amount: t.grossAmount.toString(),
        status: t.settlementStatus.toLowerCase(),
        at: t.executedAt.toISOString(),
      })),
      deposits: deposits.map((d) => ({
        id: d.id,
        amount: d.walletTx.amount.toString(),
        status: d.status.toLowerCase(),
        at: d.createdAt.toISOString(),
      })),
    };
  }

  private async loadRelatedObject(row: FlagRow) {
    const type = row.entityType ?? 'user';
    const ref = row.entityId ?? row.userId;
    if (type === 'withdrawal') {
      const w = await this.prisma.withdrawal.findUnique({
        where: { id: ref },
        include: {
          walletTx: {
            select: { amount: true, feeAmount: true, netAmount: true },
          },
        },
      });
      if (!w) return null;
      return {
        type: 'withdrawal',
        id: w.id,
        amountUsdt: w.walletTx.amount.toString(),
        feeUsdt: w.walletTx.feeAmount.toString(),
        netUsdt: w.walletTx.netAmount.toString(),
        trc20Address: w.toAddress,
        status: w.status.toLowerCase(),
        requestedAt: w.requestedAt.toISOString(),
      };
    }
    if (type === 'trade') {
      const t = await this.prisma.trade.findUnique({
        where: { id: ref },
        include: {
          buyer: { select: { email: true } },
          seller: { select: { email: true } },
          release: { select: { title: true } },
        },
      });
      if (!t) return null;
      return {
        type: 'trade',
        id: t.id,
        units: t.units.toString(),
        priceUsdt: t.grossAmount.toString(),
        feeUsdt: t.feeTotal.toString(),
        settlementStatus: t.settlementStatus.toLowerCase(),
        buyerEmail: t.buyer.email,
        sellerEmail: t.seller.email,
        releaseTitle: t.release.title,
        executedAt: t.executedAt.toISOString(),
      };
    }
    return {
      type: 'user',
      id: row.userId,
      email: row.user.email,
      status: row.user.status.toLowerCase(),
    };
  }

  private async assertCanBlockUser(userId: string) {
    const superRole = await this.prisma.userRole.findFirst({
      where: { userId, role: { code: UserRoleCode.SUPER_ADMIN } },
    });
    if (!superRole) return;
    const superCount = await this.prisma.userRole.count({
      where: { role: { code: UserRoleCode.SUPER_ADMIN } },
    });
    if (superCount <= 1) {
      throwAdminError(
        'CANNOT_BLOCK_SUPER_ADMIN',
        'Cannot block the last super admin user',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertView(roles: string[]) {
    const ok = roles.some((r) =>
      [
        'SUPER_ADMIN',
        'ADMIN',
        'COMPLIANCE',
        'SUPPORT_MANAGER',
        'ACCOUNTANT',
        'BUSINESS_ANALYST',
      ].includes(r),
    );
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertMutate(roles: string[]) {
    const ok = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'COMPLIANCE'].includes(r),
    );
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
