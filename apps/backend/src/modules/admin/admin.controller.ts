import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ADMIN_PANEL_ROLE_CODES } from './admin-panel-roles';

/**
 * Защищённые маршруты операторской панели.
 * Фронт вызывает {@link AdminController.access} для подтверждения роли на сервере.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminController {
  @Get('access')
  access() {
    return { ok: true as const };
  }
}
