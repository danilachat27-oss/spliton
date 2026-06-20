import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DisputeStatus,
  DisputeType,
  Prisma,
  SupportTicketPriority,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAppError } from '../../common/platform/errors/throw-app-error';
import { ErrorCodes } from '../../common/platform/errors/error-codes';
import { buildPaginated } from '../admin/common/types/paginated-response.type';
import { OperatorSlaService } from '../operator-sla/operator-sla.service';

const TYPE_API: Record<DisputeType, string> = {
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

const API_TYPE = Object.fromEntries(
  Object.entries(TYPE_API).map(([k, v]) => [v, k]),
) as Record<string, DisputeType>;

const STATUS_API: Record<DisputeStatus, string> = {
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  WAITING_FOR_USER: 'waiting_for_user',
  WAITING_FOR_ADMIN: 'waiting_for_admin',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  CLOSED: 'closed',
};

@Injectable()
export class UserDisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sla: OperatorSlaService,
  ) {}

  private map(row: {
    id: string;
    type: DisputeType;
    status: DisputeStatus;
    subject: string;
    description: string;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
    dueAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      type: TYPE_API[row.type],
      status: STATUS_API[row.status],
      subject: row.subject,
      description: row.description,
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      dueAt: row.dueAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(
    userId: string,
    body: {
      type: string;
      subject: string;
      description: string;
      relatedEntityType?: string;
      relatedEntityId?: string;
    },
  ) {
    const type = API_TYPE[body.type] ?? DisputeType.OTHER;
    const dueAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const row = await this.prisma.dispute.create({
      data: {
        userId,
        type,
        subject: body.subject.trim(),
        description: body.description.trim(),
        relatedEntityType: body.relatedEntityType,
        relatedEntityId: body.relatedEntityId,
        dueAt,
        priority:
          type === DisputeType.ACCOUNT_SECURITY || type === DisputeType.KYC_REJECTED
            ? SupportTicketPriority.HIGH
            : SupportTicketPriority.MEDIUM,
      },
    });
    await this.prisma.disputeMessage.create({
      data: { disputeId: row.id, authorUserId: userId, body: body.description.trim() },
    });
    await this.sla.ensureTask({
      taskType: 'DISPUTE_RESPONSE',
      entityType: 'dispute',
      entityId: row.id,
      dueAt,
      title: `Dispute: ${row.subject}`,
      href: `/admin/disputes?dispute=${row.id}`,
      priority: row.priority,
    });
    return this.map(row);
  }

  async list(userId: string, page = 1, pageSize = 20) {
    const take = Math.min(50, Math.max(1, pageSize));
    const skip = (Math.max(1, page) - 1) * take;
    const where: Prisma.DisputeWhereInput = { userId };
    const [total, rows] = await Promise.all([
      this.prisma.dispute.count({ where }),
      this.prisma.dispute.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    ]);
    return buildPaginated(rows.map((r) => this.map(r)), total, page, take);
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.dispute.findFirst({
      where: { id, userId },
      include: {
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!row) {
      throwAppError(ErrorCodes.AUTH_FORBIDDEN, 'Dispute not found', HttpStatus.NOT_FOUND);
    }
    return {
      ...this.map(row!),
      messages: row!.messages.map((m) => ({
        id: m.id,
        body: m.body,
        isStaff: m.isStaff,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async addMessage(userId: string, id: string, body: string) {
    const row = await this.prisma.dispute.findFirst({ where: { id, userId } });
    if (!row) {
      throwAppError(ErrorCodes.AUTH_FORBIDDEN, 'Dispute not found', HttpStatus.NOT_FOUND);
    }
    if (['RESOLVED', 'REJECTED', 'CLOSED'].includes(row!.status)) {
      throwAppError(ErrorCodes.VALIDATION_ERROR, 'Dispute is closed', HttpStatus.BAD_REQUEST);
    }
    await this.prisma.disputeMessage.create({
      data: { disputeId: id, authorUserId: userId, body: body.trim() },
    });
    await this.prisma.dispute.update({
      where: { id },
      data: { status: DisputeStatus.WAITING_FOR_ADMIN, updatedAt: new Date() },
    });
    return { ok: true };
  }
}
