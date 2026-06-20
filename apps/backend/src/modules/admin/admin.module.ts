import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AuthModule } from '../auth/auth.module';
import { ExportModule } from '../../common/export/export.module';
import { HeavyRouteTimeoutInterceptor } from '../../common/interceptors/heavy-route-timeout.interceptor';

import { PrismaModule } from '../../prisma/prisma.module';
import { MarketModule } from '../market/market.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { LegalModule } from '../legal/legal.module';
import { TreasuryModule } from '../treasury/treasury.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReleaseApprovalService } from '../release-approval/release-approval.service';
import { AdminReleaseApprovalController } from '../release-approval/admin-release-approval.controller';
import { AdminOperatorSlaController } from './v1/admin-operator-sla.controller';
import { OperatorSlaModule } from '../operator-sla/operator-sla.module';

import { RolesGuard } from '../auth/guards/roles.guard';

import { AdminController } from './admin.controller';

import { AdminV1Controller } from './admin-v1.controller';

import { AdminAuditService } from './common/admin-audit.service';

import { WalletLedgerService } from './common/wallet-ledger.service';
import { LedgerPostingService } from './common/ledger-posting.service';
import { WalletReconciliationService } from './common/wallet-reconciliation.service';
import { AdminLedgerReconciliationController } from './v1/admin-ledger-reconciliation.controller';
import { ReportStorageService } from './common/report-storage.service';
import { ReportWorkerService } from './common/report-worker.service';
import { SupabaseStorageService } from './common/supabase-storage.service';
import { MediaStorageService } from './common/media-storage.service';

import { AdminUsersController } from './v1/admin-users.controller';

import { AdminUsersService } from './v1/admin-users.service';

import { AdminDepositsController } from './v1/admin-deposits.controller';

import { AdminDepositsService } from './v1/admin-deposits.service';

import { AdminDepositSettlementService } from './v1/admin-deposit-settlement.service';

import { AdminWithdrawalsController } from './v1/admin-withdrawals.controller';

import { AdminWithdrawalsService } from './v1/admin-withdrawals.service';

import { AdminWithdrawalSettlementService } from './v1/admin-withdrawal-settlement.service';

import {
  AdminWalletsController,
  AdminUserWalletController,
} from './v1/admin-wallets.controller';

import { AdminWalletsService } from './v1/admin-wallets.service';

import { AdminAuditLogsController } from './v1/admin-audit-logs.controller';

import { AdminAuditLogsService } from './v1/admin-audit-logs.service';

import {
  AdminRevenueEventsController,
  AdminDistributionsController,
} from './v1/admin-revenue.controller';

import { AdminRevenueService } from './v1/admin-revenue.service';

import {
  AdminListingsController,
  AdminSecondaryMarketOverviewController,
  AdminTradesController,
} from './v1/admin-secondary-market.controller';

import { AdminSecondaryMarketService } from './v1/admin-secondary-market.service';

import {
  AdminPlatformFeesController,
  AdminPlatformRevenueController,
} from './v1/admin-platform-revenue.controller';

import { AdminPlatformRevenueService } from './v1/admin-platform-revenue.service';

import { AdminReportsController } from './v1/admin-reports.controller';

import { AdminReportsService } from './v1/admin-reports.service';

import {
  AdminHoldingsController,
  AdminUserTrackHoldingsController,
} from './v1/admin-holdings.controller';

import { AdminHoldingsService } from './v1/admin-holdings.service';

import { AdminSearchController } from './v1/admin-search.controller';

import { AdminSearchService } from './v1/admin-search.service';

import { AdminDashboardController } from './v1/admin-dashboard.controller';

import { AdminDashboardService } from './v1/admin-dashboard.service';

import { AdminArtistsController } from './v1/admin-artists.controller';
import { AdminReleaseGenresController } from './v1/admin-release-genres.controller';
import { AdminLabelsController } from './v1/admin-labels.controller';
import { AdminTracksController } from './v1/admin-tracks.controller';
import { AdminReleaseFaqController } from './v1/admin-release-faq.controller';

import { AdminUploadsController } from './v1/admin-uploads.controller';

import { AdminArtistsService } from './v1/admin-artists.service';
import { AdminReleaseGenresService } from './v1/admin-release-genres.service';
import { AdminLabelsService } from './v1/admin-labels.service';
import { AdminTracksService } from './v1/admin-tracks.service';
import { AdminReleaseFaqService } from './v1/admin-release-faq.service';

import { AdminRoundsController } from './v1/admin-rounds.controller';

import { AdminRoundsService } from './v1/admin-rounds.service';

import { AdminOrdersController } from './v1/admin-orders.controller';

import { AdminSupportController } from './v1/admin-support.controller';

import { AdminSupportService } from './v1/admin-support.service';

import { AdminDisputesController } from './v1/admin-disputes.controller';

import { AdminDisputesService } from './v1/admin-disputes.service';

import { AdminFinancialRulesController } from './v1/admin-financial-rules.controller';

import { AdminFinancialRulesService } from './v1/admin-financial-rules.service';

import { AdminNewsController } from './v1/admin-news.controller';

import { AdminNewsService } from './v1/admin-news.service';

import { AdminHelpCenterController } from './v1/admin-help-center.controller';

import { AdminHelpCenterService } from './v1/admin-help-center.service';

import { AdminSystemStatusController } from './v1/admin-system-status.controller';

import { AdminSystemStatusService } from './v1/admin-system-status.service';

import { AdminSystemAnnouncementsController } from './v1/admin-system-announcements.controller';

import { AdminSystemAnnouncementsService } from './v1/admin-system-announcements.service';

import { AdminObservabilityController } from './v1/admin-observability.controller';

import { AdminComplianceController } from './v1/admin-compliance.controller';

import { AdminComplianceService } from './v1/admin-compliance.service';

import { AdminRolesController } from './v1/admin-roles.controller';

import { AdminRolesService } from './v1/admin-roles.service';

import { AdminAccessService } from './admin-access.service';

import {
  AdminAnalyticsFinanceController,
  AdminAnalyticsMarketController,
  AdminAnalyticsOverviewController,
  AdminAnalyticsRevenueController,
  AdminAnalyticsRiskController,
  AdminAnalyticsSupportController,
  AdminAnalyticsTracksController,
  AdminAnalyticsUsersController,
} from './v1/analytics/admin-analytics.controller';

import {
  AdminAnalyticsFinanceService,
  AdminAnalyticsUsersService,
} from './v1/analytics/admin-analytics-finance-users.service';

import {
  AdminAnalyticsMarketService,
  AdminAnalyticsTracksService,
} from './v1/analytics/admin-analytics-tracks-market.service';

import {
  AdminAnalyticsRevenueService,
  AdminAnalyticsRiskService,
  AdminAnalyticsSupportService,
} from './v1/analytics/admin-analytics-revenue-risk-support.service';

@Module({
  imports: [
    ExportModule,
    AuthModule,
    PrismaModule,
    MarketModule,
    ComplianceModule,
    LegalModule,
    TreasuryModule,
    NotificationsModule,
    OperatorSlaModule,
  ],

  controllers: [
    AdminController,

    AdminV1Controller,

    AdminUsersController,

    AdminDepositsController,

    AdminWithdrawalsController,

    AdminWalletsController,

    AdminUserWalletController,

    AdminLedgerReconciliationController,

    AdminAuditLogsController,

    AdminRevenueEventsController,

    AdminDistributionsController,

    AdminPlatformRevenueController,

    AdminPlatformFeesController,

    AdminSecondaryMarketOverviewController,

    AdminListingsController,

    AdminTradesController,

    AdminReportsController,

    AdminHoldingsController,

    AdminUserTrackHoldingsController,

    AdminSearchController,

    AdminDashboardController,

    AdminTracksController,

    AdminReleaseFaqController,

    AdminArtistsController,

    AdminReleaseGenresController,

    AdminLabelsController,

    AdminUploadsController,

    AdminRoundsController,

    AdminOrdersController,

    AdminSupportController,

    AdminDisputesController,

    AdminFinancialRulesController,

    AdminNewsController,

    AdminHelpCenterController,

    AdminSystemStatusController,

    AdminSystemAnnouncementsController,

    AdminReleaseApprovalController,

    AdminOperatorSlaController,

    AdminObservabilityController,

    AdminComplianceController,

    AdminRolesController,

    AdminAnalyticsOverviewController,

    AdminAnalyticsFinanceController,

    AdminAnalyticsUsersController,

    AdminAnalyticsTracksController,

    AdminAnalyticsMarketController,

    AdminAnalyticsRevenueController,

    AdminAnalyticsRiskController,

    AdminAnalyticsSupportController,
  ],

  providers: [
    RolesGuard,

    AdminAuditService,

    WalletLedgerService,
    LedgerPostingService,
    WalletReconciliationService,
    SupabaseStorageService,
    MediaStorageService,
    ReportStorageService,
    ReportWorkerService,

    AdminUsersService,

    AdminDepositsService,

    AdminDepositSettlementService,

    AdminWithdrawalsService,

    AdminWithdrawalSettlementService,

    AdminWalletsService,

    AdminAuditLogsService,

    AdminRevenueService,

    AdminSecondaryMarketService,

    AdminPlatformRevenueService,

    AdminReportsService,

    AdminHoldingsService,

    AdminSearchService,

    AdminDashboardService,

    AdminTracksService,

    AdminReleaseFaqService,

    AdminArtistsService,

    AdminReleaseGenresService,

    AdminLabelsService,

    AdminRoundsService,

    AdminSupportService,

    AdminDisputesService,

    AdminFinancialRulesService,

    AdminNewsService,

    AdminHelpCenterService,

    AdminSystemStatusService,

    AdminSystemAnnouncementsService,

    ReleaseApprovalService,

    AdminComplianceService,

    AdminRolesService,

    AdminAccessService,

    AdminAnalyticsFinanceService,

    AdminAnalyticsUsersService,

    AdminAnalyticsTracksService,

    AdminAnalyticsMarketService,

    AdminAnalyticsRevenueService,

    AdminAnalyticsRiskService,

    AdminAnalyticsSupportService,

    {
      provide: APP_INTERCEPTOR,
      useClass: HeavyRouteTimeoutInterceptor,
    },
  ],
})
export class AdminModule {}
