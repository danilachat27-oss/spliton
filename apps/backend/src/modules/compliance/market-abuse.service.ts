import { Injectable } from '@nestjs/common';
import { WithdrawalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const RAPID_PAIR_WINDOW_MS = 6 * 60 * 60 * 1000;
const RAPID_PAIR_COUNT = 3;
const DEPOSIT_TRADE_WITHDRAW_HOURS = 24;

@Injectable()
export class MarketAbuseService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateAfterTrade(params: {
    buyerUserId: string;
    sellerUserId: string;
    releaseId: string;
    tradeId: string;
  }): Promise<string[]> {
    const flags: string[] = [];
    if (params.buyerUserId === params.sellerUserId) {
      flags.push('self_trade_direct');
    }

    const since = new Date(Date.now() - RAPID_PAIR_WINDOW_MS);
    const pairCount = await this.prisma.trade.count({
      where: {
        releaseId: params.releaseId,
        OR: [
          { buyerUserId: params.buyerUserId, sellerUserId: params.sellerUserId },
          { buyerUserId: params.sellerUserId, sellerUserId: params.buyerUserId },
        ],
        executedAt: { gte: since },
      },
    });
    if (pairCount >= RAPID_PAIR_COUNT) {
      flags.push('rapid_pair_trading');
    }

    const depositSince = new Date(Date.now() - DEPOSIT_TRADE_WITHDRAW_HOURS * 3_600_000);
    const walletIds = (
      await this.prisma.wallet.findMany({
        where: { userId: params.buyerUserId },
        select: { id: true },
      })
    ).map((w) => w.id);
    const [recentDeposit, recentWithdrawal] = await Promise.all([
      this.prisma.walletTransaction.count({
        where: {
          walletId: { in: walletIds },
          txType: 'DEPOSIT',
          status: 'COMPLETED',
          happenedAt: { gte: depositSince },
        },
      }),
      this.prisma.withdrawal.count({
        where: {
          walletTx: { walletId: { in: walletIds } },
          requestedAt: { gte: depositSince },
          status: {
            notIn: [WithdrawalStatus.CANCELLED, WithdrawalStatus.FAILED],
          },
        },
      }),
    ]);
    if (recentDeposit > 0 && recentWithdrawal > 0) {
      flags.push('deposit_trade_withdraw_pattern');
    }

    return flags;
  }

  async evaluateListingManipulation(userId: string, listingId: string): Promise<string[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const churn = await this.prisma.marketListing.count({
      where: {
        sellerUserId: userId,
        updatedAt: { gte: since },
        status: { in: ['CANCELLED', 'ACTIVE'] },
      },
    });
    return churn >= 5 ? ['rapid_cancel_relist'] : [];
  }
}
