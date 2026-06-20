import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ErrorTrackingService } from './error-tracking.service';
import { SystemAlertService } from './system-alert.service';

/**
 * Alerts + error tracking without deposit-ingestion / treasury cycles.
 * Treasury and other finance modules import this instead of ObservabilityModule.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [ErrorTrackingService, SystemAlertService],
  exports: [ErrorTrackingService, SystemAlertService],
})
export class SystemAlertsModule {}
