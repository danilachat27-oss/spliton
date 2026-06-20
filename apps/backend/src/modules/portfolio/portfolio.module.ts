import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarketModule } from '../market/market.module';
import { WalletsModule } from '../wallets/wallets.module';
import { PortfolioController } from './portfolio.controller';
import { PortfolioPositionsService } from './portfolio-positions.service';
import { PortfolioPricingService } from './portfolio-pricing.service';
import { PortfolioService } from './portfolio.service';
import { PortfolioChartsService } from './portfolio-charts.service';

@Module({
  imports: [PrismaModule, MarketModule, WalletsModule],
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    PortfolioPositionsService,
    PortfolioPricingService,
    PortfolioChartsService,
  ],
  exports: [PortfolioService, PortfolioPositionsService],
})
export class PortfolioModule {}
