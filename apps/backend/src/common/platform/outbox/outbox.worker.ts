import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventOutboxStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../../modules/notifications/notification.service';
import { UserRoleCode } from '@prisma/client';
import { OutboxEventTypes } from './outbox.types';

const DEFAULT_POLL_MS = 10_000;
const BATCH = 20;

function isOutboxWorkerEnabled(): boolean {
  return process.env.EVENT_OUTBOX_WORKER_ENABLED !== 'false';
}

function pollMs(): number {
  const raw = Number(process.env.EVENT_OUTBOX_POLL_MS ?? DEFAULT_POLL_MS);
  return Number.isFinite(raw) && raw >= 3_000 ? raw : DEFAULT_POLL_MS;
}

@Injectable()
export class OutboxWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxWorker.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  onModuleInit(): void {
    if (!isOutboxWorkerEnabled()) {
      this.logger.log('Event outbox worker disabled (EVENT_OUTBOX_WORKER_ENABLED=false)');
      return;
    }
    const ms = pollMs();
    this.logger.log(`Event outbox worker polling every ${ms}ms`);
    this.timer = setInterval(() => void this.tick(), ms);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const rows = await this.prisma.eventOutbox.findMany({
        where: {
          status: { in: [EventOutboxStatus.PENDING, EventOutboxStatus.FAILED] },
          nextRetryAt: { lte: new Date() },
        },
        orderBy: { createdAt: 'asc' },
        take: BATCH,
      });
      for (const row of rows) {
        await this.processRow(row.id);
      }
    } finally {
      this.running = false;
    }
  }

  async processRow(id: string): Promise<void> {
    const row = await this.prisma.eventOutbox.findUnique({ where: { id } });
    if (!row || row.status === EventOutboxStatus.COMPLETED) return;
    if (row.status === EventOutboxStatus.DEAD_LETTER) return;

    await this.prisma.eventOutbox.update({
      where: { id },
      data: { status: EventOutboxStatus.PROCESSING },
    });

    try {
      await this.dispatch(row.eventType, row.payload as Record<string, unknown>);
      await this.prisma.eventOutbox.update({
        where: { id },
        data: {
          status: EventOutboxStatus.COMPLETED,
          processedAt: new Date(),
          lastError: null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const attempts = row.attempts + 1;
      const dead = attempts >= row.maxAttempts;
      await this.prisma.eventOutbox.update({
        where: { id },
        data: {
          status: dead ? EventOutboxStatus.DEAD_LETTER : EventOutboxStatus.FAILED,
          attempts,
          lastError: message.slice(0, 2000),
          nextRetryAt: new Date(Date.now() + backoffMs(attempts)),
        },
      });
      if (dead) {
        this.logger.error(`Outbox dead-letter ${id} (${row.eventType}): ${message}`);
      }
    }
  }

  private async dispatch(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (eventType === OutboxEventTypes.NOTIFICATION_USER) {
      const userId = String(payload.userId ?? '');
      const input = payload.input as Parameters<
        NotificationService['notifyUser']
      >[1];
      await this.notifications.notifyUser(userId, input);
      return;
    }
    if (eventType === OutboxEventTypes.NOTIFICATION_ADMIN_ROLES) {
      const roles = (payload.roleCodes as string[]) ?? [];
      const input = payload.input as Parameters<
        NotificationService['notifyAdminRoles']
      >[1];
      await this.notifications.notifyAdminRoles(
        roles as UserRoleCode[],
        input,
      );
      return;
    }
    throw new Error(`Unknown outbox event type: ${eventType}`);
  }
}

function backoffMs(attempt: number): number {
  return Math.min(60_000 * 2 ** attempt, 30 * 60_000);
}
