import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Prisma,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { throwAdminError } from '../common/admin-http.util';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminListQueryDto } from '../common/dto/admin-list-query.dto';
import { NotificationEventsService } from '../../notifications/notification-events.service';

const CATEGORY_TO_API: Record<SupportTicketCategory, string> = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  WALLET: 'wallet',
  PRIMARY_PURCHASE: 'primary_purchase',
  ACCOUNT: 'account',
  SECONDARY_MARKET: 'secondary_market',
  PAYOUTS: 'payouts',
  TECHNICAL: 'technical',
  OTHER: 'other',
};

const API_TO_CATEGORY: Record<string, SupportTicketCategory> = {
  deposit: SupportTicketCategory.DEPOSIT,
  withdrawal: SupportTicketCategory.WITHDRAWAL,
  wallet: SupportTicketCategory.WALLET,
  primary_purchase: SupportTicketCategory.PRIMARY_PURCHASE,
  account: SupportTicketCategory.ACCOUNT,
  secondary_market: SupportTicketCategory.SECONDARY_MARKET,
  payouts: SupportTicketCategory.PAYOUTS,
  technical: SupportTicketCategory.TECHNICAL,
  other: SupportTicketCategory.OTHER,
  transaction: SupportTicketCategory.DEPOSIT,
  market: SupportTicketCategory.SECONDARY_MARKET,
  payout: SupportTicketCategory.PAYOUTS,
};

const STATUS_TO_API: Record<SupportTicketStatus, string> = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_USER: 'waiting_user',
  ESCALATED: 'escalated',
  CLOSED: 'closed',
};

const API_TO_STATUS: Record<string, SupportTicketStatus> = {
  open: SupportTicketStatus.OPEN,
  in_progress: SupportTicketStatus.IN_PROGRESS,
  waiting_user: SupportTicketStatus.WAITING_USER,
  escalated: SupportTicketStatus.ESCALATED,
  closed: SupportTicketStatus.CLOSED,
};

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

const FINANCE_CATEGORIES = new Set<SupportTicketCategory>([
  SupportTicketCategory.DEPOSIT,
  SupportTicketCategory.WITHDRAWAL,
  SupportTicketCategory.WALLET,
  SupportTicketCategory.PAYOUTS,
]);

const SLA_HOURS: Record<SupportTicketPriority, number> = {
  [SupportTicketPriority.CRITICAL]: 2,
  [SupportTicketPriority.HIGH]: 8,
  [SupportTicketPriority.MEDIUM]: 24,
  [SupportTicketPriority.LOW]: 72,
};

@Injectable()
export class AdminSupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly notificationEvents: NotificationEventsService,
  ) {}

  private include() {
    return {
      user: true,
      assignedTo: { include: { profile: true } },
      notes: {
        orderBy: { createdAt: 'desc' as const },
        take: 50,
        include: { author: true },
      },
      messages: {
        orderBy: { createdAt: 'asc' as const },
        include: { author: true },
      },
    } satisfies Prisma.SupportTicketInclude;
  }

  private listInclude() {
    return {
      user: true,
      assignedTo: { include: { profile: true } },
    } satisfies Prisma.SupportTicketInclude;
  }

  private slaDueAt(row: {
    createdAt: Date;
    priority: SupportTicketPriority;
    status: SupportTicketStatus;
  }) {
    if (row.status === SupportTicketStatus.CLOSED) return null;
    const hours = SLA_HOURS[row.priority] ?? 24;
    return new Date(row.createdAt.getTime() + hours * 3600 * 1000);
  }

  private mapList(
    row: Prisma.SupportTicketGetPayload<{
      include: ReturnType<AdminSupportService['listInclude']>;
    }>,
  ) {
    const due = this.slaDueAt(row);
    const now = Date.now();
    return {
      id: row.id,
      userId: row.userId,
      userEmail: row.user.email,
      subject: row.subject,
      category: CATEGORY_TO_API[row.category],
      priority: PRIORITY_TO_API[row.priority],
      status: STATUS_TO_API[row.status],
      assignedTo: row.assignedTo?.email ?? null,
      assignedToUserId: row.assignedToUserId,
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      escalationTarget: row.escalationTarget,
      isFinanceRelated: FINANCE_CATEGORIES.has(row.category),
      slaDueAt: due?.toISOString() ?? null,
      slaOverdue: due
        ? due.getTime() < now && row.status !== SupportTicketStatus.CLOSED
        : false,
      closedAt: row.closedAt?.toISOString() ?? null,
      firstResponseAt: row.firstResponseAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      notes: [] as Array<{
        id: string;
        authorEmail: string;
        body: string;
        isInternal: boolean;
        createdAt: string;
      }>,
      messages: [] as Array<{
        id: string;
        authorEmail: string;
        body: string;
        isStaff: boolean;
        createdAt: string;
      }>,
    };
  }

  private map(
    row: Prisma.SupportTicketGetPayload<{
      include: ReturnType<AdminSupportService['include']>;
    }>,
  ) {
    const due = this.slaDueAt(row);
    const now = Date.now();
    return {
      id: row.id,
      userId: row.userId,
      userEmail: row.user.email,
      subject: row.subject,
      category: CATEGORY_TO_API[row.category],
      priority: PRIORITY_TO_API[row.priority],
      status: STATUS_TO_API[row.status],
      assignedTo: row.assignedTo?.email ?? null,
      assignedToUserId: row.assignedToUserId,
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      escalationTarget: row.escalationTarget,
      isFinanceRelated: FINANCE_CATEGORIES.has(row.category),
      slaDueAt: due?.toISOString() ?? null,
      slaOverdue: due
        ? due.getTime() < now && row.status !== SupportTicketStatus.CLOSED
        : false,
      closedAt: row.closedAt?.toISOString() ?? null,
      firstResponseAt: row.firstResponseAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      notes: row.notes.map((n) => ({
        id: n.id,
        authorEmail: n.author.email,
        body: n.body,
        isInternal: n.isInternal,
        createdAt: n.createdAt.toISOString(),
      })),
      messages: row.messages.map((m) => ({
        id: m.id,
        authorEmail: m.author.email,
        body: m.body,
        isStaff: m.isStaff,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async summary(roles: string[]) {
    this.assertView(roles);
    const [open, inProgress, waiting, escalated, closed, overdue] =
      await Promise.all([
        this.prisma.supportTicket.count({
          where: { status: SupportTicketStatus.OPEN },
        }),
        this.prisma.supportTicket.count({
          where: { status: SupportTicketStatus.IN_PROGRESS },
        }),
        this.prisma.supportTicket.count({
          where: { status: SupportTicketStatus.WAITING_USER },
        }),
        this.prisma.supportTicket.count({
          where: { status: SupportTicketStatus.ESCALATED },
        }),
        this.prisma.supportTicket.count({
          where: { status: SupportTicketStatus.CLOSED },
        }),
        this.prisma.supportTicket.count({
          where: {
            status: { not: SupportTicketStatus.CLOSED },
            priority: {
              in: [SupportTicketPriority.HIGH, SupportTicketPriority.CRITICAL],
            },
          },
        }),
      ]);
    return {
      open,
      inProgress,
      waiting,
      escalated,
      closed,
      highPriorityOpen: overdue,
    };
  }

  async list(roles: string[], query: AdminListQueryDto) {
    this.assertView(roles);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.SupportTicketWhereInput = {};
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
      where.status = API_TO_STATUS[query.status] ?? SupportTicketStatus.OPEN;
    }
    if (query.category && API_TO_CATEGORY[query.category]) {
      where.category = API_TO_CATEGORY[query.category];
    }
    if (query.priority && API_TO_PRIORITY[query.priority]) {
      where.priority = API_TO_PRIORITY[query.priority];
    }
    if (query.role === 'finance') {
      where.category = { in: [...FINANCE_CATEGORIES] };
    }
    if (query.role === 'compliance' || query.hasRisk === 'true') {
      where.OR = [
        ...(where.OR ?? []),
        { escalationTarget: 'compliance' },
        { status: SupportTicketStatus.ESCALATED },
      ];
    }
    if (query.hasHoldings === 'unassigned') {
      where.assignedToUserId = null;
      where.status = { not: SupportTicketStatus.CLOSED };
    }
    if (query.managerId?.trim()) {
      where.assignedToUserId = query.managerId.trim();
    }

    const [total, rows] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: this.listInclude(),
      }),
    ]);

    return buildPaginated(
      rows.map((r) => this.mapList(r)),
      total,
      page,
      pageSize,
    );
  }

  async getById(roles: string[], id: string) {
    this.assertView(roles);
    const row = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!row) {
      throwAdminError(
        'TICKET_NOT_FOUND',
        'Ticket not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.map(row);
  }

  async take(
    actorId: string,
    roles: string[],
    id: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    return this.assign(actorId, roles, id, actorId, meta);
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
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!existing) {
      throwAdminError(
        'TICKET_NOT_FOUND',
        'Ticket not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const next = API_TO_STATUS[status] ?? SupportTicketStatus.OPEN;
    const saved = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: next,
        closedAt:
          next === SupportTicketStatus.CLOSED ? new Date() : existing.closedAt,
      },
      include: this.include(),
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'support_ticket',
      entityId: id,
      action: 'support.ticket.status_change',
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
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!existing) {
      throwAdminError(
        'TICKET_NOT_FOUND',
        'Ticket not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const next = API_TO_PRIORITY[priority] ?? SupportTicketPriority.MEDIUM;
    const saved = await this.prisma.supportTicket.update({
      where: { id },
      data: { priority: next },
      include: this.include(),
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'support_ticket',
      entityId: id,
      action: 'support.ticket.priority_change',
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
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!existing) {
      throwAdminError(
        'TICKET_NOT_FOUND',
        'Ticket not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const saved = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        assignedToUserId: assigneeUserId,
        status:
          existing.status === SupportTicketStatus.OPEN && assigneeUserId
            ? SupportTicketStatus.IN_PROGRESS
            : existing.status,
      },
      include: this.include(),
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'support_ticket',
      entityId: id,
      action: 'support.ticket.assign',
      before: { assignedToUserId: existing.assignedToUserId },
      after: { assignedToUserId: assigneeUserId },
      ...meta,
    });

    return this.map(saved);
  }

  async escalate(
    actorId: string,
    roles: string[],
    id: string,
    target: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!existing) {
      throwAdminError(
        'TICKET_NOT_FOUND',
        'Ticket not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: SupportTicketStatus.ESCALATED,
        escalationTarget: target,
        priority:
          target === 'super_admin' || target === 'finance'
            ? SupportTicketPriority.CRITICAL
            : existing.priority,
      },
      include: this.include(),
    });
    if (note?.trim()) {
      await this.prisma.supportTicketNote.create({
        data: {
          ticketId: id,
          authorUserId: actorId,
          body: note.trim(),
          isInternal: true,
        },
      });
    }
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'support_ticket',
      entityId: id,
      action: 'support.ticket.escalate',
      after: { target, note },
      ...meta,
    });
    return this.getById(roles, id);
  }

  async reply(
    actorId: string,
    roles: string[],
    id: string,
    body: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!ticket) {
      throwAdminError(
        'TICKET_NOT_FOUND',
        'Ticket not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.prisma.supportTicketMessage.create({
      data: {
        ticketId: id,
        authorUserId: actorId,
        body: body.trim(),
        isStaff: true,
      },
    });
    const patch: Prisma.SupportTicketUpdateInput = {
      status: SupportTicketStatus.WAITING_USER,
      updatedAt: new Date(),
    };
    if (!ticket.firstResponseAt) {
      patch.firstResponseAt = new Date();
    }
    await this.prisma.supportTicket.update({ where: { id }, data: patch });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'support_ticket',
      entityId: id,
      action: 'support.ticket.reply',
      after: { bodyLength: body.length },
      ...meta,
    });
    void this.notificationEvents.supportStaffReplied({
      userId: ticket.userId,
      ticketId: id,
      subject: ticket.subject,
    });
    return this.getById(roles, id);
  }

  async addNote(
    actorId: string,
    roles: string[],
    id: string,
    body: string,
    isInternal: boolean,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!ticket) {
      throwAdminError(
        'TICKET_NOT_FOUND',
        'Ticket not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (isInternal) {
      this.assertMutate(roles);
    } else {
      this.assertReply(roles);
    }

    await this.prisma.supportTicketNote.create({
      data: { ticketId: id, authorUserId: actorId, body, isInternal },
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'support_ticket',
      entityId: id,
      action: 'support.ticket.note_add',
      after: { isInternal, bodyLength: body.length },
      ...meta,
    });

    return this.getById(roles, id);
  }

  async reopen(
    actorId: string,
    roles: string[],
    id: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!existing) {
      throwAdminError(
        'TICKET_NOT_FOUND',
        'Ticket not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.prisma.supportTicket.update({
      where: { id },
      data: { status: SupportTicketStatus.OPEN, closedAt: null },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'support_ticket',
      entityId: id,
      action: 'support.ticket.reopen',
      ...meta,
    });
    return this.getById(roles, id);
  }

  private assertView(roles: string[]) {
    const ok = roles.some((r) =>
      [
        'SUPER_ADMIN',
        'ADMIN',
        'SUPPORT_MANAGER',
        'SUPPORT',
        'COMPLIANCE',
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
      ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_MANAGER'].includes(r),
    );
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertReply(roles: string[]) {
    const ok = roles.some((r) =>
      [
        'SUPER_ADMIN',
        'ADMIN',
        'SUPPORT_MANAGER',
        'SUPPORT',
        'ACCOUNTANT',
        'COMPLIANCE',
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
}
