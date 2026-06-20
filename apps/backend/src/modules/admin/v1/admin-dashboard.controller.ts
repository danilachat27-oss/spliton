import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { AdminAnalyticsQueryDto } from '../common/dto/admin-analytics-query.dto';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('api/admin/v1/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.dashboard.summary(user.roles, query);
  }

  @Get('tasks')
  tasks(@CurrentUser() user: AuthUser) {
    return this.dashboard.tasks(user.roles);
  }

  @Get('risk-alerts')
  riskAlerts(@CurrentUser() user: AuthUser) {
    return this.dashboard.riskAlerts(user.roles);
  }

  @Get('recent-actions')
  recentActions(@CurrentUser() user: AuthUser) {
    return this.dashboard.recentActions(user.roles);
  }

  @Get('recent-deposits')
  recentDeposits(@CurrentUser() user: AuthUser) {
    return this.dashboard.recentDeposits(user.roles);
  }

  @Get('recent-withdrawals')
  recentWithdrawals(@CurrentUser() user: AuthUser) {
    return this.dashboard.recentWithdrawals(user.roles);
  }

  @Get('trends')
  trends(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.dashboard.trends(user.roles, query);
  }
}
