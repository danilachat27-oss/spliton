import { Injectable } from '@nestjs/common';
import { OperationsStatusService } from '../../observability/operations-status.service';
import { DataQualityService } from '../data-quality/data-quality.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class SafetyConsoleService {
  constructor(
    private readonly operations: OperationsStatusService,
    private readonly flags: FeatureFlagsService,
    private readonly dataQuality: DataQualityService,
    private readonly outbox: OutboxService,
  ) {}

  async getConsole() {
    const [operations, dataQuality, outbox] = await Promise.all([
      this.operations.getOverview(),
      this.dataQuality.runChecks(),
      this.outbox.getStats(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      liveMode: {
        nodeEnv: process.env.NODE_ENV ?? 'development',
        tronProvider: process.env.TRON_PROVIDER_MODE ?? 'mock',
        depositIngestion: process.env.DEPOSIT_INGESTION_ENABLED === 'true',
        reportWorker: process.env.REPORT_WORKER_ENABLED === 'true',
        emailProvider: process.env.EMAIL_PROVIDER ?? 'dev',
      },
      featureFlags: this.flags.snapshot(),
      operations,
      dataQuality,
      outbox,
      readiness: {
        dataQualityGreen: dataQuality.passed,
        outboxHealthy: outbox.deadLetter === 0,
        workersHealthy:
          (operations.depositIngestion as { healthy?: boolean }).healthy !==
            false &&
          (operations.reportWorker as { healthy?: boolean }).healthy !== false,
      },
    };
  }
}
