import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../../admin-panel-roles';
import { AdminAnalyticsQueryDto } from '../../common/dto/admin-analytics-query.dto';
import {
  AdminAnalyticsFinanceService,
  AdminAnalyticsUsersService,
} from './admin-analytics-finance-users.service';
import {
  AdminAnalyticsMarketService,
  AdminAnalyticsTracksService,
} from './admin-analytics-tracks-market.service';
import {
  AdminAnalyticsRevenueService,
  AdminAnalyticsRiskService,
  AdminAnalyticsSupportService,
} from './admin-analytics-revenue-risk-support.service';

const ANALYTICS_ROLES = ADMIN_PANEL_ROLE_CODES;

@Controller('api/admin/v1/analytics/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ANALYTICS_ROLES)
export class AdminAnalyticsFinanceController {
  constructor(private readonly finance: AdminAnalyticsFinanceService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.finance.summary(user.roles, query);
  }

  @Get('cashflow')
  cashflow(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.finance.cashflow(user.roles, query);
  }

  @Get('fees')
  fees(@CurrentUser() user: AuthUser, @Query() query: AdminAnalyticsQueryDto) {
    return this.finance.fees(user.roles, query);
  }

  @Get('withdrawal-processing')
  withdrawalProcessing(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.finance.withdrawalProcessing(user.roles, query);
  }

  @Get('failures')
  failures(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.finance.failures(user.roles, query);
  }
}

@Controller('api/admin/v1/analytics/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ANALYTICS_ROLES)
export class AdminAnalyticsUsersController {
  constructor(private readonly users: AdminAnalyticsUsersService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.users.summary(user.roles, query);
  }

  @Get('growth')
  growth(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.users.growth(user.roles, query);
  }

  @Get('funnel')
  funnel(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.users.funnel(user.roles, query);
  }

  @Get('segments')
  segments(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.users.segments(user.roles, query);
  }

  @Get('top-holders')
  topHolders(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.users.topHolders(user.roles, query);
  }

  @Get('financial-segments')
  financialSegments(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.users.financialSegments(user.roles, query);
  }

  @Get('dormant')
  dormant(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.users.dormant(user.roles, query);
  }

  @Get('risk-users')
  riskUsers(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.users.riskUsers(user.roles, query);
  }
}

@Controller('api/admin/v1/analytics/tracks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ANALYTICS_ROLES)
export class AdminAnalyticsTracksController {
  constructor(private readonly tracks: AdminAnalyticsTracksService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.tracks.summary(user.roles, query);
  }

  @Get('round-progress')
  roundProgress(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.tracks.roundProgress(user.roles, query);
  }

  @Get('revenue')
  revenue(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.tracks.revenue(user.roles, query);
  }

  @Get('holders')
  holders(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.tracks.holders(user.roles, query);
  }

  @Get('secondary-activity')
  secondaryActivity(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.tracks.secondaryActivity(user.roles, query);
  }

  @Get('units')
  units(@CurrentUser() user: AuthUser, @Query() query: AdminAnalyticsQueryDto) {
    return this.tracks.units(user.roles, query);
  }

  @Get('readiness')
  readiness(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.tracks.readiness(user.roles, query);
  }

  @Get('top')
  top(@CurrentUser() user: AuthUser, @Query() query: AdminAnalyticsQueryDto) {
    return this.tracks.top(user.roles, query);
  }
}

@Controller('api/admin/v1/analytics/market')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ANALYTICS_ROLES)
export class AdminAnalyticsMarketController {
  constructor(private readonly market: AdminAnalyticsMarketService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.market.summary(user.roles, query);
  }

  @Get('volume')
  volume(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.market.volume(user.roles, query);
  }

  @Get('listings')
  listings(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.market.listings(user.roles, query);
  }

  @Get('trades')
  trades(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.market.trades(user.roles, query);
  }

  @Get('top-users')
  topUsers(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.market.topUsers(user.roles, query);
  }

  @Get('fees')
  fees(@CurrentUser() user: AuthUser, @Query() query: AdminAnalyticsQueryDto) {
    return this.market.fees(user.roles, query);
  }

  @Get('depth')
  depth(@CurrentUser() user: AuthUser, @Query() query: AdminAnalyticsQueryDto) {
    return this.market.depth(user.roles, query);
  }

  @Get('liquidity')
  liquidity(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.market.liquidity(user.roles, query);
  }

  @Get('prices')
  prices(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.market.prices(user.roles, query);
  }

  @Get('risk')
  risk(@CurrentUser() user: AuthUser, @Query() query: AdminAnalyticsQueryDto) {
    return this.market.risk(user.roles, query);
  }
}

@Controller('api/admin/v1/analytics/revenue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ANALYTICS_ROLES)
export class AdminAnalyticsRevenueController {
  constructor(private readonly revenue: AdminAnalyticsRevenueService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.revenue.summary(user.roles, query);
  }

  @Get('events')
  events(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.revenue.events(user.roles, query);
  }

  @Get('distributions')
  distributions(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.revenue.distributions(user.roles, query);
  }

  @Get('by-track')
  byTrack(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.revenue.byTrack(user.roles, query);
  }

  @Get('payouts')
  payouts(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.revenue.payouts(user.roles, query);
  }

  @Get('pipeline')
  pipeline(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.revenue.pipeline(user.roles, query);
  }

  @Get('split')
  split(@CurrentUser() user: AuthUser, @Query() query: AdminAnalyticsQueryDto) {
    return this.revenue.split(user.roles, query);
  }

  @Get('top-holders')
  topHolders(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.revenue.topHolders(user.roles, query);
  }

  @Get('failed')
  failed(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.revenue.failed(user.roles, query);
  }

  @Get('reconciliation')
  reconciliation(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.revenue.reconciliation(user.roles, query);
  }
}

@Controller('api/admin/v1/analytics/risk')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ANALYTICS_ROLES)
export class AdminAnalyticsRiskController {
  constructor(private readonly risk: AdminAnalyticsRiskService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.risk.summary(user.roles, query);
  }

  @Get('by-severity')
  bySeverity(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.risk.bySeverity(user.roles, query);
  }

  @Get('by-type')
  byType(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.risk.byType(user.roles, query);
  }

  @Get('queue-aging')
  queueAging(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.risk.queueAging(user.roles, query);
  }

  @Get('high-value-operations')
  highValueOperations(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.risk.highValueOperations(user.roles, query);
  }

  @Get('queue')
  queue(@CurrentUser() user: AuthUser, @Query() query: AdminAnalyticsQueryDto) {
    return this.risk.queue(user.roles, query);
  }

  @Get('rules-performance')
  rulesPerformance(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.risk.rulesPerformance(user.roles, query);
  }

  @Get('repeat-offenders')
  repeatOffenders(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.risk.repeatOffenders(user.roles, query);
  }

  @Get('freeze-impact')
  freezeImpact(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.risk.freezeImpact(user.roles, query);
  }

  @Get('resolution-quality')
  resolutionQuality(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.risk.resolutionQuality(user.roles, query);
  }
}

@Controller('api/admin/v1/analytics/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ANALYTICS_ROLES)
export class AdminAnalyticsSupportController {
  constructor(private readonly support: AdminAnalyticsSupportService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.support.summary(user.roles, query);
  }

  @Get('by-status')
  byStatus(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.support.byStatus(user.roles, query);
  }

  @Get('by-category')
  byCategory(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.support.byCategory(user.roles, query);
  }

  @Get('response-time')
  responseTime(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.support.responseTime(user.roles, query);
  }

  @Get('by-manager')
  byManager(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.support.byManager(user.roles, query);
  }

  @Get('queue')
  queue(@CurrentUser() user: AuthUser, @Query() query: AdminAnalyticsQueryDto) {
    return this.support.queue(user.roles, query);
  }

  @Get('sla')
  sla(@CurrentUser() user: AuthUser, @Query() query: AdminAnalyticsQueryDto) {
    return this.support.sla(user.roles, query);
  }

  @Get('finance-related')
  financeRelated(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.support.financeRelated(user.roles, query);
  }

  @Get('escalations')
  escalations(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.support.escalations(user.roles, query);
  }

  @Get('workload')
  workload(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.support.workload(user.roles, query);
  }

  @Get('resolution-quality')
  resolutionQuality(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.support.resolutionQuality(user.roles, query);
  }

  @Get('product-pain-points')
  productPainPoints(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.support.productPainPoints(user.roles, query);
  }
}

@Controller('api/admin/v1/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ANALYTICS_ROLES)
export class AdminAnalyticsOverviewController {
  constructor(
    private readonly finance: AdminAnalyticsFinanceService,
    private readonly users: AdminAnalyticsUsersService,
    private readonly tracks: AdminAnalyticsTracksService,
    private readonly market: AdminAnalyticsMarketService,
    private readonly revenue: AdminAnalyticsRevenueService,
    private readonly risk: AdminAnalyticsRiskService,
    private readonly support: AdminAnalyticsSupportService,
  ) {}

  @Get('overview')
  overview(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return Promise.all([
      this.finance.summary(user.roles, query),
      this.users.summary(user.roles, query),
      this.market.summary(user.roles, query),
      this.risk.summary(user.roles, query),
      this.support.summary(user.roles, query),
      this.tracks.summary(user.roles, query),
      this.revenue.summary(user.roles, query),
    ]).then(([finance, users, market, risk, support, tracks, revenue]) => ({
      finance,
      users,
      market,
      risk,
      support,
      tracks,
      revenue,
    }));
  }
}
