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
import { AdminSystemAnnouncementsService } from './admin-system-announcements.service';

@Controller('api/admin/v1/system-announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminSystemAnnouncementsController {
  constructor(private readonly announcements: AdminSystemAnnouncementsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.announcements.list(user.roles, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.announcements.create(user.id, user.roles, body, requestMeta(req));
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.announcements.update(user.id, user.roles, id, body, requestMeta(req));
  }

  @Post(':id/publish')
  publish(@CurrentUser() user: AuthUser, @Param('id') id: string, @Req() req: Request) {
    return this.announcements.publish(user.id, user.roles, id, requestMeta(req));
  }

  @Post(':id/archive')
  archive(@CurrentUser() user: AuthUser, @Param('id') id: string, @Req() req: Request) {
    return this.announcements.archive(user.id, user.roles, id, requestMeta(req));
  }

  @Post(':id/preview')
  preview(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('locale') locale?: string,
  ) {
    return this.announcements.preview(id, user.roles, locale);
  }
}
