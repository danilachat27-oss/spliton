import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { CACHE_TTL_MS } from '../../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../../common/cache/ttl-cache.service';
import {
  DepositStatus,
  ListingStatus,
  Prisma,
  PrimaryRaiseRoundStatus,
  ReleaseStatus,
  ReportJobStatus,
  UserStatus,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { throwAdminError } from '../common/admin-http.util';
import {
  formatMoneyRu,
  pctChange,
  resolveAnalyticsPeriod,
} from '../common/admin-analytics.util';
import type { AdminAnalyticsQueryDto } from '../common/dto/admin-analytics-query.dto';
import { mapDeposit } from './mappers/admin-deposit.mapper';
import { mapWithdrawal } from './mappers/admin-withdrawal.mapper';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async summary(roles: string[], query?: AdminAnalyticsQueryDto) {
    this.assertView(roles);
    const period = resolveAnalyticsPeriod(
      query?.period,
      query?.dateFrom,
      query?.dateTo,
    );
    const cacheKey = `admin:dashboard:summary:${createHash('sha256')
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
      () => this.buildSummary(period),
    );
  }

  private async buildSummary(
    period: ReturnType<typeof resolveAnalyticsPeriod>,
  ) {
    const { from, to, previousFrom, previousTo } = period;

    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalTracks,
      activeRounds,
      depositAgg,
      withdrawalAgg,
      prevDepositAgg,
      prevWithdrawalAgg,
      pendingWithdrawals,
      payoutAgg,
      feeAgg,
      activeListings,
      completedTrades,
      balances,
      openRiskFlags,
      openTickets,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { status: UserStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: from, lte: to }, deletedAt: null },
      }),
      this.prisma.release.count({
        where: { deletedAt: null, status: { not: ReleaseStatus.ARCHIVED } },
      }),
      this.prisma.primaryRaiseRound.count({
        where: { status: PrimaryRaiseRoundStatus.LIVE },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          txType: 'DEPOSIT',
          status: 'COMPLETED',
          happenedAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          txType: 'WITHDRAWAL',
          status: 'COMPLETED',
          happenedAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          txType: 'DEPOSIT',
          status: 'COMPLETED',
          happenedAt: { gte: previousFrom, lte: previousTo },
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          txType: 'WITHDRAWAL',
          status: 'COMPLETED',
          happenedAt: { gte: previousFrom, lte: previousTo },
        },
        _sum: { amount: true },
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
        take: 500,
        include: { walletTx: { select: { amount: true } } },
      }),
      this.prisma.payout.aggregate({ _sum: { amountNet: true } }),
      this.prisma.fee.aggregate({
        where: { createdAt: { gte: from, lte: to } },
        _sum: { amountCharged: true },
      }),
      this.prisma.marketListing.count({
        where: { status: ListingStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.trade.count({
        where: { executedAt: { gte: from, lte: to } },
      }),
      this.prisma.walletBalance.aggregate({
        _sum: { available: true, locked: true },
      }),
      this.prisma.riskFlag.count({ where: { isActive: true, status: 'OPEN' } }),
      this.prisma.supportTicket.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'WAITING_USER'] },
        },
      }),
    ]);

    const pendingWithdrawalsUsdt = pendingWithdrawals.reduce(
      (s, w) => s.plus(w.walletTx.amount),
      new Prisma.Decimal(0),
    );

    const depositsNum = Number((depositAgg._sum.amount ?? 0).toString());
    const withdrawalsNum = Number((withdrawalAgg._sum.amount ?? 0).toString());
    const prevDepositsNum = Number(
      (prevDepositAgg._sum.amount ?? 0).toString(),
    );
    const prevWithdrawalsNum = Number(
      (prevWithdrawalAgg._sum.amount ?? 0).toString(),
    );

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      totalUsers,
      activeUsers,
      newUsers,
      totalTracks,
      activeRounds,
      totalDepositsUsdt: formatMoneyRu(depositsNum),
      totalWithdrawalsUsdt: formatMoneyRu(withdrawalsNum),
      pendingWithdrawalsUsdt: formatMoneyRu(pendingWithdrawalsUsdt),
      totalPayoutsUsdt: formatMoneyRu(payoutAgg._sum.amountNet ?? 0),
      platformRevenueUsdt: formatMoneyRu(feeAgg._sum.amountCharged ?? 0),
      availableBalanceUsdt: formatMoneyRu(balances._sum.available ?? 0),
      lockedBalanceUsdt: formatMoneyRu(balances._sum.locked ?? 0),
      activeListings,
      completedTrades,
      openRiskFlags,
      openSupportTickets: openTickets,
      deltas: {
        depositsPct: pctChange(depositsNum, prevDepositsNum),
        withdrawalsPct: pctChange(withdrawalsNum, prevWithdrawalsNum),
        newUsersPct: null,
      },
    };
  }

  async tasks(roles: string[]) {
    this.assertView(roles);

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      pendingDeposits,
      pendingWithdrawals,
      withdrawalsOnHold,
      openTickets,
      escalatedTickets,
      openRiskFlags,
      marketRiskFlags,
      draftTracks,
      draftRounds,
      queuedReports,
      failedReports24h,
    ] = await Promise.all([
      this.prisma.deposit.count({
        where: {
          status: { in: [DepositStatus.PENDING, DepositStatus.MANUAL_REVIEW] },
        },
      }),
      this.prisma.withdrawal.count({
        where: {
          status: {
            in: [WithdrawalStatus.REQUESTED, WithdrawalStatus.PROCESSING],
          },
        },
      }),
      this.prisma.withdrawal.count({
        where: { status: WithdrawalStatus.ON_HOLD },
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_USER'] } },
      }),
      this.prisma.supportTicket.count({ where: { status: 'ESCALATED' } }),
      this.prisma.riskFlag.count({ where: { isActive: true, status: 'OPEN' } }),
      this.prisma.riskFlag.count({
        where: { isActive: true, status: 'OPEN', entityType: 'trade' },
      }),
      this.prisma.release.count({
        where: { deletedAt: null, status: ReleaseStatus.DRAFT },
      }),
      this.prisma.primaryRaiseRound.count({
        where: { status: PrimaryRaiseRoundStatus.DRAFT },
      }),
      this.prisma.reportJob.count({
        where: { status: ReportJobStatus.QUEUED },
      }),
      this.prisma.reportJob.count({
        where: { status: ReportJobStatus.FAILED, createdAt: { gte: dayAgo } },
      }),
    ]);

    type TaskItem = {
      id: string;
      label: string;
      description: string;
      category: string;
      count: number;
      href: string;
      priority?: 'high';
    };

    const items: TaskItem[] = [
      {
        id: 'deposits-review',
        label: 'Пополнения на проверке',
        description: 'Заявки в статусах «Ожидает» и «Ручная проверка»',
        category: 'finance',
        count: pendingDeposits,
        href: '/admin/deposits?status=manual_review',
        priority: pendingDeposits > 0 ? 'high' : undefined,
      },
      {
        id: 'withdrawals-pending',
        label: 'Выводы в очереди',
        description: 'Запрошены или в обработке — требуют settlement',
        category: 'finance',
        count: pendingWithdrawals,
        href: '/admin/withdrawals?status=requested',
        priority: pendingWithdrawals > 0 ? 'high' : undefined,
      },
      {
        id: 'withdrawals-on-hold',
        label: 'Выводы на удержании',
        description: 'Остановлены compliance или бухгалтерией',
        category: 'finance',
        count: withdrawalsOnHold,
        href: '/admin/withdrawals?status=on_hold',
        priority: withdrawalsOnHold > 0 ? 'high' : undefined,
      },
      {
        id: 'compliance-open',
        label: 'Открытые риск-флаги',
        description: 'Активные сигналы, ожидающие разбора',
        category: 'compliance',
        count: openRiskFlags,
        href: '/admin/compliance?status=open',
        priority: openRiskFlags > 0 ? 'high' : undefined,
      },
      {
        id: 'support-open',
        label: 'Тикеты поддержки',
        description: 'Открытые и в работе обращения пользователей',
        category: 'support',
        count: openTickets,
        href: '/admin/support?status=open',
      },
      {
        id: 'support-escalated',
        label: 'Эскалированные тикеты',
        description: 'Переданы старшему оператору или compliance',
        category: 'support',
        count: escalatedTickets,
        href: '/admin/support?status=escalated',
        priority: escalatedTickets > 0 ? 'high' : undefined,
      },
      {
        id: 'tracks-draft',
        label: 'Черновики треков',
        description: 'Релизы, не опубликованные в каталог',
        category: 'content',
        count: draftTracks,
        href: '/admin/tracks?status=draft',
      },
      {
        id: 'rounds-draft',
        label: 'Черновики раундов',
        description: 'Сделки первичного размещения без запуска',
        category: 'content',
        count: draftRounds,
        href: '/admin/rounds?status=draft',
      },
      {
        id: 'market-trade-flags',
        label: 'Сделки под наблюдением',
        description: 'Риск-флаги по сделкам вторичного рынка',
        category: 'market',
        count: marketRiskFlags,
        href: '/admin/secondary-market',
        priority: marketRiskFlags > 0 ? 'high' : undefined,
      },
      {
        id: 'reports-queued',
        label: 'Отчёты в очереди',
        description: 'Фоновые выгрузки, ожидающие воркера',
        category: 'operations',
        count: queuedReports,
        href: '/admin/reports',
      },
      {
        id: 'reports-failed',
        label: 'Сбойные отчёты за 24 ч',
        description: 'Повторить генерацию или проверить воркер',
        category: 'operations',
        count: failedReports24h,
        href: '/admin/reports',
        priority: failedReports24h > 0 ? 'high' : undefined,
      },
    ];

    return { items };
  }

  async riskAlerts(roles: string[]) {
    this.assertView(roles);

    const [oldWithdrawals, suspiciousFlags, marketFlags, frozenOps] =
      await Promise.all([
        this.prisma.withdrawal.count({
          where: {
            status: WithdrawalStatus.REQUESTED,
            requestedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.riskFlag.count({
          where: { isActive: true, severity: { in: ['high', 'critical'] } },
        }),
        this.prisma.riskFlag.count({
          where: { isActive: true, status: 'OPEN', entityType: 'trade' },
        }),
        this.prisma.complianceFreeze.count({ where: { isActive: true } }),
      ]);

    const alerts: Array<{
      id: string;
      level: string;
      message: string;
      href?: string;
      createdAt: string;
    }> = [];
    const now = new Date().toISOString();

    if (oldWithdrawals > 0) {
      alerts.push({
        id: 'wd-old',
        level: 'warning',
        message: `${oldWithdrawals} выводов ожидают проверки более 24 ч`,
        href: '/admin/withdrawals?status=requested',
        createdAt: now,
      });
    }
    if (suspiciousFlags > 0) {
      alerts.push({
        id: 'risk-flags',
        level: 'danger',
        message: `${suspiciousFlags} риск-флагов высокой и критической важности`,
        href: '/admin/compliance?status=open',
        createdAt: now,
      });
    }
    if (marketFlags > 0) {
      alerts.push({
        id: 'market-trades',
        level: 'danger',
        message: `${marketFlags} подозрительных сделок на вторичном рынке`,
        href: '/admin/secondary-market',
        createdAt: now,
      });
    }
    if (frozenOps > 0) {
      alerts.push({
        id: 'frozen-ops',
        level: 'info',
        message: `${frozenOps} операций заморожено compliance`,
        href: '/admin/compliance',
        createdAt: now,
      });
    }

    return { items: alerts };
  }

  async recentActions(roles: string[]) {
    this.assertView(roles);

    const logs = await this.prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { actorUser: true },
    });

    return {
      items: logs.map((l) => ({
        id: l.id,
        adminEmail: l.actorUser?.email ?? 'system',
        action: l.action,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }

  async recentDeposits(roles: string[]) {
    this.assertView(roles);
    const rows = await this.prisma.deposit.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        walletTx: {
          include: {
            wallet: { include: { user: { include: { profile: true } } } },
          },
        },
      },
    });
    return { items: rows.map((r) => mapDeposit(r)) };
  }

  async recentWithdrawals(roles: string[]) {
    this.assertView(roles);
    const rows = await this.prisma.withdrawal.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        walletTx: {
          include: {
            wallet: { include: { user: { include: { profile: true } } } },
          },
        },
      },
    });
    return { items: rows.map((r) => mapWithdrawal(r)) };
  }

  async trends(roles: string[], query?: AdminAnalyticsQueryDto) {
    this.assertView(roles);
    const { from, to } = resolveAnalyticsPeriod(
      query?.period,
      query?.dateFrom,
      query?.dateTo,
    );

    const [
      deposits,
      withdrawals,
      fees,
      newUsers,
      payouts,
      trades,
      riskFlags,
      tickets,
    ] = await Promise.all([
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
      this.prisma.fee.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { createdAt: true, amountCharged: true },
      }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: from, lte: to }, deletedAt: null },
        select: { createdAt: true },
      }),
      this.prisma.payout.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { createdAt: true, amountNet: true },
      }),
      this.prisma.trade.findMany({
        where: { executedAt: { gte: from, lte: to } },
        select: { executedAt: true, grossAmount: true },
      }),
      this.prisma.riskFlag.findMany({
        where: { createdAt: { gte: from, lte: to }, isActive: true },
        select: { createdAt: true, severity: true },
      }),
      this.prisma.supportTicket.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { createdAt: true, status: true },
      }),
    ]);

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      deposits: this.bucketByDay(deposits, 'happenedAt', 'amount'),
      withdrawals: this.bucketByDay(withdrawals, 'happenedAt', 'amount'),
      platformRevenue: this.bucketByDay(fees, 'createdAt', 'amountCharged'),
      newUsers: this.bucketCountByDay(newUsers, 'createdAt'),
      payouts: this.bucketByDay(payouts, 'createdAt', 'amountNet'),
      marketVolume: this.bucketByDay(trades, 'executedAt', 'grossAmount'),
      marketTrades: this.bucketCountByDay(trades, 'executedAt'),
      riskFlags: this.bucketCountByDay(riskFlags, 'createdAt'),
      supportTickets: this.bucketCountByDay(tickets, 'createdAt'),
    };
  }

  private bucketByDay<T extends Record<string, unknown>>(
    rows: T[],
    dateKey: keyof T,
    amountKey: keyof T,
  ) {
    const buckets = new Map<string, Prisma.Decimal>();
    for (const row of rows) {
      const d = row[dateKey] as Date;
      const key = d.toISOString().slice(0, 10);
      const amt = row[amountKey] as { toString(): string };
      buckets.set(
        key,
        (buckets.get(key) ?? new Prisma.Decimal(0)).plus(amt.toString()),
      );
    }
    return [...buckets.entries()].map(([period, amount]) => ({
      period,
      amountUsdt: this.formatMoney(amount),
    }));
  }

  private bucketCountByDay<T extends Record<string, unknown>>(
    rows: T[],
    dateKey: keyof T,
  ) {
    const buckets = new Map<string, number>();
    for (const row of rows) {
      const d = row[dateKey] as Date;
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return [...buckets.entries()].map(([period, count]) => ({ period, count }));
  }

  private formatMoney(value: Prisma.Decimal | number | string): string {
    const n = Number(value.toString());
    return n.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private assertView(roles: string[]) {
    const ok = roles.some((r) =>
      [
        'SUPER_ADMIN',
        'ADMIN',
        'ACCOUNTANT',
        'COMPLIANCE',
        'SUPPORT_MANAGER',
        'CONTENT_MANAGER',
        'BUSINESS_ANALYST',
      ].includes(r),
    );
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
