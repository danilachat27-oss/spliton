import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { OperatorSlaService } from '../../operator-sla/operator-sla.service';

@Controller('api/admin/v1/operator-sla')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminOperatorSlaController {
  constructor(private readonly sla: OperatorSlaService) {}

  @Get('tasks')
  list(@Query('overdueOnly') overdueOnly?: string) {
    return this.sla.listOpen({ overdueOnly: overdueOnly === 'true' });
  }
}
