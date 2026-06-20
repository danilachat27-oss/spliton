import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { GeneratedDocumentStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { IdempotencyService } from '../idempotency/idempotency.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RetentionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetentionCleanupService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
  ) {}

  onModuleInit(): void {
    if (process.env.RETENTION_CLEANUP_ENABLED !== 'true') return;
    const hours = Number(process.env.RETENTION_CLEANUP_INTERVAL_HOURS ?? 24);
    const ms = Math.max(1, hours) * 60 * 60 * 1000;
    this.timer = setInterval(() => void this.run(), ms);
    this.logger.log(`Retention cleanup scheduled every ${hours}h`);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async run(): Promise<{ idempotency: number; expiredDocuments: number }> {
    const idempotency = await this.idempotency.purgeExpired(1000);

    const docRetentionDays = Number(process.env.DOCUMENT_TTL_DAYS ?? 7);
    const cutoff = new Date(Date.now() - docRetentionDays * DAY_MS);
    const expired = await this.prisma.generatedDocument.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        status: GeneratedDocumentStatus.COMPLETED,
      },
      data: { status: GeneratedDocumentStatus.EXPIRED },
    });

    const resetTtl = Number(process.env.PASSWORD_RESET_RETENTION_DAYS ?? 7);
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: new Date(Date.now() - resetTtl * DAY_MS) },
      },
    });

    const verifyTtl = Number(process.env.EMAIL_VERIFY_RETENTION_DAYS ?? 7);
    await this.prisma.emailVerificationToken.deleteMany({
      where: {
        expiresAt: { lt: new Date(Date.now() - verifyTtl * DAY_MS) },
      },
    });

    this.logger.log(
      `Retention: idempotency=${idempotency}, documentsExpired=${expired.count}`,
    );
    return { idempotency, expiredDocuments: expired.count };
  }
}
