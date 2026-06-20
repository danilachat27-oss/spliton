import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PaginatedQueryDto } from '../../common/pagination/paginated-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { WalletActivityQueryDto } from './dto/wallet-activity-query.dto';
import { DepositInfoQueryDto } from './dto/deposit-info-query.dto';
import { UserDepositsService } from './user-deposits.service';
import { UserWalletService } from './user-wallet.service';
import { WalletActivityService } from './wallet-activity.service';

@Controller('api/v1/wallet')
@UseGuards(JwtAuthGuard)
export class UserWalletController {
  constructor(
    private readonly wallet: UserWalletService,
    private readonly deposits: UserDepositsService,
    private readonly activity: WalletActivityService,
  ) {}

  @Get()
  getWallet(@CurrentUser() user: AuthUser) {
    return this.wallet.getSummary(user.id);
  }

  @Get('balance')
  getBalance(@CurrentUser() user: AuthUser) {
    return this.wallet.getBalance(user.id);
  }

  @Get('activity')
  listActivity(
    @CurrentUser() user: AuthUser,
    @Query() query: WalletActivityQueryDto,
  ) {
    return this.activity.list(user.id, query);
  }

  @Get('transactions')
  listTransactions(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginatedQueryDto,
  ) {
    return this.wallet.listTransactions(user.id, query.page, query.pageSize);
  }

  @Get('deposit-info')
  depositInfo(
    @CurrentUser() user: AuthUser,
    @Query() query: DepositInfoQueryDto,
  ) {
    return this.deposits.getDepositInfo(user.id, {
      asset: query.asset,
      network: query.network,
      lang: query.lang,
    });
  }

  @Get('deposit-address')
  depositAddress(@CurrentUser() user: AuthUser) {
    return this.deposits.getDepositAddress(user.id);
  }

  @Get('deposits')
  listDeposits(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginatedQueryDto,
  ) {
    return this.deposits.list(user.id, query.page, query.pageSize);
  }

  @Get('deposits/:id')
  getDeposit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.deposits.getById(user.id, id);
  }
}
