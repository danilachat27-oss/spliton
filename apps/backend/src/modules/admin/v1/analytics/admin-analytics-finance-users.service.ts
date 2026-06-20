import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { CACHE_TTL_MS } from '../../../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../../../common/cache/ttl-cache.service';
import {
  DepositStatus,
  Prisma,
  UserRoleCode,
  UserStatus,
  WithdrawalStatus,
} from '@prisma/client';
import { ADMIN_PANEL_ROLE_CODES } from '../../admin-panel-roles';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  assertAnalyticsArea,
  bucketByDay,
  formatMoneyRu,
  pctChange,
  resolveAnalyticsPeriod,
} from '../../common/admin-analytics.util';
import type { AdminAnalyticsQueryDto } from '../../common/dto/admin-analytics-query.dto';

const STAFF_ROLE_CODES: UserRoleCode[] = [...ADMIN_PANEL_ROLE_CODES];

function funnelStepMetrics(
  steps: Array<{ key: string; label: string; count: number }>,
) {
  const first = steps[0]?.count ?? 0;
  return steps.map((step, idx) => {
    const prev = idx > 0 ? steps[idx - 1].count : step.count;
    const conversionFromPreviousPct =
      idx === 0
        ? 100
        : prev > 0
          ? Math.round((step.count / prev) * 1000) / 10
          : 0;
    const conversionFromRegistrationPct =
      first > 0 ? Math.round((step.count / first) * 1000) / 10 : 0;
    const dropOff = idx > 0 ? Math.max(0, prev - step.count) : 0;
    return {
      ...step,
      conversionFromPreviousPct,
      conversionFromRegistrationPct,
      dropOff,
    };
  });
}

@Injectable()
export class AdminAnalyticsFinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async summary(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'finance');
    const period = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const cacheKey = `admin:analytics:finance:summary:${createHash('sha256')
      .update(
        JSON.stringify({
          period: period.key,
          from: period.from,
          to: period.to,
        }),
      )
      .digest('hex')
      .slice(0, 20)}`;
    return this.cache.getOrSet(
      cacheKey,
      CACHE_TTL_MS.adminAnalyticsSnapshot,
      () => this.buildFinanceSummary(period),
    );
  }

  private async buildFinanceSummary(
    period: ReturnType<typeof resolveAnalyticsPeriod>,
  ) {
    const { from, to, previousFrom, previousTo } = period;

    const [deposits, withdrawals, fees, balances, pendingWd, manualReview] =
      await Promise.all([
        this.sumDeposits(from, to),
        this.sumWithdrawals(from, to),
        this.sumFees(from, to),
        this.prisma.walletBalance.aggregate({
          _sum: { available: true, locked: true },
        }),
        this.prisma.withdrawal.findMany({
          where: {
            status: {
              in: [
                WithdrawalStatus.REQUESTED,
                WithdrawalStatus.PROCESSING,
                WithdrawalStatus.ON_HOLD,
              ],
            },
          },
          select: { walletTxId: true },
        }),
        this.prisma.deposit.count({
          where: {
            status: DepositStatus.MANUAL_REVIEW,
            createdAt: { gte: from, lte: to },
          },
        }),
      ]);

    const prevDeposits = await this.sumDeposits(previousFrom, previousTo);
    const prevWithdrawals = await this.sumWithdrawals(previousFrom, previousTo);

    const pendingWalletTxIds = pendingWd.map((w) => w.walletTxId);
    const pendingAmount =
      pendingWalletTxIds.length === 0
        ? new Prisma.Decimal(0)
        : (
            await this.prisma.walletTransaction.aggregate({
              where: { id: { in: pendingWalletTxIds } },
              _sum: { amount: true },
            })
          )._sum.amount ?? new Prisma.Decimal(0);

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      depositsUsdt: formatMoneyRu(deposits),
      withdrawalsUsdt: formatMoneyRu(withdrawals),
      netFlowUsdt: formatMoneyRu(deposits - withdrawals),
      feesUsdt: formatMoneyRu(fees),
      availableBalanceUsdt: formatMoneyRu(balances._sum.available ?? 0),
      lockedBalanceUsdt: formatMoneyRu(balances._sum.locked ?? 0),
      pendingWithdrawalsUsdt: formatMoneyRu(pendingAmount),
      manualReviewDeposits: manualReview,
      deltas: {
        depositsPct: pctChange(deposits, prevDeposits),
        withdrawalsPct: pctChange(withdrawals, prevWithdrawals),
        netFlowPct: pctChange(
          deposits - withdrawals,
          prevDeposits - prevWithdrawals,
        ),
      },
    };
  }

  async cashflow(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'finance');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const [depositTxs, withdrawalTxs] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: {
          txType: 'DEPOSIT',
          status: 'COMPLETED',
          happenedAt: { gte: from, lte: to },
        },
        select: { happenedAt: true, amount: true },
      }),
      this.prisma.walletTransaction.findMany({
        where: {
          txType: 'WITHDRAWAL',
          status: 'COMPLETED',
          happenedAt: { gte: from, lte: to },
        },
        select: { happenedAt: true, amount: true },
      }),
    ]);

    const deposits = bucketByDay(depositTxs, 'happenedAt', (r) =>
      Number(r.amount.toString()),
    );
    const withdrawals = bucketByDay(withdrawalTxs, 'happenedAt', (r) =>
      Number(r.amount.toString()),
    );

    const depositMap = new Map(
      deposits.map((d) => [
        d.period,
        Number(d.amountUsdt.replace(/\s/g, '').replace(',', '.')),
      ]),
    );
    const withdrawalMap = new Map(
      withdrawals.map((d) => [
        d.period,
        Number(d.amountUsdt.replace(/\s/g, '').replace(',', '.')),
      ]),
    );
    const periods = [
      ...new Set([...depositMap.keys(), ...withdrawalMap.keys()]),
    ].sort();

    return {
      items: periods.map((period) => {
        const dep = depositMap.get(period) ?? 0;
        const wd = withdrawalMap.get(period) ?? 0;
        return {
          period,
          depositsUsdt: formatMoneyRu(dep),
          withdrawalsUsdt: formatMoneyRu(wd),
          netFlowUsdt: formatMoneyRu(dep - wd),
        };
      }),
    };
  }

  async fees(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'finance');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const grouped = await this.prisma.fee.groupBy({
      by: ['feeCode'],
      where: { createdAt: { gte: from, lte: to } },
      _sum: { amountCharged: true },
    });

    return {
      items: grouped.map((g) => ({
        source: g.feeCode,
        amountUsdt: formatMoneyRu(g._sum.amountCharged ?? 0),
      })),
      totalUsdt: formatMoneyRu(
        grouped.reduce(
          (s, g) => s + Number((g._sum.amountCharged ?? 0).toString()),
          0,
        ),
      ),
    };
  }

  async withdrawalProcessing(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'finance');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const completed = await this.prisma.withdrawal.findMany({
      where: {
        status: WithdrawalStatus.COMPLETED,
        completedAt: { gte: from, lte: to },
        processedAt: { not: null },
      },
      select: { requestedAt: true, processedAt: true, completedAt: true },
    });

    const durations = completed
      .filter((w) => w.processedAt && w.requestedAt)
      .map(
        (w) =>
          (w.processedAt!.getTime() - w.requestedAt.getTime()) /
          (1000 * 60 * 60),
      );

    const avgHours =
      durations.length > 0
        ? Math.round(
            (durations.reduce((a, b) => a + b, 0) / durations.length) * 10,
          ) / 10
        : 0;

    return {
      completedCount: completed.length,
      averageProcessingHours: avgHours,
      buckets: [
        { label: '< 24 ч', count: durations.filter((h) => h < 24).length },
        {
          label: '1–3 дня',
          count: durations.filter((h) => h >= 24 && h < 72).length,
        },
        { label: '> 3 дней', count: durations.filter((h) => h >= 72).length },
      ],
    };
  }

  async failures(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'finance');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const [failedDeposits, failedWithdrawals] = await Promise.all([
      this.prisma.deposit.count({
        where: {
          status: DepositStatus.FAILED,
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.withdrawal.count({
        where: {
          status: WithdrawalStatus.FAILED,
          createdAt: { gte: from, lte: to },
        },
      }),
    ]);

    return { failedDeposits, failedWithdrawals };
  }

  private async sumDeposits(from: Date, to: Date): Promise<number> {
    const agg = await this.prisma.walletTransaction.aggregate({
      where: {
        txType: 'DEPOSIT',
        status: 'COMPLETED',
        happenedAt: { gte: from, lte: to },
      },
      _sum: { amount: true },
    });
    return Number((agg._sum.amount ?? 0).toString());
  }

  private async sumWithdrawals(from: Date, to: Date): Promise<number> {
    const agg = await this.prisma.walletTransaction.aggregate({
      where: {
        txType: 'WITHDRAWAL',
        status: 'COMPLETED',
        happenedAt: { gte: from, lte: to },
      },
      _sum: { amount: true },
    });
    return Number((agg._sum.amount ?? 0).toString());
  }

  private async sumFees(from: Date, to: Date): Promise<number> {
    const agg = await this.prisma.fee.aggregate({
      where: { createdAt: { gte: from, lte: to } },
      _sum: { amountCharged: true },
    });
    return Number((agg._sum.amountCharged ?? 0).toString());
  }
}

@Injectable()
export class AdminAnalyticsUsersService {
  constructor(private readonly prisma: PrismaService) {}

  private endUserWhere() {
    const filter: Prisma.UserWhereInput = { deletedAt: null };
    return filter;
  }

  private periodCohortWhere(from: Date, to: Date) {
    const where = this.endUserWhere();
    where.createdAt = { gte: from, lte: to };
    return where;
  }

  async summary(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'users');
    const { from, to, previousFrom, previousTo } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const base = this.periodCohortWhere(from, to);
    const dormantCutoff = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      prevNewUsers,
      activeInPeriod,
      prevActiveInPeriod,
      dormantUsers,
      usersWithRiskFlags,
      blockedUsers,
      highRiskUsers,
      withFirstDeposit,
      withFirstPurchase,
      withFirstPayout,
      withFirstWithdrawal,
      withSecondaryTrade,
      balanceNoPurchase,
      inactive30Plus,
      pendingWithdrawals,
    ] = await Promise.all([
      this.prisma.user.count({ where: this.endUserWhere() }),
      this.prisma.user.count({
        where: { ...this.endUserWhere(), status: UserStatus.ACTIVE },
      }),
      this.prisma.user.count({ where: base }),
      this.prisma.user.count({
        where: this.periodCohortWhere(previousFrom, previousTo),
      }),
      this.countUsersWithActivityInPeriod(from, to),
      this.countUsersWithActivityInPeriod(previousFrom, previousTo),
      this.countDormantUsers(dormantCutoff, to),
      this.prisma.user.count({
        where: {
          ...this.endUserWhere(),
          riskFlags: { ['some']: { isActive: true } },
        },
      }),
      this.prisma.user.count({
        where: { ...this.endUserWhere(), status: UserStatus.SUSPENDED },
      }),
      this.prisma.user.count({
        where: {
          ...this.endUserWhere(),
          riskFlags: {
            ['some']: {
              isActive: true,
              severity: { in: ['high', 'critical'] },
            },
          },
        },
      }),
      this.prisma.user.count({
        where: {
          ...base,
          wallets: {
            some: {
              transactions: {
                ['some']: { txType: 'DEPOSIT', status: 'COMPLETED' },
              },
            },
          },
        },
      }),
      this.prisma.user.count({
        where: { ...base, positions: { ['some']: {} } },
      }),
      this.prisma.user.count({ where: { ...base, payouts: { ['some']: {} } } }),
      this.prisma.user.count({
        where: {
          ...base,
          wallets: {
            some: {
              transactions: {
                ['some']: { txType: 'WITHDRAWAL', status: 'COMPLETED' },
              },
            },
          },
        },
      }),
      this.prisma.user.count({
        where: {
          ...base,
          OR: [
            {
              tradesBought: {
                ['some']: { executedAt: { gte: from, lte: to } },
              },
            },
            {
              tradesSold: { ['some']: { executedAt: { gte: from, lte: to } } },
            },
          ],
        },
      }),
      this.prisma.user.count({
        where: {
          ...this.endUserWhere(),
          wallets: {
            some: {
              balance: { available: { gt: 0 } },
              transactions: {
                ['some']: { txType: 'DEPOSIT', status: 'COMPLETED' },
              },
            },
          },
          positions: { ['none']: {} },
        },
      }),
      this.countInactiveSince(dormantCutoff),
      this.prisma.user.count({
        where: {
          ...this.endUserWhere(),
          wallets: {
            some: {
              transactions: {
                some: {
                  referenceType: 'withdrawal',
                  status: 'PENDING',
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      totalUsers,
      activeUsers,
      newUsers,
      activeInPeriod,
      dormantUsers,
      usersWithRiskFlags,
      usersWithPendingWithdrawals: pendingWithdrawals,
      blockedUsers,
      highRiskUsers,
      withFirstDeposit,
      withFirstPurchase,
      withFirstPayout,
      withFirstWithdrawal,
      withSecondaryTrade,
      balanceNoPurchase,
      inactive30Plus,
      returnedUsers: 0,
      deltas: {
        newUsersPct: pctChange(newUsers, prevNewUsers),
        activeInPeriodPct: pctChange(activeInPeriod, prevActiveInPeriod),
      },
    };
  }

  private async countUsersWithActivityInPeriod(
    from: Date,
    to: Date,
  ): Promise<number> {
    const txs = await this.prisma.walletTransaction.findMany({
      where: {
        status: 'COMPLETED',
        happenedAt: { gte: from, lte: to },
        wallet: { user: this.endUserWhere() },
      },
      select: { wallet: { select: { userId: true } } },
      distinct: ['walletId'],
    });
    const ids = new Set(txs.map((t) => t.wallet.userId));
    return ids.size;
  }

  private async countDormantUsers(cutoff: Date, to: Date): Promise<number> {
    const recent = await this.prisma.walletTransaction.findMany({
      where: {
        status: 'COMPLETED',
        happenedAt: { gte: cutoff, lte: to },
        wallet: { user: this.endUserWhere() },
      },
      select: { wallet: { select: { userId: true } } },
    });
    const activeIds = new Set(recent.map((t) => t.wallet.userId));
    const total = await this.prisma.user.count({ where: this.endUserWhere() });
    return Math.max(0, total - activeIds.size);
  }

  private async countInactiveSince(cutoff: Date): Promise<number> {
    const recent = await this.prisma.walletTransaction.findMany({
      where: {
        status: 'COMPLETED',
        happenedAt: { gte: cutoff },
        wallet: { user: this.endUserWhere() },
      },
      select: { wallet: { select: { userId: true } } },
    });
    const activeIds = new Set(recent.map((t) => t.wallet.userId));
    const total = await this.prisma.user.count({ where: this.endUserWhere() });
    return Math.max(0, total - activeIds.size);
  }

  async growth(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'users');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const registrations = await this.prisma.user.findMany({
      where: this.periodCohortWhere(from, to),
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const newUsers = bucketByDay(registrations, 'createdAt', () => 1).map(
      (b) => ({
        period: b.period,
        count: b.count,
      }),
    );

    const activityTxs = await this.prisma.walletTransaction.findMany({
      where: {
        status: 'COMPLETED',
        happenedAt: { gte: from, lte: to },
        wallet: { user: this.endUserWhere() },
      },
      select: { happenedAt: true, wallet: { select: { userId: true } } },
    });

    const activeByDay = new Map<string, Set<string>>();
    for (const tx of activityTxs) {
      const day = tx.happenedAt.toISOString().slice(0, 10);
      if (!activeByDay.has(day)) activeByDay.set(day, new Set());
      activeByDay.get(day)!.add(tx.wallet.userId);
    }
    const activeUsers = [...activeByDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, set]) => ({ period, count: set.size }));

    const beforeCount = await this.prisma.user.count({
      where: { ...this.endUserWhere(), createdAt: { lt: from } },
    });
    let running = beforeCount;
    const cumulativeUsers = newUsers.map((p) => {
      running += p.count;
      return { period: p.period, count: running };
    });

    return { newUsers, activeUsers, cumulativeUsers };
  }

  async funnel(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'users');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const base = this.periodCohortWhere(from, to);

    const [
      registered,
      verified,
      deposited,
      withPosition,
      withPayout,
      withWithdrawal,
      withTrade,
    ] = await Promise.all([
      this.prisma.user.count({ where: base }),
      this.prisma.user.count({
        where: { ...base, emailVerifiedAt: { not: null } },
      }),
      this.prisma.user.count({
        where: {
          ...base,
          wallets: {
            some: {
              transactions: {
                ['some']: { txType: 'DEPOSIT', status: 'COMPLETED' },
              },
            },
          },
        },
      }),
      this.prisma.user.count({
        where: { ...base, positions: { ['some']: {} } },
      }),
      this.prisma.user.count({ where: { ...base, payouts: { ['some']: {} } } }),
      this.prisma.user.count({
        where: {
          ...base,
          wallets: {
            some: {
              transactions: {
                ['some']: { txType: 'WITHDRAWAL', status: 'COMPLETED' },
              },
            },
          },
        },
      }),
      this.prisma.user.count({
        where: {
          ...base,
          OR: [
            {
              tradesBought: {
                ['some']: { executedAt: { gte: from, lte: to } },
              },
            },
            {
              tradesSold: { ['some']: { executedAt: { gte: from, lte: to } } },
            },
          ],
        },
      }),
    ]);

    const raw = [
      { key: 'registration', label: 'Регистрация', count: registered },
      {
        key: 'email_verified',
        label: 'Email / аккаунт активен',
        count: verified,
      },
      { key: 'first_deposit', label: 'Первый депозит', count: deposited },
      {
        key: 'first_units',
        label: 'Первая покупка юнитов',
        count: withPosition,
      },
      { key: 'first_payout', label: 'Первое начисление', count: withPayout },
      { key: 'first_withdrawal', label: 'Первый вывод', count: withWithdrawal },
      {
        key: 'first_secondary_trade',
        label: 'Первая сделка на вторичном рынке',
        count: withTrade,
      },
    ];

    return { steps: funnelStepMetrics(raw) };
  }

  async segments(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'users');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const total = await this.prisma.user.count({ where: this.endUserWhere() });

    const byStatus = await this.prisma.user.groupBy({
      by: ['status'],
      where: this.endUserWhere(),
      _count: { id: true },
    });

    const roleGroups = await this.prisma.userRole.groupBy({
      by: ['roleId'],
      where: { user: this.endUserWhere() },
      _count: { userId: true },
    });
    const roleRows = await this.prisma.role.findMany({
      where: { id: { in: roleGroups.map((g) => g.roleId) } },
    });
    const roleMap = new Map(roleRows.map((r) => [r.id, r.code]));

    const byRole = roleGroups
      .filter(
        (g) =>
          !STAFF_ROLE_CODES.includes(roleMap.get(g.roleId) as UserRoleCode),
      )
      .map((g) => ({
        key: (roleMap.get(g.roleId) ?? 'unknown').toLowerCase(),
        label: roleMap.get(g.roleId) ?? 'unknown',
        count: g._count.userId,
      }));

    const dormantCutoff = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [
      newCount,
      depositedCount,
      holdersCount,
      secondaryCount,
      dormantCount,
      highValueCount,
      riskCount,
      blockedCount,
    ] = await Promise.all([
      this.prisma.user.count({ where: this.periodCohortWhere(from, to) }),
      this.prisma.user.count({
        where: {
          ...this.endUserWhere(),
          wallets: {
            some: {
              transactions: {
                ['some']: { txType: 'DEPOSIT', status: 'COMPLETED' },
              },
            },
          },
        },
      }),
      this.prisma.user.count({
        where: { ...this.endUserWhere(), positions: { ['some']: {} } },
      }),
      this.prisma.user.count({
        where: {
          ...this.endUserWhere(),
          OR: [
            { tradesBought: { ['some']: {} } },
            { tradesSold: { ['some']: {} } },
          ],
        },
      }),
      this.countDormantUsers(dormantCutoff, to),
      this.prisma.user.count({
        where: {
          ...this.endUserWhere(),
          wallets: { ['some']: { balance: { available: { gte: 10000 } } } },
        },
      }),
      this.prisma.user.count({
        where: {
          ...this.endUserWhere(),
          riskFlags: { ['some']: { isActive: true } },
        },
      }),
      this.prisma.user.count({
        where: { ...this.endUserWhere(), status: UserStatus.SUSPENDED },
      }),
    ]);

    const share = (n: number) =>
      total > 0 ? Math.round((n / total) * 1000) / 10 : 0;

    const lifecycle = [
      {
        key: 'new',
        label: 'Новые',
        count: newCount,
        sharePct: share(newCount),
      },
      {
        key: 'deposited',
        label: 'С депозитом',
        count: depositedCount,
        sharePct: share(depositedCount),
      },
      {
        key: 'holders',
        label: 'Держатели',
        count: holdersCount,
        sharePct: share(holdersCount),
      },
      {
        key: 'secondary_active',
        label: 'Вторичный рынок',
        count: secondaryCount,
        sharePct: share(secondaryCount),
      },
      {
        key: 'dormant',
        label: 'Dormant',
        count: dormantCount,
        sharePct: share(dormantCount),
      },
      {
        key: 'high_value',
        label: 'High value',
        count: highValueCount,
        sharePct: share(highValueCount),
      },
      {
        key: 'risk',
        label: 'Risk users',
        count: riskCount,
        sharePct: share(riskCount),
      },
      {
        key: 'blocked',
        label: 'Blocked',
        count: blockedCount,
        sharePct: share(blockedCount),
      },
    ];

    const balances = await this.prisma.walletBalance.findMany({
      where: { wallet: { user: this.endUserWhere() } },
      select: { available: true, wallet: { select: { userId: true } } },
    });
    const byUser = new Map<string, number>();
    for (const b of balances) {
      const uid = b.wallet.userId;
      byUser.set(uid, (byUser.get(uid) ?? 0) + Number(b.available.toString()));
    }
    const buckets = [
      { key: '0', label: '0 USDT', min: 0, max: 0 },
      { key: '0-100', label: '0–100 USDT', min: 0.01, max: 100 },
      { key: '100-1000', label: '100–1 000 USDT', min: 100.01, max: 1000 },
      {
        key: '1000-10000',
        label: '1 000–10 000 USDT',
        min: 1000.01,
        max: 10000,
      },
      { key: '10000+', label: '10 000+ USDT', min: 10000.01, max: Infinity },
    ];
    const byBalanceBucket = buckets.map((b) => {
      let count = 0;
      for (const avail of byUser.values()) {
        if (b.max === 0 && avail === 0) count += 1;
        else if (avail >= b.min && avail <= b.max) count += 1;
      }
      if (b.key === '0') {
        const withWallet = byUser.size;
        count =
          Math.max(0, total - withWallet) +
          [...byUser.values()].filter((v) => v === 0).length;
      }
      return { key: b.key, label: b.label, count };
    });

    return {
      total,
      byStatus: byStatus.map((s) => ({
        key: s.status.toLowerCase(),
        label: s.status,
        count: s._count.id,
      })),
      byRole,
      lifecycle,
      byBalanceBucket,
    };
  }

  async financialSegments(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'users');
    const segments = await this.segments(roles, query);
    const [balanceNoPurchase, lockedBalance, pendingWd, depositNoUnits] =
      await Promise.all([
        this.prisma.user.count({
          where: {
            ...this.endUserWhere(),
            wallets: {
              some: {
                balance: { available: { gt: 0 } },
                transactions: {
                  ['some']: { txType: 'DEPOSIT', status: 'COMPLETED' },
                },
              },
            },
            positions: { ['none']: {} },
          },
        }),
        this.prisma.user.count({
          where: {
            ...this.endUserWhere(),
            wallets: { ['some']: { balance: { locked: { gt: 0 } } } },
          },
        }),
        this.prisma.user.count({
          where: {
            ...this.endUserWhere(),
            wallets: {
              some: {
                transactions: {
                  some: {
                    referenceType: 'withdrawal',
                    status: 'PENDING',
                  },
                },
              },
            },
          },
        }),
        this.prisma.user.count({
          where: {
            ...this.endUserWhere(),
            wallets: {
              some: {
                transactions: {
                  ['some']: { txType: 'DEPOSIT', status: 'COMPLETED' },
                },
              },
            },
            positions: { ['none']: {} },
          },
        }),
      ]);

    return {
      buckets: segments.byBalanceBucket,
      cohorts: [
        {
          key: 'balance_no_purchase',
          label: 'Баланс без покупки юнитов',
          count: balanceNoPurchase,
        },
        {
          key: 'locked_balance',
          label: 'С locked balance',
          count: lockedBalance,
        },
        {
          key: 'pending_withdrawal',
          label: 'Pending withdrawal',
          count: pendingWd,
        },
        {
          key: 'deposit_no_units',
          label: 'Депозит без юнитов',
          count: depositNoUnits,
        },
      ],
    };
  }

  async dormant(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'users');
    const { to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const limit = Math.min(query.limit ?? 15, 50);
    const now = to.getTime();

    const cutoffs = [
      { key: '7', label: '7+ дней', days: 7 },
      { key: '30', label: '30+ дней', days: 30 },
      { key: '60', label: '60+ дней', days: 60 },
      { key: '90', label: '90+ дней', days: 90 },
    ];

    const inactiveBuckets: Array<{
      key: string;
      label: string;
      count: number;
    }> = [];
    for (const c of cutoffs) {
      const cutoff = new Date(now - c.days * 24 * 60 * 60 * 1000);
      inactiveBuckets.push({
        key: c.key,
        label: c.label,
        count: await this.countInactiveSince(cutoff),
      });
    }

    const dormantCutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const dormantCount = await this.countDormantUsers(dormantCutoff, to);

    const users = await this.prisma.user.findMany({
      where: this.endUserWhere(),
      take: 200,
      select: {
        id: true,
        email: true,
        wallets: {
          select: {
            balance: { select: { available: true } },
            transactions: {
              where: { status: 'COMPLETED' },
              orderBy: { happenedAt: 'desc' },
              take: 1,
              select: { happenedAt: true },
            },
          },
        },
        positions: { select: { unitsTotal: true } },
      },
    });

    const items = users
      .map((u) => {
        const lastTx = u.wallets
          .flatMap((w) => w.transactions)
          .sort((a, b) => b.happenedAt.getTime() - a.happenedAt.getTime())[0];
        const lastAt = lastTx?.happenedAt ?? null;
        const dormantDays = lastAt
          ? Math.floor((now - lastAt.getTime()) / (24 * 60 * 60 * 1000))
          : 999;
        const available = u.wallets.reduce(
          (s, w) => s + Number((w.balance?.available ?? 0).toString()),
          0,
        );
        const units = u.positions.reduce(
          (s, p) => s + Number(p.unitsTotal.toString()),
          0,
        );
        return {
          userId: u.id,
          email: u.email,
          lastActivityAt: lastAt?.toISOString() ?? null,
          dormantDays,
          availableBalanceUsdt: formatMoneyRu(available),
          holdingsUnits: units.toFixed(2),
        };
      })
      .filter((r) => r.dormantDays >= 30)
      .sort((a, b) => b.dormantDays - a.dormantDays)
      .slice(0, limit);

    return { dormantCount, inactiveBuckets, items };
  }

  async riskUsers(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'users');
    const limit = Math.min(query.limit ?? 15, 50);

    const flags = await this.prisma.riskFlag.findMany({
      where: { isActive: true, user: this.endUserWhere() },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: { user: { select: { id: true, email: true, status: true } } },
    });

    return {
      items: flags.map((f) => ({
        userId: f.userId,
        email: f.user?.email ?? '—',
        severity: f.severity,
        ruleCode: f.flagCode,
        entityType: f.entityType,
        status: f.status.toLowerCase(),
        updatedAt: f.updatedAt.toISOString(),
        userStatus: f.user?.status?.toLowerCase() ?? 'unknown',
      })),
    };
  }

  async topHolders(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'users');
    const limit = Math.min(query.limit ?? 10, 50);

    const rows = await this.prisma.userPosition.groupBy({
      by: ['userId'],
      _sum: { unitsTotal: true },
      _count: { id: true },
      orderBy: { _sum: { unitsTotal: 'desc' } },
      take: limit,
    });

    const userIds = rows.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        wallets: {
          include: {
            balance: true,
            transactions: { orderBy: { happenedAt: 'desc' }, take: 1 },
          },
        },
        riskFlags: { where: { isActive: true }, take: 1 },
        positions: { select: { unitsTotal: true, avgEntryPrice: true } },
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      items: rows.map((r) => {
        const u = userMap.get(r.userId);
        const units = Number((r._sum.unitsTotal ?? 0).toString());
        const value = (u?.positions ?? []).reduce(
          (s, p) =>
            s +
            Number(p.unitsTotal.toString()) *
              Number(p.avgEntryPrice.toString()),
          0,
        );
        const available = (u?.wallets ?? []).reduce(
          (s, w) => s + Number((w.balance?.available ?? 0).toString()),
          0,
        );
        const lastTx = (u?.wallets ?? [])
          .flatMap((w) => w.transactions)
          .sort((a, b) => b.happenedAt.getTime() - a.happenedAt.getTime())[0];

        return {
          userId: r.userId,
          email: u?.email ?? '—',
          units: units.toFixed(2),
          totalUnits: units.toFixed(2),
          holdingsCount: r._count.id,
          valueUsdt: formatMoneyRu(value),
          availableBalanceUsdt: formatMoneyRu(available),
          earnedTotalUsdt: formatMoneyRu(0),
          riskStatus: u?.riskFlags[0]?.severity ?? 'none',
          lastActivityAt: lastTx?.happenedAt.toISOString() ?? null,
        };
      }),
    };
  }
}
