import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { WalletActivityQueryDto } from '../wallets/dto/wallet-activity-query.dto';
import { WalletActivityService } from '../wallets/wallet-activity.service';
import { PortfolioChartQueryDto } from './dto/portfolio-chart-query.dto';
import { PortfolioPayoutsCompareQueryDto } from './dto/portfolio-payouts-compare-query.dto';
import { PortfolioPositionsQueryDto } from './dto/portfolio-positions-query.dto';
import { PortfolioService } from './portfolio.service';
import { PortfolioChartsService } from './portfolio-charts.service';

@Controller('api/v1/portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(
    private readonly portfolio: PortfolioService,
    private readonly walletActivity: WalletActivityService,
    private readonly portfolioCharts: PortfolioChartsService,
  ) {}

  @Get('payouts/overview')
  payoutsOverview(@CurrentUser() user: AuthUser) {
    return this.portfolio.getPayoutsOverview(user.id);
  }

  @Get('payouts/compare')
  payoutsCompare(
    @CurrentUser() user: AuthUser,
    @Query() query: PortfolioPayoutsCompareQueryDto,
  ) {
    return this.portfolioCharts.getPayoutsCompare(user.id, query.window);
  }

  @Get('payouts/history')
  payoutsHistory(
    @CurrentUser() user: AuthUser,
    @Query() query: WalletActivityQueryDto,
  ) {
    return this.walletActivity.list(user.id, {
      ...query,
      kind: query.kind ?? 'payouts',
      page: query.page ?? 1,
      pageSize: query.pageSize ?? query.limit ?? 20,
    });
  }

  @Get('overview')
  getOverview(@CurrentUser() user: AuthUser) {
    return this.portfolio.getOverview(user.id);
  }

  @Get('positions')
  getPositions(
    @CurrentUser() user: AuthUser,
    @Query() query: PortfolioPositionsQueryDto,
  ) {
    return this.portfolio.getPositions(user.id, query);
  }

  @Get('metrics')
  getMetrics(@CurrentUser() user: AuthUser) {
    return this.portfolio.getMetrics(user.id);
  }

  @Get('metrics/overview')
  metricsOverview(@CurrentUser() user: AuthUser) {
    return this.portfolio.getMetrics(user.id);
  }

  @Get('metrics/performance')
  metricsPerformance(@CurrentUser() user: AuthUser) {
    return this.portfolio.getMetrics(user.id).then((m) => ({
      performance: m.performance,
      overview: m.overview,
      updatedAt: m.updatedAt,
    }));
  }

  @Get('metrics/timeseries')
  metricsTimeseries(
    @CurrentUser() user: AuthUser,
    @Query() query: PortfolioChartQueryDto,
  ) {
    return this.portfolioCharts.getValueChart(user.id, query.period);
  }

  @Get('metrics/payouts')
  metricsPayouts(
    @CurrentUser() user: AuthUser,
    @Query() query: PortfolioChartQueryDto,
  ) {
    return this.portfolioCharts.getPayoutsChart(user.id, query.period);
  }

  @Get('metrics/allocation')
  metricsAllocation(@CurrentUser() user: AuthUser) {
    return this.portfolioCharts.getAllocation(user.id);
  }

  @Get('metrics/positions')
  metricsPositions(
    @CurrentUser() user: AuthUser,
    @Query() query: PortfolioPositionsQueryDto,
  ) {
    return this.portfolio.getPositions(user.id, query);
  }

  @Get('charts/value')
  chartValue(
    @CurrentUser() user: AuthUser,
    @Query() query: PortfolioChartQueryDto,
  ) {
    return this.portfolioCharts.getValueChart(user.id, query.period);
  }

  @Get('charts/payouts')
  chartPayouts(
    @CurrentUser() user: AuthUser,
    @Query() query: PortfolioChartQueryDto,
  ) {
    return this.portfolioCharts.getPayoutsChart(user.id, query.period);
  }

  @Get('charts/allocation')
  chartAllocation(@CurrentUser() user: AuthUser) {
    return this.portfolioCharts.getAllocation(user.id);
  }

  @Get('activity')
  getActivity(
    @CurrentUser() user: AuthUser,
    @Query() query: WalletActivityQueryDto,
  ) {
    return this.walletActivity.list(user.id, {
      ...query,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 100,
    });
  }
}
