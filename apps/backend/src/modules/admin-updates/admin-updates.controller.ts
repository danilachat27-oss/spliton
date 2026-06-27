import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminUpdateType, UserRoleCode } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin/admin-panel-roles';
import { AdminUpdatesService } from './admin-updates.service';

@Controller('api/admin/v1/updates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminUpdatesController {
  constructor(private readonly updates: AdminUpdatesService) {}

  private roles(user: AuthUser): UserRoleCode[] {
    return (user.roles ?? []) as UserRoleCode[];
  }

  @Get('active')
  listActive(@CurrentUser() user: AuthUser) {
    return this.updates.listActive(user.id, this.roles(user));
  }

  @Get('history')
  listHistory(
    @CurrentUser() user: AuthUser,
    @Query('type') type?: AdminUpdateType,
  ) {
    return this.updates.listHistory(user.id, this.roles(user), { type });
  }

  @Get('manage')
  listManage(@CurrentUser() user: AuthUser) {
    return this.updates.listManage(this.roles(user));
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      title: string;
      summary: string;
      content: string;
      type: AdminUpdateType;
      audienceRoles: string[];
    },
  ) {
    return this.updates.create(this.roles(user), user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      title: string;
      summary: string;
      content: string;
      type: AdminUpdateType;
      audienceRoles: string[];
    }>,
  ) {
    return this.updates.update(id, this.roles(user), user.id, body);
  }

  @Post(':id/publish')
  publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.updates.publish(id, this.roles(user), user.id);
  }

  @Post(':id/archive')
  archive(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.updates.archive(id, this.roles(user), user.id);
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.updates.markRead(user.id, this.roles(user), id);
  }

  @Post(':id/dismiss')
  dismiss(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.updates.dismiss(user.id, this.roles(user), id);
  }
}
