import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { AdminWalletsQueryDto } from './dto/admin-wallets-query.dto';
import { AdminWalletsService } from './admin-wallets.service';

@Controller('api/admin/v1/wallets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminWalletsController {
  constructor(private readonly wallets: AdminWalletsService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.wallets.summary(user.roles);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminWalletsQueryDto) {
    return this.wallets.list(user.roles, query);
  }

  @Get(':id/transactions')
  transactions(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: AdminWalletsQueryDto,
  ) {
    return this.wallets.listTransactions(user.roles, id, query);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('include') include?: string,
  ) {
    return this.wallets.getById(user.roles, id, include);
  }
}

@Controller('api/admin/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminUserWalletController {
  constructor(private readonly wallets: AdminWalletsService) {}

  @Get(':id/wallet/transactions')
  userWalletTransactions(
    @CurrentUser() user: AuthUser,
    @Param('id') userId: string,
    @Query() query: AdminWalletsQueryDto,
  ) {
    return this.wallets.getUserWalletTransactions(user.roles, userId, query);
  }

  @Get(':id/wallet')
  userWallet(
    @CurrentUser() user: AuthUser,
    @Param('id') userId: string,
    @Query('include') include?: string,
  ) {
    return this.wallets.getUserWallet(user.roles, userId, include);
  }
}
