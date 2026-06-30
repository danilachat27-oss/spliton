import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SystemAlertsModule } from '../../common/observability/system-alerts.module';
import { AdminTreasuryController } from './admin-treasury.controller';
import { AdminPaymentRequisitesController } from './admin-payment-requisites.controller';
import { TreasuryAccountsService } from './treasury-accounts.service';
import { OperationalLimitsService } from './operational-limits.service';
import { WithdrawalApprovalService } from './withdrawal-approval.service';
import { TreasuryReconciliationService } from './treasury-reconciliation.service';
import { DepositAddressService } from './deposit-address.service';
import { DepositNetworkSettingsService } from './deposit-network-settings.service';
import { DepositAddressPoolService } from './deposit-address-pool.service';
import { ProviderWithdrawalLifecycleService } from './provider-withdrawal-lifecycle.service';
import { TreasuryConsoleService } from './treasury-console.service';
import { DepositRequisiteHistoryService } from './deposit-requisite-history.service';
import { AdminAuditService } from '../admin/common/admin-audit.service';

@Module({
  imports: [PrismaModule, SystemAlertsModule],
  controllers: [AdminTreasuryController, AdminPaymentRequisitesController],
  providers: [
    TreasuryAccountsService,
    OperationalLimitsService,
    WithdrawalApprovalService,
    TreasuryReconciliationService,
    DepositAddressService,
    DepositNetworkSettingsService,
    DepositAddressPoolService,
    DepositRequisiteHistoryService,
    ProviderWithdrawalLifecycleService,
    TreasuryConsoleService,
    AdminAuditService,
  ],
  exports: [
    OperationalLimitsService,
    WithdrawalApprovalService,
    DepositAddressService,
    DepositNetworkSettingsService,
    DepositAddressPoolService,
    ProviderWithdrawalLifecycleService,
    TreasuryConsoleService,
    TreasuryReconciliationService,
    TreasuryAccountsService,
  ],
})
export class TreasuryModule {}
