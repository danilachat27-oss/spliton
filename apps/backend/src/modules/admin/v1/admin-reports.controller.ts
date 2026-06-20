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

import { AdminListQueryDto } from '../common/dto/admin-list-query.dto';

import { AdminReportsService } from './admin-reports.service';

@Controller('api/admin/v1/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminReportsController {
  constructor(private readonly reports: AdminReportsService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser, @Query() query: AdminListQueryDto) {
    return this.reports.getSummary(user.roles, query);
  }

  @Get('worker/status')
  workerStatus(@CurrentUser() user: AuthUser) {
    return this.reports.workerStatus(user.roles);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminListQueryDto) {
    return this.reports.list(user.roles, query);
  }

  @Get('types')
  listTypes(@CurrentUser() user: AuthUser) {
    return this.reports.listReportTypes(user.roles);
  }

  @Post('generate')
  generate(
    @CurrentUser() user: AuthUser,

    @Query('type') type: string,

    @Query('dateFrom') dateFrom: string | undefined,

    @Query('dateTo') dateTo: string | undefined,

    @Query('format') format: string | undefined,

    @Req() req: Request,
  ) {
    return this.reports.generate(
      user.id,

      user.roles,

      { type, dateFrom, dateTo, format },

      requestMeta(req),
    );
  }

  @Post(':id/retry')
  retry(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.reports.retry(
      user.roles,
      id,
      user.id,
      user.roles,
      requestMeta(req),
    );
  }

  @Get(':id/download')
  download(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.reports.download(
      user.roles,

      id,

      user.id,

      user.roles,

      requestMeta(req),
    );
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Query('include') include?: string,
  ) {
    return this.reports.getById(user.roles, id, include);
  }
}
