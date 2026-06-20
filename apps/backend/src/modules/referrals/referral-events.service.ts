import { Injectable } from '@nestjs/common';
import {
  DepositStatus,
  OrderStatus,
  Prisma,
  ReferralRewardEventType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReferralRewardsService } from './referral-rewards.service';

/** Hooks from deposit, orders, auth verification. */
@Injectable()
export class ReferralEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rewards: ReferralRewardsService,
  ) {}

  async onEmailVerified(userId: string) {
    return this.rewards.processEvent({
      referredUserId: userId,
      eventType: ReferralRewardEventType.EMAIL_VERIFIED,
      sourceEntityType: 'user',
      sourceEntityId: userId,
    });
  }

  async onFirstDeposit(params: {
    userId: string;
    depositId: string;
    amount: Prisma.Decimal;
  }) {
    const prior = await this.prisma.deposit.count({
      where: {
        walletTx: { wallet: { userId: params.userId } },
        status: DepositStatus.CREDITED,
        id: { not: params.depositId },
      },
    });
    if (prior > 0) return null;
    return this.rewards.processEvent({
      referredUserId: params.userId,
      eventType: ReferralRewardEventType.FIRST_DEPOSIT,
      sourceEntityType: 'deposit',
      sourceEntityId: params.depositId,
      grossAmount: params.amount,
    });
  }

  async onFirstPrimaryPurchase(params: {
    userId: string;
    orderId: string;
    grossAmount: Prisma.Decimal;
  }) {
    const prior = await this.prisma.order.count({
      where: {
        userId: params.userId,
        primaryRaiseRoundId: { not: null },
        status: { in: [OrderStatus.SETTLED, OrderStatus.PAID] },
        id: { not: params.orderId },
      },
    });
    if (prior > 0) return null;
    return this.rewards.processEvent({
      referredUserId: params.userId,
      eventType: ReferralRewardEventType.FIRST_PRIMARY_PURCHASE,
      sourceEntityType: 'order',
      sourceEntityId: params.orderId,
      grossAmount: params.grossAmount,
    });
  }

  async onSecondaryTradeFee(params: {
    buyerUserId: string;
    tradeId: string;
    feeAmount: Prisma.Decimal;
  }) {
    return this.rewards.processEvent({
      referredUserId: params.buyerUserId,
      eventType: ReferralRewardEventType.SECONDARY_TRADE_FEE,
      sourceEntityType: 'trade',
      sourceEntityId: params.tradeId,
      feeAmount: params.feeAmount,
    });
  }
}
