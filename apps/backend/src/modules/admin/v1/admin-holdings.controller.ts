import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { AdminHoldingsQueryDto } from './dto/admin-holdings-query.dto';
import { AdminHoldingsService } from './admin-holdings.service';

@Controller('api/admin/v1/holdings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminHoldingsController {
  constructor(private readonly holdings: AdminHoldingsService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.holdings.summary(user.roles);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminHoldingsQueryDto) {
    return this.holdings.list(user.roles, query);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('include') include?: string,
  ) {
    return this.holdings.getById(user.roles, id, include);
  }
}

@Controller('api/admin/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminUserTrackHoldingsController {
  constructor(private readonly holdings: AdminHoldingsService) {}

  @Get('users/:userId/holdings')
  listByUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Query() query: AdminHoldingsQueryDto,
  ) {
    return this.holdings.listByUser(user.roles, userId, query);
  }

  @Get('tracks/:trackId/holdings')
  listByTrack(
    @CurrentUser() user: AuthUser,
    @Param('trackId') trackId: string,
    @Query() query: AdminHoldingsQueryDto,
  ) {
    return this.holdings.listByTrack(user.roles, trackId, query);
  }
}
