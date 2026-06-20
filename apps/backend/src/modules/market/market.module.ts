import { Module } from '@nestjs/common';
import { CacheModule } from '../../common/cache/cache.module';
import { PlatformModule } from '../../common/platform/platform.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletsModule } from '../wallets/wallets.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { PlatformFeeLedgerService } from '../admin/common/platform-fee-ledger.service';
import { WalletLedgerService } from '../admin/common/wallet-ledger.service';
import { LedgerPostingService } from '../admin/common/ledger-posting.service';
import { MarketOverviewController } from './market-overview.controller';
import { MarketOverviewService } from './market-overview.service';
import { UserMarketController } from './user-market.controller';
import { UserMarketService } from './user-market.service';
import { UserOrdersController } from './user-orders.controller';
import { PrimaryOrderService } from './primary-order.service';
import { SecondaryMarketEnrichmentService } from './secondary-market-enrichment.service';
import { SecondaryMarketMarketDataService } from './secondary-market-market-data.service';
import { SecondaryMarketResolveService } from './secondary-market-resolve.service';
import { MarketChartsController } from './market-charts.controller';
import { MarketChartsService } from './market-charts.service';
import { ListingExpiryService } from './listing-expiry.service';

@Module({
  imports: [PlatformModule, PrismaModule, CacheModule, WalletsModule, ComplianceModule, NotificationsModule, ReferralsModule],
  controllers: [
    UserOrdersController,
    UserMarketController,
    MarketOverviewController,
    MarketChartsController,
  ],
  providers: [
    MarketOverviewService,
    UserMarketService,
    PrimaryOrderService,
    SecondaryMarketEnrichmentService,
    SecondaryMarketMarketDataService,
    SecondaryMarketResolveService,
    MarketChartsService,
    ListingExpiryService,
    LedgerPostingService,
    WalletLedgerService,
    PlatformFeeLedgerService,
  ],
  exports: [
    UserMarketService,
    PrimaryOrderService,
    SecondaryMarketEnrichmentService,
    MarketOverviewService,
  ],
})
export class MarketModule {}
