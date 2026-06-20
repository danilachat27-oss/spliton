import {
  Body,
  Controller,
  Delete,
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
import { AdminListQueryDto } from '../common/dto/admin-list-query.dto';
import { requestMeta } from '../common/admin-http.util';
import {
  AdminNoteDto,
  AssignUserRoleDto,
  PatchUserStatusDto,
} from './dto/admin-user.dto';
import { AdminUsersService } from './admin-users.service';

@Controller('api/admin/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminListQueryDto) {
    return this.users.list(user.roles, query);
  }

  @Get('stats/summary')
  listStats(@CurrentUser() user: AuthUser) {
    return this.users.getListStats(user.roles);
  }

  @Get(':id/operator-context')
  operatorContext(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.users.getOperatorContext(user.roles, id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.users.getById(user.roles, id);
  }

  @Patch(':id/status')
  patchStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: PatchUserStatusDto,
    @Req() req: Request,
  ) {
    return this.users.patchStatus(
      user.id,
      user.roles,
      id,
      body.status,
      body.note,
      requestMeta(req),
    );
  }

  @Post(':id/roles')
  assignRole(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AssignUserRoleDto,
    @Req() req: Request,
  ) {
    return this.users.assignRole(
      user.id,
      user.roles,
      id,
      body.role,
      body.note,
      requestMeta(req),
      body.confirmSuperAdmin,
    );
  }

  @Delete(':id/roles/:role')
  removeRole(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('role') role: string,
    @Req() req: Request,
  ) {
    return this.users.removeRole(
      user.id,
      user.roles,
      id,
      role,
      requestMeta(req),
    );
  }

  @Post(':id/block')
  block(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AdminNoteDto,
    @Req() req: Request,
  ) {
    return this.users.block(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }

  @Post(':id/unblock')
  unblock(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AdminNoteDto,
    @Req() req: Request,
  ) {
    return this.users.unblock(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }
}
