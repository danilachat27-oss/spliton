import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PublicStatusController } from './public-status.controller';
import { PublicStatusService } from './public-status.service';
import { SystemStatusHealthSyncService } from './system-status-health-sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicStatusController],
  providers: [PublicStatusService, SystemStatusHealthSyncService],
})
export class StatusModule {}
