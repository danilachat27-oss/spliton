import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  SystemAlertSeverity,
  SystemAlertSource,
  SystemAlertStatus,
  UserRoleCode,
} from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { assertMatrixSection } from '../common/admin-role-matrix';
import { AdminAuditService } from '../common/admin-audit.service';
import { throwAdminError } from '../common/admin-http.util';
import { OperationsStatusService } from '../../../common/observability/operations-status.service';
import { SystemAlertService } from '../../../common/observability/system-alert.service';

const OPS_VIEW_ROLES = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.ACCOUNTANT,
  UserRoleCode.COMPLIANCE,
  UserRoleCode.BUSINESS_ANALYST,
] as const;

const ALERT_MUTATE_ROLES = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.ACCOUNTANT,
  UserRoleCode.COMPLIANCE,
] as const;

@Controller('api/admin/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminObservabilityController {
  constructor(
    private readonly operations: OperationsStatusService,
    private readonly alerts: SystemAlertService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('operations/status')
  @Roles(...OPS_VIEW_ROLES)
  operationsStatus(@CurrentUser() user: AuthUser) {
    this.assertOpsView(user.roles ?? []);
    return this.operations.getOverview();
  }

  @Get('alerts')
  @Roles(...OPS_VIEW_ROLES)
  listAlerts(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: SystemAlertStatus,
    @Query('severity') severity?: SystemAlertSeverity,
    @Query('source') source?: SystemAlertSource,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    this.assertOpsView(user.roles ?? []);
    return this.alerts.list({
      status,
      severity,
      source,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Post('alerts/:id/acknowledge')
  @Roles(...ALERT_MUTATE_ROLES)
  async acknowledge(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    this.assertAlertMutate(user.roles ?? []);
    const saved = await this.alerts.acknowledge(id, user.id);
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'system_alert',
      entityId: id,
      action: 'alert.acknowledge',
      after: { status: saved.status },
      ip: null,
      userAgent: null,
    });
    return saved;
  }

  @Post('alerts/:id/resolve')
  @Roles(...ALERT_MUTATE_ROLES)
  async resolve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    this.assertAlertMutate(user.roles ?? []);
    const saved = await this.alerts.resolve(id, user.id);
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'system_alert',
      entityId: id,
      action: 'alert.resolve',
      after: { status: saved.status },
      ip: null,
      userAgent: null,
    });
    return saved;
  }

  private assertOpsView(roles: string[]): void {
    if (roles.some((r) => (OPS_VIEW_ROLES as readonly string[]).includes(r))) {
      if (roles.includes(UserRoleCode.BUSINESS_ANALYST)) {
        assertMatrixSection(roles, 'analytics', 'view');
      }
      return;
    }
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Insufficient permissions for operations status',
      HttpStatus.FORBIDDEN,
    );
  }

  private assertAlertMutate(roles: string[]): void {
    if (
      roles.some((r) => (ALERT_MUTATE_ROLES as readonly string[]).includes(r))
    ) {
      return;
    }
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Insufficient permissions for alert actions',
      HttpStatus.FORBIDDEN,
    );
  }
}
