import { Injectable } from '@nestjs/common';
import {
  OperatorSlaTaskStatus,
  OperatorSlaTaskType,
  SupportTicketPriority,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OperatorSlaService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureTask(params: {
    taskType: OperatorSlaTaskType;
    entityType: string;
    entityId: string;
    dueAt: Date;
    title: string;
    description?: string;
    href?: string;
    priority?: SupportTicketPriority;
    assignedToUserId?: string;
  }) {
    return this.prisma.operatorSlaTask.upsert({
      where: {
        taskType_entityType_entityId: {
          taskType: params.taskType,
          entityType: params.entityType,
          entityId: params.entityId,
        },
      },
      create: {
        taskType: params.taskType,
        entityType: params.entityType,
        entityId: params.entityId,
        dueAt: params.dueAt,
        title: params.title,
        description: params.description,
        href: params.href,
        priority: params.priority ?? SupportTicketPriority.MEDIUM,
        assignedToUserId: params.assignedToUserId,
        status: OperatorSlaTaskStatus.OPEN,
      },
      update: {
        dueAt: params.dueAt,
        title: params.title,
        description: params.description,
        href: params.href,
        lastActionAt: new Date(),
        status: OperatorSlaTaskStatus.OPEN,
        breachedAt: null,
      },
    });
  }

  async listOpen(params?: { assignedToUserId?: string; overdueOnly?: boolean }) {
    const now = new Date();
    const rows = await this.prisma.operatorSlaTask.findMany({
      where: {
        status: { in: [OperatorSlaTaskStatus.OPEN, OperatorSlaTaskStatus.IN_PROGRESS, OperatorSlaTaskStatus.DUE_SOON, OperatorSlaTaskStatus.OVERDUE] },
        ...(params?.assignedToUserId ? { assignedToUserId: params.assignedToUserId } : {}),
        ...(params?.overdueOnly ? { dueAt: { lt: now } } : {}),
      },
      orderBy: [{ dueAt: 'asc' }],
      take: 100,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        taskType: r.taskType.toLowerCase(),
        status: this.resolveStatus(r.status, r.dueAt, now),
        title: r.title,
        dueAt: r.dueAt.toISOString(),
        breachedAt: r.breachedAt?.toISOString() ?? null,
        href: r.href,
        priority: r.priority.toLowerCase(),
        escalationLevel: r.escalationLevel,
      })),
    };
  }

  async markBreachedTasks() {
    const now = new Date();
    await this.prisma.operatorSlaTask.updateMany({
      where: {
        dueAt: { lt: now },
        breachedAt: null,
        status: { in: [OperatorSlaTaskStatus.OPEN, OperatorSlaTaskStatus.IN_PROGRESS, OperatorSlaTaskStatus.DUE_SOON] },
      },
      data: { status: OperatorSlaTaskStatus.OVERDUE, breachedAt: now },
    });
  }

  private resolveStatus(
    status: OperatorSlaTaskStatus,
    dueAt: Date,
    now: Date,
  ): string {
    if (status === OperatorSlaTaskStatus.OVERDUE || dueAt < now) return 'overdue';
    const hours = (dueAt.getTime() - now.getTime()) / 3_600_000;
    if (hours <= 4) return 'due_soon';
    return status.toLowerCase();
  }
}
