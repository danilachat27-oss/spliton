import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRoleCode } from '@prisma/client';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../modules/auth/guards/roles.guard';
import { Roles } from '../../../modules/auth/decorators/roles.decorator';
import { CurrentUser } from '../../../modules/auth/decorators/current-user.decorator';
import type { AuthUser } from '../../../modules/auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../../../modules/admin/admin-panel-roles';
import { AdminAuditService } from '../../../modules/admin/common/admin-audit.service';
import { throwAdminError } from '../../../modules/admin/common/admin-http.util';
import { DataQualityService } from '../data-quality/data-quality.service';
import { OutboxService } from '../outbox/outbox.service';
import { SafetyConsoleService } from './safety-console.service';

const VIEW_ROLES = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.ACCOUNTANT,
  UserRoleCode.COMPLIANCE,
  UserRoleCode.BUSINESS_ANALYST,
] as const;

const MUTATE_ROLES = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
] as const;

@Controller('api/admin/v1/safety')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminSafetyController {
  constructor(
    private readonly safety: SafetyConsoleService,
    private readonly dataQuality: DataQualityService,
    private readonly outbox: OutboxService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('console')
  @Roles(...VIEW_ROLES)
  console(@CurrentUser() user: AuthUser) {
    this.assertView(user.roles ?? []);
    return this.safety.getConsole();
  }

  @Get('data-quality')
  @Roles(...VIEW_ROLES)
  dataQualityReport(@CurrentUser() user: AuthUser) {
    this.assertView(user.roles ?? []);
    return this.dataQuality.runChecks();
  }

  @Get('outbox/dead-letter')
  @Roles(...VIEW_ROLES)
  deadLetter(@CurrentUser() user: AuthUser) {
    this.assertView(user.roles ?? []);
    return this.outbox.listDeadLetter();
  }

  @Post('outbox/:id/requeue')
  @Roles(...MUTATE_ROLES)
  async requeue(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    this.assertMutate(user.roles ?? []);
    await this.outbox.requeue(id);
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'event_outbox',
      entityId: id,
      action: 'outbox.requeue',
      after: { id },
      ip: null,
      userAgent: null,
    });
    return { ok: true, id };
  }

  private assertView(roles: string[]): void {
    if (roles.some((r) => (VIEW_ROLES as readonly string[]).includes(r))) return;
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Insufficient permissions for safety console',
      HttpStatus.FORBIDDEN,
    );
  }

  private assertMutate(roles: string[]): void {
    if (roles.some((r) => (MUTATE_ROLES as readonly string[]).includes(r))) return;
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Insufficient permissions for outbox requeue',
      HttpStatus.FORBIDDEN,
    );
  }
}
