import { Injectable, Logger } from '@nestjs/common';
import { EventOutboxStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { OutboxEventType } from './outbox.types';

export type EnqueueOutboxParams = {
  eventType: OutboxEventType | string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  maxAttempts?: number;
};

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly prisma: PrismaService) {}

  async enqueue(
    params: EnqueueOutboxParams,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; duplicate: boolean }> {
    const db = tx ?? this.prisma;
    try {
      const row = await db.eventOutbox.create({
        data: {
          eventType: params.eventType,
          payload: params.payload as Prisma.InputJsonValue,
          idempotencyKey: params.idempotencyKey,
          maxAttempts: params.maxAttempts ?? 8,
        },
      });
      return { id: row.id, duplicate: false };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return { id: params.idempotencyKey, duplicate: true };
      }
      throw err;
    }
  }

  async getStats() {
    const [pending, processing, failed, deadLetter] = await Promise.all([
      this.prisma.eventOutbox.count({
        where: { status: EventOutboxStatus.PENDING },
      }),
      this.prisma.eventOutbox.count({
        where: { status: EventOutboxStatus.PROCESSING },
      }),
      this.prisma.eventOutbox.count({
        where: { status: EventOutboxStatus.FAILED },
      }),
      this.prisma.eventOutbox.count({
        where: { status: EventOutboxStatus.DEAD_LETTER },
      }),
    ]);
    return { pending, processing, failed, deadLetter };
  }

  async listDeadLetter(limit = 20) {
    return this.prisma.eventOutbox.findMany({
      where: { status: EventOutboxStatus.DEAD_LETTER },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        idempotencyKey: true,
        attempts: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async requeue(id: string): Promise<void> {
    await this.prisma.eventOutbox.update({
      where: { id },
      data: {
        status: EventOutboxStatus.PENDING,
        attempts: 0,
        nextRetryAt: new Date(),
        lastError: null,
      },
    });
    this.logger.log(`Outbox event ${id} requeued`);
  }
}
