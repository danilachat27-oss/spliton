import { Injectable } from '@nestjs/common';
import { WithdrawalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FeatureFlagsService } from '../../common/platform/feature-flags/feature-flags.service';
import { TreasuryAccountsService } from './treasury-accounts.service';
import { OperationalLimitsService } from './operational-limits.service';
import { TreasuryReconciliationService } from './treasury-reconciliation.service';

@Injectable()
export class TreasuryConsoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: TreasuryAccountsService,
    private readonly limits: OperationalLimitsService,
    private readonly reconciliation: TreasuryReconciliationService,
    private readonly flags: FeatureFlagsService,
  ) {}

  async getConsoleSummary() {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);

    const [
      accounts,
      limits,
      pendingWithdrawals,
      approvalQueue,
      openDiscrepancies,
      completedTodayOutflow,
      depositWatcher,
    ] = await Promise.all([
      this.accounts.listAccounts(),
      this.limits.getLimits(),
      this.prisma.withdrawal.count({
        where: {
          status: {
            in: [
              WithdrawalStatus.REQUESTED,
              WithdrawalStatus.LOCKED,
              WithdrawalStatus.APPROVED,
              WithdrawalStatus.PROCESSING,
              WithdrawalStatus.REVIEW,
              WithdrawalStatus.ON_HOLD,
            ],
          },
        },
      }),
      this.prisma.withdrawal.count({
        where: {
          status: {
            in: [
              WithdrawalStatus.REQUESTED,
              WithdrawalStatus.LOCKED,
              WithdrawalStatus.REVIEW,
            ],
          },
        },
      }),
      this.reconciliation.listOpenDiscrepancies(10),
      this.prisma.withdrawal.findMany({
        where: {
          status: WithdrawalStatus.COMPLETED,
          completedAt: { gte: dayStart },
        },
        select: { walletTx: { select: { netAmount: true } } },
      }),
      this.prisma.depositWatcherState.findFirst({
        where: { assetCode: 'USDT' },
      }),
    ]);

    const dailyOutflow = completedTodayOutflow.reduce(
      (s, w) => s + Number(w.walletTx.netAmount.toString()),
      0,
    );

    const hot = accounts.find((a) => a.type === 'HOT_WALLET');
    const cold = accounts.find((a) => a.type === 'COLD_WALLET');

    return {
      generatedAt: new Date().toISOString(),
      featureFlags: this.flags.snapshot(),
      limits,
      hotWallet: hot
        ? {
            configured: Boolean(hot.address),
            address: hot.address,
            balanceExpected: hot.balanceExpected.toString(),
            balanceObserved: hot.balanceObserved?.toString() ?? null,
            minThreshold: hot.minBalanceThreshold?.toString() ?? null,
            maxThreshold: hot.maxBalanceThreshold?.toString() ?? null,
            lastReconciledAt: hot.lastReconciledAt?.toISOString() ?? null,
          }
        : null,
      coldWallet: cold
        ? {
            configured: Boolean(cold.address),
            address: cold.address,
            note: 'Cold wallet — manual/external only, no automated send from app',
          }
        : null,
      pendingWithdrawals,
      approvalQueue,
      dailyOutflowUsdt: dailyOutflow.toFixed(2),
      openDiscrepancyCount: openDiscrepancies.length,
      openDiscrepancies: openDiscrepancies.map((d) => ({
        id: d.id,
        accountType: d.treasuryAccount.type,
        delta: d.deltaAmount.toString(),
        severity: d.severity,
      })),
      depositIngestion: depositWatcher
        ? {
            status: depositWatcher.status,
            lastRunAt: depositWatcher.lastRunAt?.toISOString() ?? null,
          }
        : null,
      lawyerReviewRequired: false,
    };
  }
}
