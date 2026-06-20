import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { LedgerPostingService } from '../admin/common/ledger-posting.service';
import { WalletLedgerService } from '../admin/common/wallet-ledger.service';
import { DepositIngestionController } from './deposit-ingestion.controller';
import { DepositIngestionService } from './deposit-ingestion.service';
import { DepositIngestionWorker } from './deposit-ingestion.worker';
import {
  DEPOSIT_BLOCKCHAIN_PROVIDER,
  type DepositBlockchainProvider,
} from './providers/deposit-blockchain-provider.interface';
import { MockDepositProvider } from './providers/mock-deposit.provider';
import { TronDepositProvider } from './providers/tron-deposit.provider';

@Module({
  imports: [PrismaModule, ComplianceModule, NotificationsModule, ReferralsModule],
  controllers: [DepositIngestionController],
  providers: [
    LedgerPostingService,
    WalletLedgerService,
    DepositIngestionService,
    DepositIngestionWorker,
    MockDepositProvider,
    TronDepositProvider,
    {
      provide: DEPOSIT_BLOCKCHAIN_PROVIDER,
      inject: [ConfigService, MockDepositProvider, TronDepositProvider],
      useFactory: (
        config: ConfigService,
        mock: MockDepositProvider,
        tron: TronDepositProvider,
      ): DepositBlockchainProvider => {
        const mode =
          config.get<string>('tron.mode') ??
          process.env.TRON_PROVIDER_MODE ??
          'mock';
        return mode === 'mock' ? mock : tron;
      },
    },
  ],
  exports: [DepositIngestionService, MockDepositProvider],
})
export class DepositIngestionModule {}
