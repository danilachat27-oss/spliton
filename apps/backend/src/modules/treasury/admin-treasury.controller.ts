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
import { TreasuryDiscrepancyStatus, UserRoleCode } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin/admin-panel-roles';
import { AdminAuditService } from '../admin/common/admin-audit.service';
import { requestMeta } from '../admin/common/admin-http.util';
import { TreasuryConsoleService } from './treasury-console.service';
import { TreasuryAccountsService } from './treasury-accounts.service';
import { TreasuryReconciliationService } from './treasury-reconciliation.service';
import { OperationalLimitsService } from './operational-limits.service';
import type { OperationalLimitsDto } from './operational-limits.service';
import { DepositAddressService } from './deposit-address.service';
import { DepositNetworkSettingsService } from './deposit-network-settings.service';
import { DepositAddressPoolService } from './deposit-address-pool.service';
import { UpdateDepositNetworkSettingsDto } from './dto/update-deposit-network-settings.dto';
import { AddDepositPoolAddressDto } from './dto/add-deposit-pool-address.dto';

const VIEW = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.ACCOUNTANT,
  UserRoleCode.COMPLIANCE,
  UserRoleCode.BUSINESS_ANALYST,
] as const;

const FINANCE = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.ACCOUNTANT,
] as const;

const SUPER_ONLY = [UserRoleCode.SUPER_ADMIN] as const;

@Controller('api/admin/v1/treasury')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminTreasuryController {
  constructor(
    private readonly console: TreasuryConsoleService,
    private readonly accounts: TreasuryAccountsService,
    private readonly reconciliation: TreasuryReconciliationService,
    private readonly limits: OperationalLimitsService,
    private readonly depositAddresses: DepositAddressService,
    private readonly depositSettings: DepositNetworkSettingsService,
    private readonly depositPool: DepositAddressPoolService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('console')
  @Roles(...VIEW)
  getConsole() {
    return this.console.getConsoleSummary();
  }

  @Get('accounts')
  @Roles(...VIEW)
  listAccounts() {
    return this.accounts.listAccounts();
  }

  @Patch('accounts/:id/observed-balance')
  @Roles(...FINANCE)
  async setObserved(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { observedBalance: string; reason: string },
    @Req() req: Request,
  ) {
    const row = await this.accounts.updateObservedBalance(
      id,
      body.observedBalance,
      user.id,
    );
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'treasury_account',
      entityId: id,
      action: 'treasury.account.observed_balance',
      after: { observed: body.observedBalance, reason: body.reason },
      ...requestMeta(req),
    });
    return row;
  }

  @Post('reconciliation/run')
  @Roles(...FINANCE)
  async runReconciliation(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Query('dryRun') dryRun?: string,
  ) {
    const isDry = dryRun !== 'false';
    const result = await this.reconciliation.runReconciliation({
      dryRun: isDry,
      startedByUserId: user.id,
    });
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'treasury_reconciliation',
      entityId: isDry ? 'dry-run' : ('id' in result ? result.id : 'run'),
      action: 'treasury.reconciliation.run',
      after: {
        dryRun: isDry,
        discrepancyCount:
          'discrepancyCount' in result ? result.discrepancyCount : 0,
      },
      ...requestMeta(req),
    });
    return result;
  }

  @Get('reconciliation/discrepancies')
  @Roles(...VIEW)
  listDiscrepancies() {
    return this.reconciliation.listOpenDiscrepancies(100);
  }

  @Post('reconciliation/discrepancies/:id/resolve')
  @Roles(...FINANCE)
  async resolveDiscrepancy(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { reason: string; status?: TreasuryDiscrepancyStatus },
    @Req() req: Request,
  ) {
    const row = await this.reconciliation.resolveDiscrepancy(
      id,
      user.id,
      body.reason,
      body.status ?? TreasuryDiscrepancyStatus.RESOLVED,
    );
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'treasury_reconciliation_item',
      entityId: id,
      action: 'treasury.discrepancy.resolve',
      after: { reason: body.reason },
      ...requestMeta(req),
    });
    return row;
  }

  @Get('limits')
  @Roles(...VIEW)
  getLimits() {
    return this.limits.getLimits();
  }

  @Patch('limits')
  @Roles(...SUPER_ONLY)
  async patchLimits(
    @CurrentUser() user: AuthUser,
    @Body() body: Partial<OperationalLimitsDto>,
    @Req() req: Request,
  ) {
    const row = await this.limits.updateLimits(user.id, body);
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'treasury_operational_limits',
      entityId: 'platform',
      action: 'treasury.limits.update',
      after: body,
      ...requestMeta(req),
    });
    return row;
  }

  @Post('deposit-addresses/:walletId/rotate')
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.COMPLIANCE)
  async rotateAddress(
    @CurrentUser() user: AuthUser,
    @Param('walletId') walletId: string,
    @Body() body: { reason: string; newAddress?: string },
    @Req() req: Request,
  ) {
    const address = await this.depositAddresses.adminRotate(
      walletId,
      user.id,
      body.reason,
      body.newAddress,
    );
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'wallet',
      entityId: walletId,
      action: 'treasury.deposit_address.rotate',
      after: { address, reason: body.reason },
      ...requestMeta(req),
    });
    return { address };
  }

  @Post('hot-wallet/check-thresholds')
  @Roles(...FINANCE)
  checkHotWallet() {
    return this.accounts.checkHotWalletThresholds();
  }

  @Get('deposit-network-settings')
  @Roles(...VIEW)
  getDepositNetworkSettings() {
    return this.depositSettings.getForAssetNetwork();
  }

  @Patch('deposit-network-settings')
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ACCOUNTANT)
  async patchDepositNetworkSettings(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateDepositNetworkSettingsDto,
    @Req() req: Request,
  ) {
    const dangerous =
      body.tokenContractAddress !== undefined ||
      body.minConfirmations !== undefined ||
      body.providerMode !== undefined ||
      body.depositEnabled !== undefined ||
      body.withdrawalEnabled !== undefined;
    const row = await this.depositSettings.updateSettings(user.id, body, {
      requireReason: dangerous,
    });
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'deposit_network_settings',
      entityId: row.id,
      action: 'treasury.deposit_network_settings.update',
      after: { ...body, reason: body.reason },
      ...requestMeta(req),
    });
    return row;
  }

  @Get('deposit-address-pool')
  @Roles(...VIEW)
  listDepositAddressPool() {
    return this.depositPool.listPool();
  }

  @Post('deposit-address-pool')
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ACCOUNTANT)
  async addDepositPoolAddress(
    @CurrentUser() user: AuthUser,
    @Body() body: AddDepositPoolAddressDto,
    @Req() req: Request,
  ) {
    const row = await this.depositPool.adminAddAddress(
      body.address,
      body.asset,
      body.network,
    );
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'deposit_address_pool',
      entityId: row.id,
      action: 'treasury.deposit_address_pool.add',
      after: { address: body.address, reason: body.reason },
      ...requestMeta(req),
    });
    return row;
  }

  @Post('deposit-address-pool/:id/disable')
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.COMPLIANCE)
  async disablePoolAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { reason: string; compromised?: boolean },
    @Req() req: Request,
  ) {
    const row = await this.depositPool.adminDisable(
      id,
      body.reason,
      body.compromised,
    );
    await this.audit.logOperatorAction({
      actorUserId: user.id,
      actorRoles: user.roles ?? [],
      entityType: 'deposit_address_pool',
      entityId: id,
      action: body.compromised
        ? 'treasury.deposit_address_pool.compromised'
        : 'treasury.deposit_address_pool.disable',
      after: { reason: body.reason },
      ...requestMeta(req),
    });
    return row;
  }
}
