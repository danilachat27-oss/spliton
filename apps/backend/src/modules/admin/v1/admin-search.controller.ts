import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { AdminSearchService } from './admin-search.service';

@Controller('api/admin/v1/search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminSearchController {
  constructor(private readonly searchService: AdminSearchService) {}

  @Get()
  search(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.searchService.search(user.roles, q ?? '');
  }
}
