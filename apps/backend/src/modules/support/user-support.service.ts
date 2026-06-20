import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Prisma,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { resolvePagination } from '../../common/pagination/pagination.util';
import { buildPaginated } from '../admin/common/types/paginated-response.type';
import type { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

const CATEGORY_MAP: Record<string, SupportTicketCategory> = {
  deposit: SupportTicketCategory.DEPOSIT,
  withdrawal: SupportTicketCategory.WITHDRAWAL,
  wallet: SupportTicketCategory.WALLET,
  primary_purchase: SupportTicketCategory.PRIMARY_PURCHASE,
  secondary_market: SupportTicketCategory.SECONDARY_MARKET,
  payouts: SupportTicketCategory.PAYOUTS,
  account: SupportTicketCategory.ACCOUNT,
  technical: SupportTicketCategory.TECHNICAL,
  other: SupportTicketCategory.OTHER,
};

const CATEGORY_API: Record<SupportTicketCategory, string> = {
  [SupportTicketCategory.DEPOSIT]: 'deposit',
  [SupportTicketCategory.WITHDRAWAL]: 'withdrawal',
  [SupportTicketCategory.WALLET]: 'wallet',
  [SupportTicketCategory.PRIMARY_PURCHASE]: 'primary_purchase',
  [SupportTicketCategory.SECONDARY_MARKET]: 'secondary_market',
  [SupportTicketCategory.PAYOUTS]: 'payouts',
  [SupportTicketCategory.ACCOUNT]: 'account',
  [SupportTicketCategory.TECHNICAL]: 'technical',
  [SupportTicketCategory.OTHER]: 'other',
};

const STATUS_API: Record<SupportTicketStatus, string> = {
  [SupportTicketStatus.OPEN]: 'open',
  [SupportTicketStatus.IN_PROGRESS]: 'in_progress',
  [SupportTicketStatus.WAITING_USER]: 'waiting_user',
  [SupportTicketStatus.ESCALATED]: 'escalated',
  [SupportTicketStatus.CLOSED]: 'closed',
};

const PRIORITY_API: Record<SupportTicketPriority, string> = {
  [SupportTicketPriority.LOW]: 'low',
  [SupportTicketPriority.MEDIUM]: 'medium',
  [SupportTicketPriority.HIGH]: 'high',
  [SupportTicketPriority.CRITICAL]: 'critical',
};

@Injectable()
export class UserSupportService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      messages: {
        orderBy: { createdAt: 'asc' as const },
        include: { author: { select: { id: true, email: true } } },
      },
    } satisfies Prisma.SupportTicketInclude;
  }

  private listInclude() {
    return {
      _count: { select: { messages: true } },
    } satisfies Prisma.SupportTicketInclude;
  }

  private mapList(
    row: Prisma.SupportTicketGetPayload<{
      include: ReturnType<UserSupportService['listInclude']>;
    }>,
  ) {
    return {
      id: row.id,
      subject: row.subject,
      category: CATEGORY_API[row.category],
      priority: PRIORITY_API[row.priority],
      status: STATUS_API[row.status],
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      closedAt: row.closedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      messages: [] as Array<{
        id: string;
        body: string;
        isStaff: boolean;
        authorEmail: string | null;
        createdAt: string;
      }>,
    };
  }

  private map(
    row: Prisma.SupportTicketGetPayload<{
      include: ReturnType<UserSupportService['include']>;
    }>,
  ) {
    return {
      id: row.id,
      subject: row.subject,
      category: CATEGORY_API[row.category],
      priority: PRIORITY_API[row.priority],
      status: STATUS_API[row.status],
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      closedAt: row.closedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      messages: row.messages.map((m) => ({
        id: m.id,
        body: m.body,
        isStaff: m.isStaff,
        authorEmail: m.author?.email ?? null,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async create(userId: string, dto: CreateSupportTicketDto) {
    const category = CATEGORY_MAP[dto.category] ?? SupportTicketCategory.OTHER;
    const ticket = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supportTicket.create({
        data: {
          userId,
          subject: dto.subject.trim(),
          category,
          status: SupportTicketStatus.OPEN,
          relatedEntityType: dto.relatedEntityType ?? null,
          relatedEntityId: dto.relatedEntityId ?? null,
        },
      });
      await tx.supportTicketMessage.create({
        data: {
          ticketId: created.id,
          authorUserId: userId,
          body: dto.message.trim(),
          isStaff: false,
        },
      });
      return created.id;
    });

    return this.getById(userId, ticket);
  }

  async list(userId: string, page = 1, pageSize = 20) {
    const { skip, page: p, pageSize: ps } = resolvePagination(page, pageSize);
    const where = { userId };
    const [total, rows] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: ps,
        orderBy: { updatedAt: 'desc' },
        include: this.listInclude(),
      }),
    ]);
    return buildPaginated(
      rows.map((r) => this.mapList(r)),
      total,
      p,
      ps,
    );
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.supportTicket.findFirst({
      where: { id, userId },
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

  async addMessage(userId: string, id: string, body: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, userId },
    });
    if (!ticket) {
      throwAdminError(
        'TICKET_NOT_FOUND',
        'Ticket not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (ticket.status === SupportTicketStatus.CLOSED) {
      throwAdminError(
        'TICKET_CLOSED',
        'Ticket is closed',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.supportTicketMessage.create({
      data: {
        ticketId: id,
        authorUserId: userId,
        body: body.trim(),
        isStaff: false,
      },
    });
    await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status:
          ticket.status === SupportTicketStatus.WAITING_USER
            ? SupportTicketStatus.IN_PROGRESS
            : ticket.status,
        updatedAt: new Date(),
      },
    });
    return this.getById(userId, id);
  }

  async close(userId: string, id: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, userId },
    });
    if (!ticket) {
      throwAdminError(
        'TICKET_NOT_FOUND',
        'Ticket not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (ticket.status === SupportTicketStatus.CLOSED) {
      return this.getById(userId, id);
    }
    await this.prisma.supportTicket.update({
      where: { id },
      data: { status: SupportTicketStatus.CLOSED, closedAt: new Date() },
    });
    return this.getById(userId, id);
  }
}
