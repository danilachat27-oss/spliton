import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { UserRoleCode } from '@prisma/client';
import { AdminRolesService } from './admin-roles.service';

@Controller('api/admin/v1/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN)
export class AdminRolesController {
  constructor(private readonly roles: AdminRolesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.roles.list(user.roles);
  }

  @Get(':code')
  getByCode(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.roles.getByCode(user.roles, code);
  }

  @Get(':code/users')
  usersByRole(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.roles.usersByRole(user.roles, code);
  }
}
