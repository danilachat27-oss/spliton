import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AdminAuditService } from '../admin/common/admin-audit.service';
import { LedgerPostingService } from '../admin/common/ledger-posting.service';
import { WalletLedgerService } from '../admin/common/wallet-ledger.service';
import { ReferralsController } from './referrals.controller';
import { PartnersController } from './partners.controller';
import { AdminReferralsController } from './admin-referrals.controller';
import { ReferralsService } from './referrals.service';
import { PartnersService } from './partners.service';
import { ReferralRewardsService } from './referral-rewards.service';
import { ReferralRulesService } from './referral-rules.service';
import { ReferralEventsService } from './referral-events.service';

@Module({
  imports: [PrismaModule, NotificationsModule, forwardRef(() => WalletsModule)],
  controllers: [
    ReferralsController,
    PartnersController,
    AdminReferralsController,
  ],
  providers: [
    ReferralsService,
    PartnersService,
    ReferralRewardsService,
    ReferralRulesService,
    ReferralEventsService,
    AdminAuditService,
    LedgerPostingService,
    WalletLedgerService,
  ],
  exports: [ReferralsService, ReferralEventsService, ReferralRewardsService],
})
export class ReferralsModule {}
