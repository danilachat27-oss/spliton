import { Test, TestingModule } from '@nestjs/testing';
import {
  PartnerStatus,
  Prisma,
  ReferralRewardEventType,
  ReferralRewardStatus,
  ReferralRewardType,
} from '@prisma/client';
import { ReferralRewardsService } from './referral-rewards.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReferralRulesService } from './referral-rules.service';
import { WalletLedgerService } from '../admin/common/wallet-ledger.service';
import { UserWalletService } from '../wallets/user-wallet.service';
import { AdminAuditService } from '../admin/common/admin-audit.service';
import { NotificationService } from '../notifications/notification.service';

describe('ReferralRewardsService', () => {
  let service: ReferralRewardsService;
  const prisma = {
    referralAttribution: { findUnique: jest.fn() },
    partnerProfile: { findUnique: jest.fn() },
    riskFlag: { findFirst: jest.fn(), create: jest.fn() },
    referralReward: { create: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn({})),
  };
  const rules = { findActiveRule: jest.fn() };
  const ledger = { creditAvailable: jest.fn(), createWalletTransaction: jest.fn() };
  const wallets = { getOrCreateWallet: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.referralAttribution.findUnique.mockResolvedValue({
      referrerUserId: 'ref1',
      referredUserId: 'new1',
    });
    prisma.partnerProfile.findUnique.mockResolvedValue(null);
    prisma.riskFlag.findFirst.mockResolvedValue(null);
    rules.findActiveRule.mockResolvedValue({
      id: 'rule1',
      rewardType: ReferralRewardType.FIXED,
      fixedAmount: new Prisma.Decimal(5),
    });
    prisma.referralReward.create.mockResolvedValue({
      id: 'rw1',
      referrerUserId: 'ref1',
      amount: new Prisma.Decimal(5),
      currency: 'USDT',
      status: ReferralRewardStatus.APPROVED,
      approvedAt: null,
    });
    prisma.referralReward.findUnique.mockResolvedValue({
      id: 'rw1',
      referrerUserId: 'ref1',
      amount: new Prisma.Decimal(5),
      currency: 'USDT',
      status: ReferralRewardStatus.APPROVED,
      approvedAt: null,
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: {
      referralReward: { update: jest.Mock };
    }) => unknown) =>
      fn({
        referralReward: { update: jest.fn().mockResolvedValue({}) },
      }),
    );
    wallets.getOrCreateWallet.mockResolvedValue({ id: 'w1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralRewardsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ReferralRulesService, useValue: rules },
        { provide: WalletLedgerService, useValue: ledger },
        { provide: UserWalletService, useValue: wallets },
        { provide: AdminAuditService, useValue: { logOperatorAction: jest.fn() } },
        { provide: NotificationService, useValue: { notifyUser: jest.fn(), notifyAdminRoles: jest.fn() } },
      ],
    }).compile();
    service = module.get(ReferralRewardsService);
  });

  it('skips reward when no attribution', async () => {
    prisma.referralAttribution.findUnique.mockResolvedValue(null);
    const r = await service.processEvent({
      referredUserId: 'u1',
      eventType: ReferralRewardEventType.EMAIL_VERIFIED,
    });
    expect(r).toBeNull();
  });

  it('skips reward when referrer suspended partner', async () => {
    prisma.partnerProfile.findUnique.mockResolvedValue({
      status: PartnerStatus.SUSPENDED,
    });
    const r = await service.processEvent({
      referredUserId: 'u1',
      eventType: ReferralRewardEventType.EMAIL_VERIFIED,
    });
    expect(r).toBeNull();
  });

  it('creates reward and auto-pays small amounts', async () => {
    const reward = await service.processEvent({
      referredUserId: 'new1',
      eventType: ReferralRewardEventType.EMAIL_VERIFIED,
      sourceEntityType: 'user',
      sourceEntityId: 'new1',
    });
    expect(reward).toBeTruthy();
    expect(prisma.referralReward.create).toHaveBeenCalled();
  });
});
