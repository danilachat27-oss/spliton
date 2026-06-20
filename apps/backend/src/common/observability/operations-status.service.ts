import { Injectable } from '@nestjs/common';
import {
  DepositStatus,
  DepositWatcherStatus,
  ReportJobStatus,
  SystemAlertSeverity,
  SystemAlertStatus,
  SystemIncidentStatus,
  WithdrawalStatus,
} from '@prisma/client';
import { reportRunningTimeoutMs } from '../../modules/admin/common/report-job.util';
import { PrismaService } from '../../prisma/prisma.service';
import { DepositIngestionService } from '../../modules/deposit-ingestion/deposit-ingestion.service';
import { sanitizeErrorMessage } from './log-sanitizer';

@Injectable()
export class OperationsStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly depositIngestion: DepositIngestionService,
  ) {}

  async getDepositWorkerStatus() {
    try {
      return await this.loadDepositWorkerStatus();
    } catch (error) {
      return this.workerStatusError('deposit_ingestion', error);
    }
  }

  private async loadDepositWorkerStatus() {
    const enabled = process.env.DEPOSIT_INGESTION_ENABLED === 'true';
    const watcher = await this.prisma.depositWatcherState.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    const provider = await this.depositIngestion.providerHealth();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedLogs = await this.prisma.depositIngestionLog.count({
      where: {
        action: { contains: 'error' },
        createdAt: { gte: since24h },
      },
    });
    const stuckDeposits = await this.prisma.deposit.count({
      where: {
        status: {
          in: [DepositStatus.DETECTED, DepositStatus.PENDING_CONFIRMATIONS],
        },
        createdAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      },
    });

    return {
      workerEnabled: enabled,
      providerMode: provider.mode,
      providerOk: provider.ok,
      providerMessage: provider.message ?? null,
      lastScannedBlock: watcher?.lastScannedBlock?.toString() ?? null,
      lastRunAt: watcher?.lastRunAt?.toISOString() ?? null,
      watcherStatus: watcher?.status ?? DepositWatcherStatus.DISABLED,
      lastError: watcher?.lastError ?? null,
      failedEventsLast24h: failedLogs,
      stuckDeposits,
      healthy: enabled
        ? provider.ok && watcher?.status !== DepositWatcherStatus.ERROR
        : true,
    };
  }

  async getReportWorkerStatus() {
    try {
      return await this.loadReportWorkerStatus();
    } catch (error) {
      return this.workerStatusError('report_worker', error);
    }
  }

  private async loadReportWorkerStatus() {
    const enabled = process.env.REPORT_WORKER_ENABLED === 'true';
    const storageMode = process.env.REPORT_STORAGE_MODE ?? 'db';
    const stuckThreshold = new Date(Date.now() - reportRunningTimeoutMs());
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [queued, processing, stuck, failedRecent, lastCompleted] =
      await Promise.all([
        this.prisma.reportJob.count({
          where: { status: ReportJobStatus.QUEUED },
        }),
        this.prisma.reportJob.count({
          where: { status: ReportJobStatus.RUNNING },
        }),
        this.prisma.reportJob.count({
          where: {
            status: ReportJobStatus.RUNNING,
            OR: [
              { startedAt: { lt: stuckThreshold } },
              { startedAt: null, lockedAt: { lt: stuckThreshold } },
            ],
          },
        }),
        this.prisma.reportJob.count({
          where: {
            status: ReportJobStatus.FAILED,
            createdAt: { gte: since24h },
          },
        }),
        this.prisma.reportJob.findFirst({
          where: { status: ReportJobStatus.COMPLETED },
          orderBy: { completedAt: 'desc' },
          select: { id: true, completedAt: true },
        }),
      ]);

    return {
      workerEnabled: enabled,
      storageMode,
      queued,
      processing,
      stuckProcessing: stuck,
      failedLast24h: failedRecent,
      lastProcessedJobId: lastCompleted?.id ?? null,
      lastProcessedAt: lastCompleted?.completedAt?.toISOString() ?? null,
      healthy: !enabled || (stuck === 0 && failedRecent < 50),
    };
  }

  async getFinanceSignals() {
    try {
      return await this.loadFinanceSignals();
    } catch (error) {
      return {
        stuckWithdrawals: 0,
        latestReconciliation: null,
        openCriticalAlerts: 0,
        openIncidents: 0,
        degraded: true,
        message: sanitizeWorkerError(error),
      };
    }
  }

  private async loadFinanceSignals() {
    const stuckWithdrawals = await this.prisma.withdrawal.count({
      where: {
        status: { in: [WithdrawalStatus.PROCESSING, WithdrawalStatus.LOCKED] },
        updatedAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    const latestRecon = await this.prisma.walletReconciliationRun.findFirst({
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        discrepancyCount: true,
        dryRun: true,
        status: true,
      },
    });
    const openCriticalAlerts = await this.prisma.systemAlert.count({
      where: {
        severity: SystemAlertSeverity.CRITICAL,
        status: {
          in: [SystemAlertStatus.OPEN, SystemAlertStatus.ACKNOWLEDGED],
        },
      },
    });
    const openIncidents = await this.prisma.systemStatusIncident.count({
      where: { status: { not: SystemIncidentStatus.RESOLVED } },
    });

    return {
      stuckWithdrawals,
      latestReconciliation: latestRecon
        ? {
            id: latestRecon.id,
            startedAt: latestRecon.startedAt.toISOString(),
            completedAt: latestRecon.completedAt?.toISOString() ?? null,
            discrepancyCount: latestRecon.discrepancyCount,
            dryRun: latestRecon.dryRun,
            status: latestRecon.status,
          }
        : null,
      openCriticalAlerts,
      openIncidents,
    };
  }

  async getOverview() {
    const [depositWorker, reportWorker, finance] = await Promise.all([
      this.getDepositWorkerStatus(),
      this.getReportWorkerStatus(),
      this.getFinanceSignals(),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      depositIngestion: depositWorker,
      reportWorker,
      finance,
    };
  }

  private workerStatusError(worker: string, error: unknown) {
    return {
      workerEnabled: false,
      healthy: false,
      degraded: true,
      worker,
      message: sanitizeWorkerError(error),
    };
  }
}

function sanitizeWorkerError(error: unknown): string {
  return sanitizeErrorMessage(
    error instanceof Error ? error.message : String(error),
  );
}
