import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AppLocale } from '@prisma/client';
import { normalizeAppLocale } from '../../common/i18n/app-locale';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { UserAnalyticsPeriodQueryDto } from '../user-analytics/dto/user-analytics-period-query.dto';
import { UserAnalyticsService } from '../user-analytics/user-analytics.service';

@Controller('api/v1/releases')
export class ReleaseDetailController {
  constructor(private readonly analytics: UserAnalyticsService) {}

  @Get(':id/detail')
  @UseGuards(OptionalJwtAuthGuard)
  detail(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null,
    @Query('locale') locale?: string,
  ) {
    return this.analytics.getFullDetail(
      id,
      user?.id ?? null,
      this.parseLocale(locale),
    );
  }

  @Get(':id/charts/price')
  @UseGuards(OptionalJwtAuthGuard)
  priceChart(@Param('id') id: string, @Query() query: UserAnalyticsPeriodQueryDto) {
    return this.analytics.getPerformance(id, query.period ?? '30d');
  }

  @Get(':id/my-history')
  @UseGuards(JwtAuthGuard)
  myHistory(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.analytics.getMyHistory(id, user.id);
  }

  private parseLocale(raw?: string): AppLocale {
    return normalizeAppLocale(raw);
  }
}
