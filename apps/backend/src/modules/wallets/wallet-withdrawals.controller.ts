import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { requestMeta } from '../admin/common/admin-http.util';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalListQueryDto } from './dto/withdrawal-list-query.dto';
import { UserWithdrawalsService } from './user-withdrawals.service';

@Controller('api/v1/wallet')
@UseGuards(JwtAuthGuard)
export class WalletWithdrawalsController {
  constructor(private readonly withdrawals: UserWithdrawalsService) {}

  @Post('withdrawals')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateWithdrawalDto,
    @Req() req: Request,
  ) {
    return this.withdrawals.create(user.id, dto, requestMeta(req));
  }

  @Get('withdrawals')
  list(@CurrentUser() user: AuthUser, @Query() query: WithdrawalListQueryDto) {
    return this.withdrawals.list(user.id, query);
  }

  @Get('withdrawals/:id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.withdrawals.getById(user.id, id);
  }

  @Delete('withdrawals/:id')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.withdrawals.cancel(user.id, id, requestMeta(req));
  }
}
