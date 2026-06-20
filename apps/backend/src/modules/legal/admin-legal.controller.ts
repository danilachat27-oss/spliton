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
import { LegalPolicyStatus, LegalPolicyType, UserRoleCode } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin/admin-panel-roles';
import { AdminAuditService } from '../admin/common/admin-audit.service';
import { requestMeta } from '../admin/common/admin-http.util';
import { LegalPoliciesService } from './legal-policies.service';
import { CountryRestrictionsService } from '../compliance/country-restrictions.service';

const LEGAL_MUTATE = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.COMPLIANCE,
] as const;

const LEGAL_VIEW = [
  ...LEGAL_MUTATE,
  UserRoleCode.BUSINESS_ANALYST,
  UserRoleCode.CONTENT_MANAGER,
] as const;

@Controller('api/admin/v1/legal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminLegalController {
  constructor(
    private readonly policies: LegalPoliciesService,
    private readonly audit: AdminAuditService,
    private readonly countries: CountryRestrictionsService,
  ) {}

  @Get('policies')
  @Roles(...LEGAL_VIEW)
  list(
    @Query('status') status?: LegalPolicyStatus,
    @Query('type') type?: LegalPolicyType,
  ) {
    return this.policies.listAdmin({ status, type });
  }

  @Get('policies/:id')
  @Roles(...LEGAL_VIEW)
  getOne(@Param('id') id: string) {
    return this.policies.getAdminById(id);
  }

  @Post('policies')
  @Roles(...LEGAL_MUTATE)
  async create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      type: LegalPolicyType;
      version: string;
      title: string;
      content: string;
      requiresUserConsent?: boolean;
    },
    @Req() req: Request,
  ) {
    const row = await this.policies.createDraft(body, user.id);
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'legal_policy',
      entityId: row.id,
      action: 'legal.policy.create',
      after: { type: row.type, version: row.version },
      ...requestMeta(req),
    });
    return row;
  }

  @Patch('policies/:id')
  @Roles(...LEGAL_MUTATE)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; version?: string; requiresUserConsent?: boolean },
    @Req() req: Request,
  ) {
    const row = await this.policies.updateDraft(id, body, user.id);
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'legal_policy',
      entityId: id,
      action: 'legal.policy.update',
      after: { version: row.version },
      ...requestMeta(req),
    });
    return row;
  }

  @Post('policies/:id/publish')
  @Roles(...LEGAL_MUTATE)
  async publish(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const row = await this.policies.publish(id, user.id);
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'legal_policy',
      entityId: id,
      action: 'legal.policy.publish',
      after: { status: row.status, version: row.version },
      ...requestMeta(req),
    });
    return row;
  }

  @Post('policies/:id/archive')
  @Roles(...LEGAL_MUTATE)
  async archive(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const row = await this.policies.archive(id, user.id);
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'legal_policy',
      entityId: id,
      action: 'legal.policy.archive',
      after: { status: row.status },
      ...requestMeta(req),
    });
    return row;
  }

  @Get('policies/:id/consents-count')
  @Roles(...LEGAL_VIEW)
  consentCount(@Param('id') id: string) {
    return this.policies.countConsentsForPolicy(id);
  }

  @Get('countries')
  @Roles(...LEGAL_VIEW)
  listCountries() {
    return this.countries.list();
  }

  @Post('countries')
  @Roles(...LEGAL_MUTATE)
  async upsertCountry(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      countryCode: string;
      status: string;
      reason?: string;
      appliesTo: Record<string, boolean>;
    },
    @Req() req: Request,
  ) {
    const row = await this.countries.upsert(body.countryCode, {
      status: body.status as never,
      reason: body.reason,
      appliesTo: body.appliesTo as never,
    });
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'country_restriction',
      entityId: row.countryCode,
      action: 'country.restriction.upsert',
      after: { status: row.status },
      ...requestMeta(req),
    });
    return row;
  }
}
