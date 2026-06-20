import { Injectable } from '@nestjs/common';
import {
  LedgerAccount,
  Prisma,
  TreasuryAccountType,
  TreasuryDiscrepancySeverity,
  TreasuryDiscrepancyStatus,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TreasuryAccountsService } from './treasury-accounts.service';

@Injectable()
export class TreasuryReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: TreasuryAccountsService,
  ) {}

  /** Dry-run: compare computed liabilities vs treasury account balances. */
  async runReconciliation(options: {
    dryRun: boolean;
    startedByUserId?: string | null;
  }) {
    const accounts = await this.prisma.treasuryAccount.findMany();
    const userLiability = await this.computeUserLiabilities();
    const platformFees = await this.computePlatformFeesBalance();
    const pendingWithdrawals = await this.computePendingWithdrawals();
    const pendingDeposits = await this.computePendingDeposits();

    const expectedByType = new Map<TreasuryAccountType, Prisma.Decimal>([
      [TreasuryAccountType.USER_LIABILITY, userLiability],
      [TreasuryAccountType.PLATFORM_FEES, platformFees],
      [TreasuryAccountType.WITHDRAWAL_CLEARING, pendingWithdrawals],
      [TreasuryAccountType.DEPOSIT_CLEARING, pendingDeposits],
    ]);

    const discrepancies: Array<{
      treasuryAccountId: string;
      type: TreasuryAccountType;
      expected: Prisma.Decimal;
      observed: Prisma.Decimal;
      delta: Prisma.Decimal;
      severity: TreasuryDiscrepancySeverity;
    }> = [];

    for (const account of accounts) {
      const expected =
        expectedByType.get(account.type) ?? account.balanceExpected;
      const observed =
        account.balanceObserved ?? account.balanceExpected;
      const delta = observed.sub(expected).abs();
      if (delta.greaterThan(new Prisma.Decimal('0.000001'))) {
        discrepancies.push({
          treasuryAccountId: account.id,
          type: account.type,
          expected,
          observed,
          delta,
          severity: this.severityForDelta(delta, expected),
        });
      }
    }

    if (options.dryRun) {
      return {
        dryRun: true,
        discrepancyCount: discrepancies.length,
        items: discrepancies.map((d) => ({
          ...d,
          expected: d.expected.toString(),
          observed: d.observed.toString(),
          delta: d.delta.toString(),
        })),
      };
    }

    const run = await this.prisma.treasuryReconciliationRun.create({
      data: {
        dryRun: false,
        discrepancyCount: discrepancies.length,
        startedByUserId: options.startedByUserId ?? null,
        completedAt: new Date(),
        reportSummary: {
          userLiability: userLiability.toString(),
          platformFees: platformFees.toString(),
        },
        items: {
          create: discrepancies.map((d) => ({
            treasuryAccountId: d.treasuryAccountId,
            expectedAmount: d.expected,
            observedAmount: d.observed,
            deltaAmount: d.delta,
            severity: d.severity,
            status: TreasuryDiscrepancyStatus.OPEN,
          })),
        },
      },
      include: { items: true },
    });

    for (const account of accounts) {
      const exp = expectedByType.get(account.type);
      if (exp) {
        await this.prisma.treasuryAccount.update({
          where: { id: account.id },
          data: {
            balanceExpected: exp,
            lastReconciledAt: new Date(),
          },
        });
      }
    }

    if (discrepancies.some((d) => d.severity === TreasuryDiscrepancySeverity.CRITICAL)) {
      await this.accounts.checkHotWalletThresholds();
    }

    return run;
  }

  async resolveDiscrepancy(
    itemId: string,
    actorUserId: string,
    reason: string,
    status: TreasuryDiscrepancyStatus = TreasuryDiscrepancyStatus.RESOLVED,
  ) {
    return this.prisma.treasuryReconciliationItem.update({
      where: { id: itemId },
      data: {
        status,
        resolveReason: reason.trim(),
        resolvedByUserId: actorUserId,
        resolvedAt: new Date(),
      },
    });
  }

  async listOpenDiscrepancies(limit = 50) {
    return this.prisma.treasuryReconciliationItem.findMany({
      where: { status: TreasuryDiscrepancyStatus.OPEN },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { treasuryAccount: true, run: true },
    });
  }

  private async computeUserLiabilities() {
    const balances = await this.prisma.walletBalance.findMany({
      select: { available: true, locked: true, pending: true },
    });
    return balances.reduce(
      (s, b) => s.add(b.available).add(b.locked).add(b.pending),
      new Prisma.Decimal(0),
    );
  }

  private async computePlatformFeesBalance() {
    const agg = await this.prisma.ledgerPosting.aggregate({
      where: { ledgerAccount: LedgerAccount.PLATFORM_FEE },
      _sum: { amount: true },
    });
    return agg._sum.amount ?? new Prisma.Decimal(0);
  }

  private async computePendingWithdrawals() {
    const rows = await this.prisma.withdrawal.findMany({
      where: {
        status: {
          in: [
            WithdrawalStatus.REQUESTED,
            WithdrawalStatus.LOCKED,
            WithdrawalStatus.REVIEW,
            WithdrawalStatus.APPROVED,
            WithdrawalStatus.PROCESSING,
            WithdrawalStatus.ON_HOLD,
          ],
        },
      },
      include: { walletTx: { select: { amount: true } } },
    });
    return rows.reduce(
      (s, w) => s.add(w.walletTx.amount),
      new Prisma.Decimal(0),
    );
  }

  private async computePendingDeposits() {
    const rows = await this.prisma.deposit.findMany({
      where: {
        status: {
          in: [
            'PENDING',
            'CONFIRMING',
            'MANUAL_REVIEW',
            'DETECTED',
            'PENDING_CONFIRMATIONS',
          ],
        },
      },
      include: { walletTx: { select: { netAmount: true } } },
    });
    return rows.reduce(
      (s, d) => s.add(d.walletTx?.netAmount ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0),
    );
  }

  private severityForDelta(
    delta: Prisma.Decimal,
    expected: Prisma.Decimal,
  ): TreasuryDiscrepancySeverity {
    if (expected.isZero()) {
      return delta.greaterThan(100)
        ? TreasuryDiscrepancySeverity.CRITICAL
        : TreasuryDiscrepancySeverity.MEDIUM;
    }
    const ratio = delta.div(expected).abs();
    if (ratio.greaterThan(0.05)) return TreasuryDiscrepancySeverity.CRITICAL;
    if (ratio.greaterThan(0.01)) return TreasuryDiscrepancySeverity.HIGH;
    if (ratio.greaterThan(0.001)) return TreasuryDiscrepancySeverity.MEDIUM;
    return TreasuryDiscrepancySeverity.LOW;
  }
}
