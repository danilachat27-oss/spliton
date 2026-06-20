import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Prisma,
  ReferralRewardEventType,
  ReferralRewardType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReferralRulesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (process.env.SKIP_SCHEMA_BOOTSTRAP === 'true') return;
    await this.seedDefaults();
  }

  async seedDefaults() {
    const defaults: Array<{
      eventType: ReferralRewardEventType;
      rewardType: ReferralRewardType;
      fixedAmount?: string;
      percentage?: string;
      maxReward?: string;
      minDeposit?: string;
      minPurchase?: string;
    }> = [
      {
        eventType: ReferralRewardEventType.EMAIL_VERIFIED,
        rewardType: ReferralRewardType.FIXED,
        fixedAmount: '2',
      },
      {
        eventType: ReferralRewardEventType.FIRST_DEPOSIT,
        rewardType: ReferralRewardType.FIXED,
        fixedAmount: '5',
        minDeposit: '10',
      },
      {
        eventType: ReferralRewardEventType.FIRST_PRIMARY_PURCHASE,
        rewardType: ReferralRewardType.FIXED,
        fixedAmount: '10',
        minPurchase: '20',
      },
      {
        eventType: ReferralRewardEventType.SECONDARY_TRADE_FEE,
        rewardType: ReferralRewardType.PERCENT_FEE,
        percentage: '10',
        maxReward: '50',
      },
    ];

    for (const d of defaults) {
      const existing = await this.prisma.referralRule.findFirst({
        where: { eventType: d.eventType, active: true },
      });
      if (existing) continue;
      await this.prisma.referralRule.create({
        data: {
          eventType: d.eventType,
          rewardType: d.rewardType,
          fixedAmount: d.fixedAmount
            ? new Prisma.Decimal(d.fixedAmount)
            : null,
          percentage: d.percentage
            ? new Prisma.Decimal(d.percentage)
            : null,
          maxReward: d.maxReward ? new Prisma.Decimal(d.maxReward) : null,
          minDeposit: d.minDeposit
            ? new Prisma.Decimal(d.minDeposit)
            : null,
          minPurchase: d.minPurchase
            ? new Prisma.Decimal(d.minPurchase)
            : null,
          active: true,
        },
      });
    }
  }

  async findActiveRule(eventType: ReferralRewardEventType) {
    const now = new Date();
    return this.prisma.referralRule.findFirst({
      where: {
        eventType,
        active: true,
        OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }],
        AND: [
          { OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
