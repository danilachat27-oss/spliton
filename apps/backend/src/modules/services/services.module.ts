import { Module } from '@nestjs/common';
import { CacheModule } from '../../common/cache/cache.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlatformPublicModule } from '../platform/platform-public.module';
import { ServicesCalculatorController } from './calculator/services-calculator.controller';
import { ServicesCalculatorService } from './calculator/services-calculator.service';

@Module({
  imports: [PrismaModule, CacheModule, PlatformPublicModule],
  controllers: [ServicesCalculatorController],
  providers: [ServicesCalculatorService],
})
export class ServicesModule {}
