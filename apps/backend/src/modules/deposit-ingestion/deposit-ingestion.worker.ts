import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SystemAlertSeverity, SystemAlertSource } from '@prisma/client';
import { ErrorTrackingService } from '../../common/observability/error-tracking.service';
import { SystemAlertService } from '../../common/observability/system-alert.service';
import { sanitizeErrorMessage } from '../../common/observability/log-sanitizer';
import { DepositIngestionService } from './deposit-ingestion.service';

@Injectable()
export class DepositIngestionWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DepositIngestionWorker.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly ingestion: DepositIngestionService,
    private readonly alerts: SystemAlertService,
    private readonly errorTracking: ErrorTrackingService,
  ) {}

  onModuleInit(): void {
    if (process.env.DEPOSIT_INGESTION_ENABLED !== 'true') return;
    const pollMs = Number(process.env.TRON_POLL_INTERVAL ?? 15000);
    this.timer = setInterval(
      () => void this.tick(),
      pollMs >= 5000 ? pollMs : 15000,
    );
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.ingestion.tick();
    } catch (error) {
      const message = sanitizeErrorMessage(
        error instanceof Error ? error.message : String(error),
      );
      this.logger.warn(
        JSON.stringify({ event: 'deposit_ingestion.tick_failed', message }),
      );
      this.errorTracking.captureException(error, {
        source: 'deposit_ingestion_worker',
      });
      void this.alerts.createIfNotOpen({
        code: 'DEPOSIT_INGESTION_TICK_FAILED',
        title: 'Deposit ingestion tick failed',
        message,
        severity: SystemAlertSeverity.CRITICAL,
        source: SystemAlertSource.WORKER,
        runbookKey: 'deposit-ingestion-down',
      });
    } finally {
      this.running = false;
    }
  }
}
