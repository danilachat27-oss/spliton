import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import {
  AnalyticsReleasesListQueryDto,
  AnalyticsReleasesOverviewQueryDto,
} from './dto/analytics-releases-list-query.dto';
import {
  AnalyticsReleasesCompareQueryDto,
  AnalyticsReleasesPeriodQueryDto,
} from './dto/analytics-releases-period-query.dto';
import { UserAnalyticsPeriodQueryDto } from './dto/user-analytics-period-query.dto';
import { UserAnalyticsService } from './user-analytics.service';

@Controller('api/v1/analytics/releases')
export class UserAnalyticsController {
  constructor(private readonly analytics: UserAnalyticsService) {}

  @Get('overview')
  overview(@Query() query: AnalyticsReleasesOverviewQueryDto) {
    return this.analytics.getReleasesOverview(query.period ?? '30d');
  }

  @Get('timeseries')
  timeseries(@Query() query: AnalyticsReleasesPeriodQueryDto) {
    return this.analytics.getReleasesTimeseries(query.period ?? '30d');
  }

  @Get('table')
  @UseGuards(OptionalJwtAuthGuard)
  table(
    @Query() query: AnalyticsReleasesListQueryDto,
    @CurrentUser() user: AuthUser | null,
  ) {
    return this.analytics.searchReleases(query, user?.id ?? null);
  }

  @Get('compare')
  compare(@Query() query: AnalyticsReleasesCompareQueryDto) {
    return this.analytics.getReleasesCompare(query.period ?? '30d', query.limit ?? 8);
  }

  @Get('genres')
  genres(@Query() query: AnalyticsReleasesPeriodQueryDto) {
    return this.analytics.getReleasesGenres(query.period ?? '30d');
  }

  @Get('funnel')
  funnel(@Query() query: AnalyticsReleasesPeriodQueryDto) {
    return this.analytics.getReleasesFunnel(query.period ?? '30d');
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Query() query: AnalyticsReleasesListQueryDto,
    @CurrentUser() user: AuthUser | null,
  ) {
    return this.analytics.searchReleases(query, user?.id ?? null);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  detail(@Param('id') id: string, @CurrentUser() user: AuthUser | null) {
    return this.analytics.getDetail(id, user?.id ?? null);
  }

  @Get(':id/performance')
  @UseGuards(OptionalJwtAuthGuard)
  performance(
    @Param('id') id: string,
    @Query() query: UserAnalyticsPeriodQueryDto,
  ) {
    return this.analytics.getPerformance(id, query.period ?? '30d');
  }

  @Get(':id/payouts')
  @UseGuards(OptionalJwtAuthGuard)
  payouts(@Param('id') id: string, @CurrentUser() user: AuthUser | null) {
    return this.analytics.getPayouts(id, user?.id ?? null);
  }

  @Get(':id/market')
  @UseGuards(OptionalJwtAuthGuard)
  market(@Param('id') id: string) {
    return this.analytics.getMarket(id);
  }

  @Get(':id/ledger')
  @UseGuards(JwtAuthGuard)
  ledger(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.analytics.getLedger(id, user.id);
  }
}
