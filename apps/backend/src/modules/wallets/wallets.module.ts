import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { TreasuryModule } from '../treasury/treasury.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlatformFeeLedgerService } from '../admin/common/platform-fee-ledger.service';
import { WalletLedgerService } from '../admin/common/wallet-ledger.service';
import { LedgerPostingService } from '../admin/common/ledger-posting.service';
import { WalletsController } from './wallets.controller';
import { UserWalletController } from './user-wallet.controller';
import { WalletWithdrawalsController } from './wallet-withdrawals.controller';
import { WalletsRepository } from './wallets.repository';
import { WalletsService } from './wallets.service';
import { DepositAddressProvider } from './deposit-address.provider';
import { UserDepositsService } from './user-deposits.service';
import { UserWalletService } from './user-wallet.service';
import { UserWithdrawalsService } from './user-withdrawals.service';
import { WalletAuditService } from './wallet-audit.service';
import { WalletActivityService } from './wallet-activity.service';

@Module({
  imports: [PrismaModule, ComplianceModule, TreasuryModule, NotificationsModule],
  controllers: [
    WalletsController,
    UserWalletController,
    WalletWithdrawalsController,
  ],
  providers: [
    WalletsService,
    WalletsRepository,
    LedgerPostingService,
    WalletLedgerService,
    PlatformFeeLedgerService,
    UserWalletService,
    DepositAddressProvider,
    UserDepositsService,
    UserWithdrawalsService,
    WalletAuditService,
    WalletActivityService,
  ],
  exports: [
    UserWalletService,
    WalletLedgerService,
    WalletAuditService,
    WalletActivityService,
  ],
})
export class WalletsModule {}
