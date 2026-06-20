import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from './admin-panel-roles';
import { AdminAccessService } from './admin-access.service';

/**
 * Versioned operator API — `/api/admin/v1/*`
 * Financial mutations must live here, not on public user routes.
 */
@Controller('api/admin/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminV1Controller {
  constructor(private readonly adminAccess: AdminAccessService) {}

  @Get('access')
  access(@CurrentUser() user: AuthUser) {
    return this.adminAccess.permissions(user);
  }
}
