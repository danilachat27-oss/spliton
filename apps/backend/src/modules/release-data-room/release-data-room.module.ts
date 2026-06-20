import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserAnalyticsModule } from '../user-analytics/user-analytics.module';
import { ReleaseDataRoomController } from './release-data-room.controller';
import { ReleaseDataRoomService } from './release-data-room.service';
import { ReleaseDetailController } from './release-detail.controller';

@Module({
  imports: [PrismaModule, AuthModule, UserAnalyticsModule],
  controllers: [ReleaseDataRoomController, ReleaseDetailController],
  providers: [ReleaseDataRoomService],
  exports: [ReleaseDataRoomService],
})
export class ReleaseDataRoomModule {}
