import { Module } from '@nestjs/common';
import { PlatformModule } from '../../common/platform/platform.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarketModule } from '../market/market.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { UserAnalyticsController } from './user-analytics.controller';
import { UserAnalyticsResolveService } from './user-analytics-resolve.service';
import { UserAnalyticsService } from './user-analytics.service';

@Module({
  imports: [PrismaModule, PlatformModule, MarketModule, PortfolioModule],
  controllers: [UserAnalyticsController],
  providers: [UserAnalyticsService, UserAnalyticsResolveService],
  exports: [UserAnalyticsService],
})
export class UserAnalyticsModule {}
