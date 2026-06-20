import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  ActorRole,
  LedgerOperationType,
  NotificationSeverity,
  PartnerStatus,
  Prisma,
  ReferralRewardEventType,
  ReferralRewardStatus,
  ReferralRewardType,
  WalletTxDirection,
  WalletTxStatus,
  WalletTxType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { WalletLedgerService } from '../admin/common/wallet-ledger.service';
import { AdminAuditService } from '../admin/common/admin-audit.service';
import { NotificationService } from '../notifications/notification.service';
import { UserWalletService } from '../wallets/user-wallet.service';
import { ReferralRulesService } from './referral-rules.service';

const AUTO_APPROVE_MAX = new Prisma.Decimal(25);
const HOLD_REVIEW_MIN = new Prisma.Decimal(100);

@Injectable()
export class ReferralRewardsService {
  private readonly logger = new Logger(ReferralRewardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rules: ReferralRulesService,
    private readonly ledger: WalletLedgerService,
    private readonly wallets: UserWalletService,
    private readonly audit: AdminAuditService,
    private readonly notifications: NotificationService,
  ) {}

  async processEvent(params: {
    referredUserId: string;
    eventType: ReferralRewardEventType;
    sourceEntityType?: string;
    sourceEntityId?: string;
    grossAmount?: Prisma.Decimal;
    feeAmount?: Prisma.Decimal;
  }) {
    const attribution = await this.prisma.referralAttribution.findUnique({
      where: { referredUserId: params.referredUserId },
    });
    if (!attribution) return null;

    const referrerUserId = attribution.referrerUserId;
    if (referrerUserId === params.referredUserId) return null;

    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId: referrerUserId },
    });
    if (partner?.status === PartnerStatus.SUSPENDED) return null;

    const referredRisk = await this.prisma.riskFlag.findFirst({
      where: {
        userId: params.referredUserId,
        isActive: true,
        severity: { in: ['high', 'critical'] },
      },
    });

    const fraud = await this.prisma.riskFlag.findFirst({
      where: {
        userId: referrerUserId,
        isActive: true,
        flagCode: {
          in: [
            'REFERRAL_SELF_ATTEMPT',
            'PARTNER_FRAUD_SUSPECTED',
            'REFERRAL_MULTI_ACCOUNT_SUSPECTED',
          ],
        },
      },
    });
    if (fraud) return null;

    const rule = await this.rules.findActiveRule(params.eventType);
    if (!rule) return null;

    let amount = new Prisma.Decimal(0);
    if (rule.rewardType === ReferralRewardType.FIXED && rule.fixedAmount) {
      amount = rule.fixedAmount;
    } else if (
      rule.rewardType === ReferralRewardType.PERCENT_FEE &&
      rule.percentage &&
      params.feeAmount
    ) {
      const pct =
        partner?.status === PartnerStatus.APPROVED && partner.commissionPercent
          ? partner.commissionPercent
          : rule.percentage;
      amount = params.feeAmount.mul(pct).div(100);
      if (rule.maxReward && amount.greaterThan(rule.maxReward)) {
        amount = rule.maxReward;
      }
    } else {
      return null;
    }

    if (amount.lessThanOrEqualTo(0)) return null;

    if (rule.minDeposit && params.eventType === ReferralRewardEventType.FIRST_DEPOSIT) {
      const dep = params.grossAmount ?? new Prisma.Decimal(0);
      if (dep.lessThan(rule.minDeposit)) return null;
    }

    let status: ReferralRewardStatus = ReferralRewardStatus.PENDING;
    if (referredRisk) {
      status = ReferralRewardStatus.HELD_FOR_REVIEW;
      await this.prisma.riskFlag.create({
        data: {
          userId: referrerUserId,
          flagCode: 'REWARD_HELD_FOR_REVIEW',
          severity: 'medium',
          note: 'Referred user high risk — reward held',
          entityType: 'referral_reward',
        },
      });
    } else if (amount.greaterThan(HOLD_REVIEW_MIN)) {
      status = ReferralRewardStatus.HELD_FOR_REVIEW;
      await this.prisma.riskFlag.create({
        data: {
          userId: referrerUserId,
          flagCode: 'REWARD_HELD_FOR_REVIEW',
          severity: 'medium',
          note: `Referral reward ${amount} USDT held for review`,
          entityType: 'referral_reward',
        },
      });
      void this.notifications.notifyAdminRoles(
        ['COMPLIANCE', 'SUPER_ADMIN'],
        {
          type: 'referral.reward.held',
          category: 'compliance',
          title: 'Начисление реферала на проверке',
          message: `Сумма ${amount} USDT требует проверки compliance.`,
          severity: NotificationSeverity.WARNING,
        },
      );
    } else if (amount.lessThanOrEqualTo(AUTO_APPROVE_MAX)) {
      status = ReferralRewardStatus.APPROVED;
    } else {
      status = ReferralRewardStatus.QUALIFIED;
    }

    try {
      const reward = await this.prisma.referralReward.create({
        data: {
          referrerUserId,
          referredUserId: params.referredUserId,
          partnerProfileId: partner?.id,
          eventType: params.eventType,
          sourceEntityType: params.sourceEntityType,
          sourceEntityId: params.sourceEntityId,
          amount,
          status,
          ruleId: rule.id,
          qualifiedAt:
            status === ReferralRewardStatus.QUALIFIED ||
            status === ReferralRewardStatus.APPROVED
              ? new Date()
              : null,
          approvedAt:
            status === ReferralRewardStatus.APPROVED ? new Date() : null,
        },
      });

      if (status === ReferralRewardStatus.APPROVED) {
        await this.payReward(reward.id, 'system');
      }

      void this.notifications.notifyUser(referrerUserId, {
        type: 'referral.reward.created',
        category: 'referral',
        title: 'Реферальное начисление',
        message: `Начисление ${amount} USDT за событие ${params.eventType}.`,
        idempotencyKey: `referral-reward:${reward.id}`,
      });

      return reward;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return null;
      }
      throw e;
    }
  }

  async payReward(rewardId: string, actorUserId: string) {
    const reward = await this.prisma.referralReward.findUnique({
      where: { id: rewardId },
    });
    if (!reward) {
      throwAdminError('REWARD_NOT_FOUND', 'Reward not found', HttpStatus.NOT_FOUND);
    }
    if (reward!.status === ReferralRewardStatus.PAID) return reward;
    if (
      reward!.status !== ReferralRewardStatus.APPROVED &&
      reward!.status !== ReferralRewardStatus.QUALIFIED
    ) {
      throwAdminError(
        'REWARD_NOT_APPROVED',
        'Reward is not approved for payout',
        HttpStatus.CONFLICT,
      );
    }

    const wallet = await this.wallets.getOrCreateWallet(reward!.referrerUserId);

    await this.prisma.$transaction(async (tx) => {
      await this.ledger.creditAvailable(tx, wallet.id, reward!.amount, {
        operationType: LedgerOperationType.REFERRAL_REWARD,
        sourceEntityType: 'referral_reward',
        sourceEntityId: reward!.id,
        actorUserId,
        actorRole: ActorRole.SYSTEM,
        currency: reward!.currency,
        idempotencyKey: `referral-reward-pay:${reward!.id}`,
      });

      await this.ledger.createWalletTransaction(tx, {
        walletId: wallet.id,
        txType: WalletTxType.ADMIN_ADJUSTMENT,
        direction: WalletTxDirection.IN,
        amount: reward!.amount,
        feeAmount: new Prisma.Decimal(0),
        netAmount: reward!.amount,
        currency: reward!.currency,
        status: WalletTxStatus.COMPLETED,
        referenceType: 'referral_reward',
        referenceId: reward!.id,
        ctx: {
          operationType: LedgerOperationType.REFERRAL_REWARD,
          sourceEntityType: 'referral_reward',
          sourceEntityId: reward!.id,
          actorUserId,
          actorRole: ActorRole.SYSTEM,
          currency: reward!.currency,
          idempotencyKey: `referral-reward-tx:${reward!.id}`,
        },
      });

      await tx.referralReward.update({
        where: { id: rewardId },
        data: {
          status: ReferralRewardStatus.PAID,
          paidAt: new Date(),
          approvedAt: reward!.approvedAt ?? new Date(),
        },
      });
    });

    void this.notifications.notifyUser(reward!.referrerUserId, {
      type: 'referral.reward.paid',
      category: 'referral',
      title: 'Реферальное вознаграждение выплачено',
      message: `${reward!.amount} USDT зачислено на баланс Spliton.`,
      idempotencyKey: `referral-paid:${reward!.id}`,
    });

    return this.prisma.referralReward.findUnique({ where: { id: rewardId } });
  }

  async approveReward(rewardId: string, actorUserId: string, roles: string[]) {
    const reward = await this.prisma.referralReward.update({
      where: { id: rewardId },
      data: {
        status: ReferralRewardStatus.APPROVED,
        approvedAt: new Date(),
      },
    });
    await this.audit.logOperatorAction({
      actorUserId,
      actorRoles: roles,
      entityType: 'referral_reward',
      entityId: rewardId,
      action: 'referral.reward.approve',
    });
    return this.payReward(rewardId, actorUserId);
  }

  async rejectReward(
    rewardId: string,
    reason: string,
    actorUserId: string,
    roles: string[],
  ) {
    const row = await this.prisma.referralReward.update({
      where: { id: rewardId },
      data: {
        status: ReferralRewardStatus.REJECTED,
        rejectedReason: reason,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId,
      actorRoles: roles,
      entityType: 'referral_reward',
      entityId: rewardId,
      action: 'referral.reward.reject',
      after: { reason },
    });
    void this.notifications.notifyUser(row.referrerUserId, {
      type: 'referral.reward.rejected',
      category: 'referral',
      title: 'Реферальное начисление отклонено',
      message: reason,
    });
    return row;
  }
}
