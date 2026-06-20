import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';

import { PublicHelpCenterController } from './public-help-center.controller';
import { PublicHelpCenterService } from './public-help-center.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicHelpCenterController],
  providers: [PublicHelpCenterService],
  exports: [PublicHelpCenterService],
})
export class HelpCenterModule {}
