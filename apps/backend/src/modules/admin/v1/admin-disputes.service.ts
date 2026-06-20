import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DisputeStatus,
  DisputeType,
  OperatorSlaTaskStatus,
  OperatorSlaTaskType,
  Prisma,
  SupportTicketPriority,
  UserRoleCode,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { throwAdminError } from '../common/admin-http.util';
import { assertMatrixSection, canMatrixAction } from '../common/admin-role-matrix';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminListQueryDto } from '../common/dto/admin-list-query.dto';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';

const TYPE_TO_API: Record<DisputeType, string> = {
  DEPOSIT_NOT_CREDITED: 'deposit_not_credited',
  WITHDRAWAL_NOT_RECEIVED: 'withdrawal_not_received',
  TRADE_DISPUTE: 'trade_dispute',
  RECEIPT_DOCUMENT_ISSUE: 'receipt_document_issue',
  ACCOUNT_SECURITY: 'account_security',
  KYC_REJECTED: 'kyc_rejected',
  PAYOUT_MISMATCH: 'payout_mismatch',
  REPORT_INCORRECT: 'report_incorrect',
  OTHER: 'other',
};

const API_TO_TYPE: Record<string, DisputeType> = Object.fromEntries(
  Object.entries(TYPE_TO_API).map(([k, v]) => [v, k as DisputeType]),
) as Record<string, DisputeType>;

const STATUS_TO_API: Record<DisputeStatus, string> = {
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  WAITING_FOR_USER: 'waiting_for_user',
  WAITING_FOR_ADMIN: 'waiting_for_admin',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  CLOSED: 'closed',
};

const API_TO_STATUS: Record<string, DisputeStatus> = Object.fromEntries(
  Object.entries(STATUS_TO_API).map(([k, v]) => [v, k as DisputeStatus]),
) as Record<string, DisputeStatus>;

const PRIORITY_TO_API: Record<SupportTicketPriority, string> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const API_TO_PRIORITY: Record<string, SupportTicketPriority> = {
  low: SupportTicketPriority.LOW,
  medium: SupportTicketPriority.MEDIUM,
  high: SupportTicketPriority.HIGH,
  critical: SupportTicketPriority.CRITICAL,
};

const TERMINAL_STATUSES = new Set<DisputeStatus>([
  DisputeStatus.RESOLVED,
  DisputeStatus.REJECTED,
  DisputeStatus.CLOSED,
]);

const STAFF_ROLE_CODES = new Set<string>(ADMIN_PANEL_ROLE_CODES);

@Injectable()
export class AdminDisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  private include() {
    return {
      user: { select: { id: true, email: true, profile: true } },
      assignedTo: { select: { id: true, email: true, profile: true } },
      messages: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          author: { select: { id: true, email: true } },
        },
      },
    } satisfies Prisma.DisputeInclude;
  }

  private map(
    row: Prisma.DisputeGetPayload<{ include: ReturnType<AdminDisputesService['include']> }>,
    options?: { includeInternal?: boolean },
  ) {
    const includeInternal = options?.includeInternal ?? true;
    return {
      id: row.id,
      userId: row.userId,
      userEmail: row.user.email,
      userDisplayName: row.user.profile?.displayName ?? null,
      type: TYPE_TO_API[row.type],
      status: STATUS_TO_API[row.status],
      priority: PRIORITY_TO_API[row.priority],
      subject: row.subject,
      description: row.description,
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      assignedToUserId: row.assignedToUserId,
      assignedToEmail: row.assignedTo?.email ?? null,
      escalationTarget: row.escalationTarget,
      resolutionReason: row.resolutionReason,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      resolvedByUserId: row.resolvedByUserId,
      dueAt: row.dueAt?.toISOString() ?? null,
      breachedAt: row.breachedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      messages: row.messages
        .filter((m) => includeInternal || !m.isInternal)
        .map((m) => ({
          id: m.id,
          authorUserId: m.authorUserId,
          authorEmail: m.author.email,
          body: m.body,
          isStaff: m.isStaff,
          isInternal: m.isInternal,
          createdAt: m.createdAt.toISOString(),
        })),
    };
  }

  async summary(roles: string[]) {
    this.assertView(roles);
    const openStatuses = Object.values(DisputeStatus).filter(
      (s) => !TERMINAL_STATUSES.has(s),
    );
    const [open, waitingAdmin, waitingUser, escalated, highPriority, overdue] =
      await Promise.all([
        this.prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
        this.prisma.dispute.count({
          where: { status: DisputeStatus.WAITING_FOR_ADMIN },
        }),
        this.prisma.dispute.count({
          where: { status: DisputeStatus.WAITING_FOR_USER },
        }),
        this.prisma.dispute.count({
          where: { status: DisputeStatus.ESCALATED },
        }),
        this.prisma.dispute.count({
          where: {
            status: { in: openStatuses },
            priority: {
              in: [SupportTicketPriority.HIGH, SupportTicketPriority.CRITICAL],
            },
          },
        }),
        this.prisma.dispute.count({
          where: {
            status: { in: openStatuses },
            dueAt: { lt: new Date() },
          },
        }),
      ]);
    return { open, waitingAdmin, waitingUser, escalated, highPriority, overdue };
  }

  async list(roles: string[], query: AdminListQueryDto) {
    this.assertView(roles);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.DisputeWhereInput = {};
    if (query.userId?.trim()) where.userId = query.userId.trim();
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { id: q },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (query.status && query.status !== 'all') {
      where.status = API_TO_STATUS[query.status] ?? DisputeStatus.OPEN;
    }
    if (query.category && API_TO_TYPE[query.category]) {
      where.type = API_TO_TYPE[query.category];
    }
    if (query.priority && API_TO_PRIORITY[query.priority]) {
      where.priority = API_TO_PRIORITY[query.priority];
    }
    if (query.managerId?.trim()) {
      where.assignedToUserId = query.managerId.trim();
    }
    if (query.hasHoldings === 'unassigned') {
      where.assignedToUserId = null;
      where.status = { notIn: [...TERMINAL_STATUSES] };
    }

    const [total, rows] = await Promise.all([
      this.prisma.dispute.count({ where }),
      this.prisma.dispute.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: this.include(),
      }),
    ]);

    return buildPaginated(
      rows.map((r) => this.map(r)),
      total,
      page,
      pageSize,
    );
  }

  async getById(roles: string[], id: string) {
    this.assertView(roles);
    const row = await this.prisma.dispute.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!row) {
      throwAdminError('DISPUTE_NOT_FOUND', 'Dispute not found', HttpStatus.NOT_FOUND);
    }
    return this.map(row);
  }

  async patchStatus(
    actorId: string,
    roles: string[],
    id: string,
    status: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const existing = await this.prisma.dispute.findUnique({ where: { id } });
    if (!existing) {
      throwAdminError('DISPUTE_NOT_FOUND', 'Dispute not found', HttpStatus.NOT_FOUND);
    }

    const next = API_TO_STATUS[status];
    if (!next) {
      throwAdminError('INVALID_STATUS', 'Invalid dispute status', HttpStatus.BAD_REQUEST);
    }

    const terminal = TERMINAL_STATUSES.has(next);
    const saved = await this.prisma.dispute.update({
      where: { id },
      data: {
        status: next,
        resolutionReason: terminal ? (note?.trim() || existing.resolutionReason) : existing.resolutionReason,
        resolvedAt: terminal ? new Date() : existing.resolvedAt,
        resolvedByUserId: terminal ? actorId : existing.resolvedByUserId,
      },
      include: this.include(),
    });

    if (terminal) {
      await this.completeSlaTask(id);
    }

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'dispute',
      entityId: id,
      action: 'dispute.status_change',
      before: { status: STATUS_TO_API[existing.status] },
      after: { status, note },
      ...meta,
    });

    return this.map(saved);
  }

  async patchPriority(
    actorId: string,
    roles: string[],
    id: string,
    priority: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const existing = await this.prisma.dispute.findUnique({ where: { id } });
    if (!existing) {
      throwAdminError('DISPUTE_NOT_FOUND', 'Dispute not found', HttpStatus.NOT_FOUND);
    }
    const next = API_TO_PRIORITY[priority];
    if (!next) {
      throwAdminError('INVALID_PRIORITY', 'Invalid priority', HttpStatus.BAD_REQUEST);
    }
    const saved = await this.prisma.dispute.update({
      where: { id },
      data: { priority: next },
      include: this.include(),
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'dispute',
      entityId: id,
      action: 'dispute.priority_change',
      before: { priority: PRIORITY_TO_API[existing.priority] },
      after: { priority },
      ...meta,
    });
    return this.map(saved);
  }

  async assign(
    actorId: string,
    roles: string[],
    id: string,
    assigneeUserId: string | null,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const existing = await this.prisma.dispute.findUnique({ where: { id } });
    if (!existing) {
      throwAdminError('DISPUTE_NOT_FOUND', 'Dispute not found', HttpStatus.NOT_FOUND);
    }
    if (assigneeUserId) {
      await this.assertStaffAssignee(assigneeUserId);
    }
    const saved = await this.prisma.dispute.update({
      where: { id },
      data: { assignedToUserId: assigneeUserId },
      include: this.include(),
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'dispute',
      entityId: id,
      action: 'dispute.assign',
      before: { assignedToUserId: existing.assignedToUserId },
      after: { assignedToUserId: assigneeUserId },
      ...meta,
    });
    return this.map(saved);
  }

  async reply(
    actorId: string,
    roles: string[],
    id: string,
    body: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertReply(roles);
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) {
      throwAdminError('DISPUTE_NOT_FOUND', 'Dispute not found', HttpStatus.NOT_FOUND);
    }
    if (TERMINAL_STATUSES.has(dispute.status)) {
      throwAdminError('DISPUTE_CLOSED', 'Dispute is closed', HttpStatus.CONFLICT);
    }

    await this.prisma.disputeMessage.create({
      data: {
        disputeId: id,
        authorUserId: actorId,
        body: body.trim(),
        isStaff: true,
        isInternal: false,
      },
    });

    const nextStatus =
      dispute.status === DisputeStatus.OPEN || dispute.status === DisputeStatus.WAITING_FOR_ADMIN
        ? DisputeStatus.WAITING_FOR_USER
        : dispute.status;

    await this.prisma.dispute.update({
      where: { id },
      data: {
        status: nextStatus,
        updatedAt: new Date(),
      },
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'dispute',
      entityId: id,
      action: 'dispute.reply',
      after: { bodyLength: body.length },
      ...meta,
    });

    return this.getById(roles, id);
  }

  async addNote(
    actorId: string,
    roles: string[],
    id: string,
    body: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) {
      throwAdminError('DISPUTE_NOT_FOUND', 'Dispute not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.disputeMessage.create({
      data: {
        disputeId: id,
        authorUserId: actorId,
        body: body.trim(),
        isStaff: true,
        isInternal: true,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'dispute',
      entityId: id,
      action: 'dispute.note_add',
      after: { bodyLength: body.length },
      ...meta,
    });
    return this.getById(roles, id);
  }

  private async assertStaffAssignee(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) {
      throwAdminError('USER_NOT_FOUND', 'Assignee not found', HttpStatus.NOT_FOUND);
    }
    const ok = user!.userRoles.some((ur) => STAFF_ROLE_CODES.has(ur.role.code));
    if (!ok) {
      throwAdminError(
        'INVALID_ASSIGNEE',
        'Assignee must be a staff user',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async completeSlaTask(disputeId: string) {
    await this.prisma.operatorSlaTask.updateMany({
      where: {
        taskType: OperatorSlaTaskType.DISPUTE_RESPONSE,
        entityType: 'dispute',
        entityId: disputeId,
        status: { not: OperatorSlaTaskStatus.COMPLETED },
      },
      data: {
        status: OperatorSlaTaskStatus.COMPLETED,
        lastActionAt: new Date(),
      },
    });
  }

  private assertView(roles: string[]) {
    assertMatrixSection(roles, 'disputes', 'view');
  }

  private assertMutate(roles: string[]) {
    assertMatrixSection(roles, 'disputes', 'mutate');
  }

  private assertReply(roles: string[]) {
    if (canMatrixAction(roles, 'disputes', 'mutate')) return;
    const replyRoles = new Set<string>([
      UserRoleCode.SUPPORT,
      UserRoleCode.COMPLIANCE,
    ]);
    if (!roles.some((r) => replyRoles.has(r))) {
      throwAdminError('ADMIN_FORBIDDEN', 'Insufficient permissions', HttpStatus.FORBIDDEN);
    }
  }
}
