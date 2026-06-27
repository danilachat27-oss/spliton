import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminUpdatesController } from './admin-updates.controller';
import { AdminUpdatesService } from './admin-updates.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminUpdatesController],
  providers: [AdminUpdatesService],
  exports: [AdminUpdatesService],
})
export class AdminUpdatesModule {}
