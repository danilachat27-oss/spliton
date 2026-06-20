import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { UserRoleCode } from '@prisma/client';
import { requestMeta } from '../common/admin-http.util';
import { AdminPlatformRevenueQueryDto } from './dto/admin-platform-revenue-query.dto';
import { AdminPlatformRevenueService } from './admin-platform-revenue.service';

@Controller('api/admin/v1/platform-revenue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminPlatformRevenueController {
  constructor(private readonly platform: AdminPlatformRevenueService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminPlatformRevenueQueryDto,
  ) {
    return this.platform.summary(user.roles, query);
  }

  @Get('by-source')
  bySource(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminPlatformRevenueQueryDto,
  ) {
    return this.platform.bySource(user.roles, query);
  }

  @Get('by-period')
  byPeriod(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminPlatformRevenueQueryDto,
  ) {
    return this.platform.byPeriod(user.roles, query);
  }

  @Get('by-release')
  byRelease(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminPlatformRevenueQueryDto,
  ) {
    return this.platform.byRelease(user.roles, query);
  }

  @Get('fee-settings-history')
  feeSettingsHistory(@CurrentUser() user: AuthUser) {
    return this.platform.feeSettingsHistory(user.roles);
  }

  @Get('transactions')
  transactions(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminPlatformRevenueQueryDto,
  ) {
    return this.platform.transactions(user.roles, query);
  }

  @Get('transactions/:id')
  transactionById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.platform.transactionById(user.roles, id);
  }
}

@Controller('api/admin/v1/platform-fees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminPlatformFeesController {
  constructor(private readonly platform: AdminPlatformRevenueService) {}

  @Get()
  getFees(@CurrentUser() user: AuthUser) {
    return this.platform.getFees(user.roles);
  }

  @Patch()
  @Roles(UserRoleCode.SUPER_ADMIN)
  patchFees(
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.platform.patchFees(user.id, user.roles, body, requestMeta(req));
  }
}
