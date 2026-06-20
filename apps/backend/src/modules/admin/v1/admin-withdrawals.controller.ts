import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { requestMeta } from '../common/admin-http.util';
import {
  AdminNoteDto,
  CompleteWithdrawalDto,
  RejectWithdrawalDto,
} from './dto/admin-user.dto';
import { AdminWithdrawalsQueryDto } from './dto/admin-withdrawals-query.dto';
import { AdminWithdrawalsService } from './admin-withdrawals.service';

@Controller('api/admin/v1/withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminWithdrawalsController {
  constructor(private readonly withdrawals: AdminWithdrawalsService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminWithdrawalsQueryDto,
  ) {
    return this.withdrawals.summary(user.roles, query);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminWithdrawalsQueryDto,
  ) {
    return this.withdrawals.list(user.roles, query);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('include') include?: string,
  ) {
    return this.withdrawals.getById(user.roles, id, include);
  }

  @Post(':id/approve')
  approve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AdminNoteDto,
    @Req() req: Request,
  ) {
    return this.withdrawals.approve(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }

  @Post(':id/reject')
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: RejectWithdrawalDto,
    @Req() req: Request,
  ) {
    return this.withdrawals.reject(
      user.id,
      user.roles,
      id,
      body.note,
      body.rejectionReason,
      requestMeta(req),
    );
  }

  @Post(':id/hold')
  hold(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AdminNoteDto,
    @Req() req: Request,
  ) {
    return this.withdrawals.hold(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }

  @Post(':id/complete')
  complete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CompleteWithdrawalDto,
    @Req() req: Request,
  ) {
    return this.withdrawals.complete(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
      body.blockchainTxid,
      body.manualOverride,
      body.manualCompleteReason,
    );
  }
}
