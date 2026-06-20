import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { AdminNoteDto } from './dto/admin-user.dto';
import { AdminDepositsQueryDto } from './dto/admin-deposits-query.dto';
import { AdminDepositsService } from './admin-deposits.service';
import { IsOptional, IsString } from 'class-validator';

class PatchDepositStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

@Controller('api/admin/v1/deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminDepositsController {
  constructor(private readonly deposits: AdminDepositsService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminDepositsQueryDto,
  ) {
    return this.deposits.summary(user.roles, query);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminDepositsQueryDto) {
    return this.deposits.list(user.roles, query);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('include') include?: string,
  ) {
    return this.deposits.getById(user.roles, id, include);
  }

  @Patch(':id/status')
  patchStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: PatchDepositStatusDto,
    @Req() req: Request,
  ) {
    return this.deposits.patchStatus(
      user.id,
      user.roles,
      id,
      body.status,
      body.note,
      requestMeta(req),
    );
  }

  @Post(':id/review')
  review(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AdminNoteDto,
    @Req() req: Request,
  ) {
    return this.deposits.review(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }

  @Post(':id/reconcile')
  reconcile(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AdminNoteDto,
    @Req() req: Request,
  ) {
    return this.deposits.reconcile(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }
}
