import { Global, Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DepositIngestionModule } from '../../modules/deposit-ingestion/deposit-ingestion.module';
import { SystemAlertsModule } from './system-alerts.module';
import { OperationsStatusService } from './operations-status.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    SystemAlertsModule,
    forwardRef(() => DepositIngestionModule),
  ],
  providers: [OperationsStatusService],
  exports: [SystemAlertsModule, OperationsStatusService],
})
export class ObservabilityModule {}
