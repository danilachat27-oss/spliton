import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarketAbuseService } from './market-abuse.service';

@Module({
  imports: [PrismaModule],
  providers: [MarketAbuseService],
  exports: [MarketAbuseService],
})
export class MarketAbuseModule {}
