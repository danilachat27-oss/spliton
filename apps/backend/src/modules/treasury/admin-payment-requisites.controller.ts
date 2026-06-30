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
import { Prisma, UserRoleCode } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin/admin-panel-roles';
import { AdminAuditService } from '../admin/common/admin-audit.service';
import { requestMeta } from '../admin/common/admin-http.util';
import { DepositNetworkSettingsService } from './deposit-network-settings.service';
import { DepositAddressPoolService } from './deposit-address-pool.service';
import { DepositRequisiteHistoryService } from './deposit-requisite-history.service';
import { UpdateDepositNetworkSettingsDto } from './dto/update-deposit-network-settings.dto';
import { AddDepositPoolAddressDto } from './dto/add-deposit-pool-address.dto';
import { BulkAddDepositPoolAddressesDto } from './dto/bulk-add-deposit-pool-addresses.dto';

const PR_VIEW = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.ACCOUNTANT,
  UserRoleCode.COMPLIANCE,
  UserRoleCode.BUSINESS_ANALYST,
  UserRoleCode.SUPPORT_MANAGER,
  UserRoleCode.SUPPORT,
] as const;

const PR_MUTATE = [UserRoleCode.SUPER_ADMIN, UserRoleCode.ACCOUNTANT] as const;

@Controller('api/admin/v1/payment-requisites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminPaymentRequisitesController {
  constructor(
    private readonly depositSettings: DepositNetworkSettingsService,
    private readonly depositPool: DepositAddressPoolService,
    private readonly history: DepositRequisiteHistoryService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get()
  @Roles(...PR_VIEW)
  async getSummary() {
    const settings = await this.depositSettings.getForAssetNetwork();
    const pool = await this.depositPool.listPool();
    const lowThreshold = settings.poolLowThreshold ?? 5;
    return {
      settings,
      pool: {
        ...pool,
        lowThreshold,
        poolLowWarning: pool.availableCount < lowThreshold,
      },
    };
  }

  @Get('network-settings')
  @Roles(...PR_VIEW)
  getNetworkSettings() {
    return this.depositSettings.getForAssetNetwork();
  }

  @Patch('network-settings')
  @Roles(...PR_MUTATE)
  async patchNetworkSettings(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateDepositNetworkSettingsDto,
    @Req() req: Request,
  ) {
    const before = await this.depositSettings.getForAssetNetwork();
    const dangerous =
      body.tokenContractAddress !== undefined ||
      body.minConfirmations !== undefined ||
      body.providerMode !== undefined ||
      body.depositEnabled !== undefined ||
      body.withdrawalEnabled !== undefined ||
      body.status !== undefined;
    const row = await this.depositSettings.updateSettings(user.id, body, {
      requireReason: dangerous,
    });
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'deposit_network_settings',
      entityId: row.id,
      action: 'payment_requisites.network_settings.update',
      before: before as unknown as Prisma.InputJsonValue,
      after: { ...body, reason: body.reason },
      ...requestMeta(req),
    });
    await this.history.log({
      entityType: 'deposit_network_settings',
      entityId: row.id,
      action: 'update',
      before: before as unknown as Prisma.InputJsonValue,
      after: row as unknown as Prisma.InputJsonValue,
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      reason: body.reason,
    });
    return row;
  }

  @Get('address-pool')
  @Roles(...PR_VIEW)
  listAddressPool() {
    return this.depositPool.listPool();
  }

  @Post('address-pool')
  @Roles(...PR_MUTATE)
  async addAddress(
    @CurrentUser() user: AuthUser,
    @Body() body: AddDepositPoolAddressDto,
    @Req() req: Request,
  ) {
    const row = await this.depositPool.adminAddAddress(
      body.address,
      body.asset,
      body.network,
      user.id,
    );
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'deposit_address_pool',
      entityId: row.id,
      action: 'payment_requisites.address_pool.add',
      after: { address: body.address, reason: body.reason },
      ...requestMeta(req),
    });
    await this.history.log({
      entityType: 'deposit_address_pool',
      entityId: row.id,
      action: 'add_address',
      after: row as unknown as Prisma.InputJsonValue,
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      reason: body.reason,
    });
    return row;
  }

  @Post('address-pool/bulk')
  @Roles(...PR_MUTATE)
  async bulkAddAddresses(
    @CurrentUser() user: AuthUser,
    @Body() body: BulkAddDepositPoolAddressesDto,
    @Req() req: Request,
  ) {
    const result = await this.depositPool.adminBulkAddAddresses(
      body.addresses,
      user.id,
      body.asset,
      body.network,
    );
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'deposit_address_pool',
      entityId: 'bulk',
      action: 'payment_requisites.address_pool.bulk_add',
      after: {
        reason: body.reason,
        added: result.added.length,
        duplicates: result.duplicates.length,
        invalid: result.invalid.length,
      },
      ...requestMeta(req),
    });
    await this.history.log({
      entityType: 'deposit_address_pool',
      entityId: 'bulk',
      action: 'bulk_add',
      after: result as unknown as Prisma.InputJsonValue,
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      reason: body.reason,
    });
    return result;
  }

  @Post('address-pool/:id/disable')
  @Roles(...PR_MUTATE)
  async disableAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { reason: string; compromised?: boolean },
    @Req() req: Request,
  ) {
    const before = await this.depositPool.getById(id);
    const row = await this.depositPool.adminDisable(
      id,
      body.reason,
      user.id,
      body.compromised,
    );
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'deposit_address_pool',
      entityId: id,
      action: body.compromised
        ? 'payment_requisites.address_pool.compromised'
        : 'payment_requisites.address_pool.disable',
      before: before as unknown as Prisma.InputJsonValue,
      after: { reason: body.reason },
      ...requestMeta(req),
    });
    await this.history.log({
      entityType: 'deposit_address_pool',
      entityId: id,
      action: body.compromised ? 'compromised' : 'disable',
      before: before as unknown as Prisma.InputJsonValue,
      after: row as unknown as Prisma.InputJsonValue,
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      reason: body.reason,
    });
    return row;
  }

  @Post('address-pool/:id/enable')
  @Roles(...PR_MUTATE)
  async enableAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: Request,
  ) {
    const before = await this.depositPool.getById(id);
    const row = await this.depositPool.adminEnable(id, body.reason, user.id);
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'deposit_address_pool',
      entityId: id,
      action: 'payment_requisites.address_pool.enable',
      before: before as unknown as Prisma.InputJsonValue,
      after: { reason: body.reason },
      ...requestMeta(req),
    });
    await this.history.log({
      entityType: 'deposit_address_pool',
      entityId: id,
      action: 'enable',
      before: before as unknown as Prisma.InputJsonValue,
      after: row as unknown as Prisma.InputJsonValue,
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      reason: body.reason,
    });
    return row;
  }

  @Post('address-pool/:id/archive')
  @Roles(...PR_MUTATE)
  async archiveAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: Request,
  ) {
    const before = await this.depositPool.getById(id);
    const row = await this.depositPool.adminArchive(id, body.reason, user.id);
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'deposit_address_pool',
      entityId: id,
      action: 'payment_requisites.address_pool.archive',
      before: before as unknown as Prisma.InputJsonValue,
      after: { reason: body.reason },
      ...requestMeta(req),
    });
    await this.history.log({
      entityType: 'deposit_address_pool',
      entityId: id,
      action: 'archive',
      before: before as unknown as Prisma.InputJsonValue,
      after: row as unknown as Prisma.InputJsonValue,
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      reason: body.reason,
    });
    return row;
  }

  @Get('preview')
  @Roles(...PR_VIEW)
  async preview(@Query('lang') lang?: string) {
    return this.depositSettings.buildPreview(lang);
  }

  @Get('history')
  @Roles(...PR_VIEW)
  async listHistory(@Query('limit') limit?: string) {
    const take = Math.min(Math.max(Number(limit) || 30, 1), 100);
    const items = await this.history.listRecent(take, [
      'deposit_network_settings',
      'deposit_address_pool',
    ]);
    return { items };
  }
}
