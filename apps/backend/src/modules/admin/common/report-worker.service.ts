import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { hostname } from 'os';
import {
  ReportJobStatus,
  SystemAlertSeverity,
  SystemAlertSource,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SystemAlertService } from '../../../common/observability/system-alert.service';
import { ErrorTrackingService } from '../../../common/observability/error-tracking.service';
import { reportMaxAttempts, reportRunningTimeoutMs } from './report-job.util';
import { AdminReportsService } from '../v1/admin-reports.service';
import { NotificationEventsService } from '../../notifications/notification-events.service';

const DEFAULT_POLL_MS = 15_000;

function isReportWorkerEnabled(): boolean {
  return process.env.REPORT_WORKER_ENABLED === 'true';
}

function pollIntervalMs(): number {
  const raw = Number(process.env.REPORT_WORKER_POLL_MS ?? DEFAULT_POLL_MS);
  return Number.isFinite(raw) && raw >= 5_000 ? raw : DEFAULT_POLL_MS;
}

function workerInstanceId(): string {
  return `${hostname()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Polls queued report jobs and processes them (CSV build + storage).
 * Off by default in development — set REPORT_WORKER_ENABLED=true (see worker:dev).
 */
@Injectable()
export class ReportWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportWorkerService.name);
  private readonly workerId = workerInstanceId();
  private processing = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: AdminReportsService,
    private readonly alerts: SystemAlertService,
    private readonly errorTracking: ErrorTrackingService,
    private readonly notificationEvents: NotificationEventsService,
  ) {}

  onModuleInit(): void {
    if (!isReportWorkerEnabled()) {
      this.logger.log(
        'Report worker disabled (REPORT_WORKER_ENABLED is not "true")',
      );
      return;
    }

    const ms = pollIntervalMs();
    this.logger.log(`Report worker ${this.workerId} polling every ${ms}ms`);
    this.timer = setInterval(() => {
      void this.tick();
    }, ms);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.processing = false;
  }

  async tick(): Promise<void> {
    if (!isReportWorkerEnabled()) return;
    if (this.processing) return;

    this.processing = true;
    try {
      await this.recoverStuckJobs();
      await this.expireCompletedJobs();
      await this.processNextBatch();
    } finally {
      this.processing = false;
    }
  }

  async processNextBatch(limit = 2): Promise<number> {
    let processed = 0;
    for (let i = 0; i < limit; i++) {
      const jobId = await this.claimNextJobId();
      if (!jobId) break;

      try {
        await this.reports.processJobById(jobId);
        processed += 1;
      } catch (err) {
        this.logger.error(`Report job ${jobId} failed`, err);
        this.errorTracking.captureException(err, {
          source: 'report_worker',
          jobId,
        });
        void this.alerts.createIfNotOpen({
          code: 'REPORT_JOB_FAILED',
          title: 'Report job failed',
          message: err instanceof Error ? err.message : String(err),
          severity: SystemAlertSeverity.WARNING,
          source: SystemAlertSource.REPORT,
          entityType: 'report_job',
          entityId: jobId,
          runbookKey: 'report-worker-stuck',
        });
        const job = await this.prisma.reportJob.findUnique({
          where: { id: jobId },
          select: { type: true },
        });
        void this.notificationEvents.reportJobFailed({
          jobId,
          reportType: job?.type ?? 'report',
        });
      }
    }
    return processed;
  }

  /** Reset timed-out RUNNING jobs or mark FAILED when max attempts exceeded. */
  async recoverStuckJobs(): Promise<number> {
    const timeoutMs = reportRunningTimeoutMs();
    const stuckBefore = new Date(Date.now() - timeoutMs);
    const maxAttempts = reportMaxAttempts();

    const stuck = await this.prisma.reportJob.findMany({
      where: {
        status: ReportJobStatus.RUNNING,
        OR: [
          { startedAt: { lt: stuckBefore } },
          { startedAt: null, lockedAt: { lt: stuckBefore } },
          { startedAt: null, lockedAt: null, createdAt: { lt: stuckBefore } },
        ],
      },
      select: { id: true, attemptCount: true, maxAttempts: true },
      take: 20,
    });

    let recovered = 0;
    for (const job of stuck) {
      const attempts = job.attemptCount;
      const limit = job.maxAttempts || maxAttempts;
      if (attempts >= limit) {
        await this.reports.markJobFailed(
          job.id,
          `Exceeded max attempts (${limit}) after worker timeout`,
        );
        void this.alerts.createIfNotOpen({
          code: 'REPORT_JOB_STUCK',
          title: 'Report job stuck and failed',
          message: `Job ${job.id} exceeded max attempts after worker timeout`,
          severity: SystemAlertSeverity.CRITICAL,
          source: SystemAlertSource.REPORT,
          entityType: 'report_job',
          entityId: job.id,
          runbookKey: 'report-worker-stuck',
        });
      } else {
        await this.prisma.reportJob.update({
          where: { id: job.id },
          data: {
            status: ReportJobStatus.QUEUED,
            lockedAt: null,
            lockedBy: null,
            startedAt: null,
            errorMessage: null,
          },
        });
        this.logger.warn(`Recovered stuck report job ${job.id} → QUEUED`);
      }
      recovered += 1;
    }
    return recovered;
  }

  /** Mark completed reports past expires_at as EXPIRED and purge storage. */
  async expireCompletedJobs(): Promise<number> {
    const now = new Date();
    const expired = await this.prisma.reportJob.findMany({
      where: {
        status: ReportJobStatus.COMPLETED,
        expiresAt: { lte: now },
      },
      select: { id: true, storageKey: true },
      take: 50,
    });

    for (const job of expired) {
      await this.reports.expireJob(job.id, job.storageKey);
    }
    return expired.length;
  }

  private async claimNextJobId(): Promise<string | null> {
    const maxAttempts = reportMaxAttempts();
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM report_jobs
        WHERE status = ${ReportJobStatus.QUEUED}::report_job_status
          AND attempt_count < COALESCE(max_attempts, ${maxAttempts})
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      const id = rows[0]?.id;
      if (!id) return null;

      const now = new Date();
      await tx.reportJob.update({
        where: { id },
        data: {
          status: ReportJobStatus.RUNNING,
          lockedAt: now,
          lockedBy: this.workerId,
          startedAt: now,
          attemptCount: { increment: 1 },
        },
      });

      return id;
    });
  }
}
