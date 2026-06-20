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
import { AdminLabelsService } from './admin-labels.service';
import { requestMeta } from '../common/admin-http.util';

@Controller('api/admin/v1/labels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminLabelsController {
  constructor(private readonly labels: AdminLabelsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.labels.list(user.roles, search, activeOnly === 'true' || activeOnly === '1');
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.labels.getById(user.roles, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; slug?: string },
    @Req() req: Request,
  ) {
    return this.labels.create(user.id, user.roles, body, requestMeta(req));
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string; isActive?: boolean },
    @Req() req: Request,
  ) {
    return this.labels.update(user.id, user.roles, id, body, requestMeta(req));
  }
}
