import { Injectable } from '@nestjs/common';
import {
  ComplianceRiskStatus,
  EarningPeriodStatus,
  ListingStatus,
  PayoutStatus,
  Prisma,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
  UserStatus,
  WalletTxType,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  assertAnalyticsArea,
  formatMoneyRu,
  pctChange,
  resolveAnalyticsPeriod,
} from '../../common/admin-analytics.util';
import type { AdminAnalyticsQueryDto } from '../../common/dto/admin-analytics-query.dto';
import { splitAmounts } from '../mappers/admin-revenue.mapper';

@Injectable()
export class AdminAnalyticsRevenueService {
  constructor(private readonly prisma: PrismaService) {}

  private periodWhere(
    from: Date,
    to: Date,
    releaseId?: string,
  ): Prisma.EarningPeriodWhereInput {
    const w: Prisma.EarningPeriodWhereInput = {
      createdAt: { gte: from, lte: to },
    };
    if (releaseId) w.releaseId = releaseId;
    return w;
  }

  private async grossFromPeriods(where: Prisma.EarningPeriodWhereInput) {
    const periods = await this.prisma.earningPeriod.findMany({
      where,
      include: {
        reports: { take: 1, orderBy: { createdAt: 'desc' } },
        distributions: { take: 1 },
      },
    });
    let gross = 0;
    let holders = 0;
    let platform = 0;
    let artist = 0;
    let eventsWithoutDistribution = 0;
    for (const p of periods) {
      const g = Number(p.reports[0]?.grossRevenue.toString() ?? 0);
      const split = splitAmounts(g);
      gross += g;
      platform += split.platform;
      artist += split.artist;
      if (p.status === EarningPeriodStatus.DISTRIBUTED)
        holders += split.holders;
      if (
        p.reports.length > 0 &&
        p.distributions.length === 0 &&
        p.status !== EarningPeriodStatus.CANCELLED
      ) {
        eventsWithoutDistribution += 1;
      }
    }
    return {
      periods,
      gross,
      holders,
      platform,
      artist,
      eventsWithoutDistribution,
      count: periods.length,
    };
  }

  async summary(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'revenue');
    const { from, to, previousFrom, previousTo } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const releaseId = query.trackId?.trim();
    const where = this.periodWhere(from, to, releaseId);
    const prevWhere = this.periodWhere(previousFrom, previousTo, releaseId);

    const current = await this.grossFromPeriods(where);
    const previous = await this.grossFromPeriods(prevWhere);

    const payoutWhere: Prisma.PayoutWhereInput = {
      createdAt: { gte: from, lte: to },
      ...(releaseId ? { releaseId } : {}),
    };

    const [
      payoutAgg,
      failedPayouts,
      pendingPayouts,
      uniqueHolders,
      maxPayout,
      distributionsCount,
      periodsNoDist,
    ] = await Promise.all([
      this.prisma.payout.aggregate({
        where: payoutWhere,
        _sum: { amountNet: true, amountGross: true },
        _count: true,
        _avg: { amountNet: true },
      }),
      this.prisma.payout.count({
        where: { ...payoutWhere, status: PayoutStatus.FAILED },
      }),
      this.prisma.payout.count({
        where: {
          ...payoutWhere,
          status: { in: [PayoutStatus.PENDING, PayoutStatus.ACCRUED] },
        },
      }),
      this.prisma.payout.groupBy({ by: ['userId'], where: payoutWhere }),
      this.prisma.payout.aggregate({
        where: payoutWhere,
        _max: { amountNet: true },
      }),
      this.prisma.earningDistribution.count({
        where: {
          createdAt: { gte: from, lte: to },
          ...(releaseId ? { releaseId } : {}),
        },
      }),
      this.prisma.earningPeriod.count({
        where: {
          ...where,
          reports: { some: {} },
          distributions: { none: {} },
          status: { not: EarningPeriodStatus.CANCELLED },
        },
      }),
    ]);

    const distributedNet = Number(payoutAgg._sum.amountNet ?? 0);
    const prevDistributed = Number(
      (
        await this.prisma.payout.aggregate({
          where: {
            createdAt: { gte: previousFrom, lte: previousTo },
            ...(releaseId ? { releaseId } : {}),
          },
          _sum: { amountNet: true },
        })
      )._sum.amountNet ?? 0,
    );

    const openCount = current.periods.filter(
      (p) => p.status === EarningPeriodStatus.OPEN,
    ).length;
    const calculatedCount = current.periods.filter(
      (p) => p.status === EarningPeriodStatus.CALCULATED,
    ).length;
    const distributedPeriods = current.periods.filter(
      (p) => p.status === EarningPeriodStatus.DISTRIBUTED,
    ).length;

    const payoutsMissingLedger = await this.prisma.payout.count({
      where: {
        ...payoutWhere,
        status: PayoutStatus.PAID,
        walletTxId: null,
      },
    });

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      revenueEventsCount: current.count,
      grossRevenueUsdt: formatMoneyRu(current.gross),
      avgRevenueEventUsdt:
        current.count > 0 ? formatMoneyRu(current.gross / current.count) : null,
      eventsWithoutDistribution: periodsNoDist,
      distributedToHoldersUsdt: formatMoneyRu(distributedNet),
      distributedUsdt: formatMoneyRu(distributedNet),
      platformShareUsdt: formatMoneyRu(current.platform),
      artistShareUsdt: formatMoneyRu(current.artist),
      holdersShareUsdt: formatMoneyRu(current.holders),
      completedDistributions: distributedPeriods,
      processingDistributions: calculatedCount,
      failedDistributions: failedPayouts,
      failedCount: failedPayouts,
      payoutHoldersCount: uniqueHolders.length,
      avgPayoutPerHolderUsdt: payoutAgg._avg.amountNet
        ? formatMoneyRu(payoutAgg._avg.amountNet.toString())
        : null,
      averagePayoutUsdt: payoutAgg._avg.amountNet
        ? formatMoneyRu(payoutAgg._avg.amountNet.toString())
        : null,
      maxPayoutUsdt: maxPayout._max.amountNet
        ? formatMoneyRu(maxPayout._max.amountNet.toString())
        : null,
      pendingPayouts,
      distributionsCount,
      ledgerMismatchCount: payoutsMissingLedger,
      pendingEvents: openCount,
      deltas: {
        grossPct: pctChange(current.gross, previous.gross),
        distributedPct: pctChange(distributedNet, prevDistributed),
        eventsPct: pctChange(current.count, previous.count),
      },
    };
  }

  async events(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'revenue');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const releaseId = query.trackId?.trim();

    const periods = await this.prisma.earningPeriod.findMany({
      where: this.periodWhere(from, to, releaseId),
      include: { reports: { take: 1, orderBy: { createdAt: 'desc' } } },
    });

    const buckets = new Map<string, { count: number; gross: number }>();
    for (const p of periods) {
      const key = p.createdAt.toISOString().slice(0, 10);
      const prev = buckets.get(key) ?? { count: 0, gross: 0 };
      prev.count += 1;
      prev.gross += Number(p.reports[0]?.grossRevenue.toString() ?? 0);
      buckets.set(key, prev);
    }

    return {
      items: [...buckets.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, v]) => ({
          period,
          count: v.count,
          amountUsdt: formatMoneyRu(v.gross),
        })),
    };
  }

  async distributions(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'revenue');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const releaseId = query.trackId?.trim();

    const [byPeriodStatus, byPayoutStatus] = await Promise.all([
      this.prisma.earningPeriod.groupBy({
        by: ['status'],
        where: this.periodWhere(from, to, releaseId),
        _count: { id: true },
      }),
      this.prisma.payout.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: from, lte: to },
          ...(releaseId ? { releaseId } : {}),
        },
        _count: { id: true },
        _sum: { amountNet: true },
      }),
    ]);

    const statusMap: Record<string, string> = {
      OPEN: 'draft',
      CALCULATED: 'preview',
      DISTRIBUTED: 'completed',
      CANCELLED: 'cancelled',
      PENDING: 'queued',
      ACCRUED: 'processing',
      PAID: 'completed',
      FAILED: 'failed',
    };

    const periodItems = byPeriodStatus.map((s) => ({
      status: statusMap[s.status] ?? s.status.toLowerCase(),
      count: s._count.id,
      amountUsdt: '0,00',
    }));

    const payoutItems = byPayoutStatus.map((s) => ({
      status: statusMap[s.status] ?? s.status.toLowerCase(),
      count: s._count.id,
      amountUsdt: formatMoneyRu(s._sum.amountNet ?? 0),
    }));

    return {
      byStatus: [...periodItems, ...payoutItems],
      items: payoutItems,
    };
  }

  async byTrack(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'revenue');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const periods = await this.prisma.earningPeriod.findMany({
      where: this.periodWhere(from, to, query.trackId?.trim()),
      include: {
        reports: { take: 1, orderBy: { createdAt: 'desc' } },
        distributions: {
          include: {
            payouts: { select: { id: true, status: true, amountNet: true } },
          },
        },
        release: {
          include: { releaseArtists: { include: { artist: true }, take: 1 } },
        },
      },
    });

    const byRelease = new Map<
      string,
      {
        gross: number;
        holders: number;
        artist: number;
        platform: number;
        payouts: number;
        failed: number;
        title: string;
        artistName: string;
        status: string;
        lastDist: string | null;
      }
    >();

    for (const p of periods) {
      const g = Number(p.reports[0]?.grossRevenue.toString() ?? 0);
      const split = splitAmounts(g);
      const prev = byRelease.get(p.releaseId) ?? {
        gross: 0,
        holders: 0,
        artist: 0,
        platform: 0,
        payouts: 0,
        failed: 0,
        title: p.release.title,
        artistName: p.release.releaseArtists[0]?.artist?.name ?? '—',
        status: p.status.toLowerCase(),
        lastDist: null,
      };
      prev.gross += g;
      prev.platform += split.platform;
      prev.artist += split.artist;
      prev.holders += split.holders;
      const dist = p.distributions[0];
      if (dist) {
        prev.lastDist = dist.createdAt.toISOString();
        for (const po of dist.payouts) {
          prev.payouts += 1;
          if (po.status === PayoutStatus.FAILED) prev.failed += 1;
        }
      }
      byRelease.set(p.releaseId, prev);
    }

    return {
      items: [...byRelease.entries()]
        .sort((a, b) => b[1].gross - a[1].gross)
        .slice(0, 20)
        .map(([releaseId, v]) => ({
          trackId: releaseId,
          trackTitle: v.title,
          artistName: v.artistName,
          grossRevenueUsdt: formatMoneyRu(v.gross),
          holdersPayoutUsdt: formatMoneyRu(v.holders),
          artistShareUsdt: formatMoneyRu(v.artist),
          platformShareUsdt: formatMoneyRu(v.platform),
          payoutsCount: v.payouts,
          failedItems: v.failed,
          lastDistributionAt: v.lastDist,
          status: v.status,
          amountUsdt: formatMoneyRu(v.holders),
        })),
    };
  }

  async payouts(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'revenue');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const releaseId = query.trackId?.trim();

    const rows = await this.prisma.payout.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        ...(releaseId ? { releaseId } : {}),
      },
      select: { createdAt: true, amountNet: true, userId: true },
    });

    const buckets = new Map<
      string,
      { holders: number; amount: number; users: Set<string> }
    >();
    for (const r of rows) {
      const key = r.createdAt.toISOString().slice(0, 10);
      const prev = buckets.get(key) ?? {
        holders: 0,
        amount: 0,
        users: new Set(),
      };
      prev.holders += 1;
      prev.amount += Number(r.amountNet.toString());
      prev.users.add(r.userId);
      buckets.set(key, prev);
    }

    return {
      items: [...buckets.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, v]) => ({
          period,
          amountUsdt: formatMoneyRu(v.amount),
          holdersCount: v.users.size,
          payoutItems: v.holders,
        })),
    };
  }

  async pipeline(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'revenue');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const releaseId = query.trackId?.trim();
    const where = this.periodWhere(from, to, releaseId);

    const periods = await this.prisma.earningPeriod.findMany({
      where,
      include: {
        reports: { take: 1 },
        distributions: { include: { payouts: true } },
      },
    });

    let created = 0;
    let preview = 0;
    let distributed = 0;
    let walletCredited = 0;
    let completed = 0;
    let failed = 0;
    let createdAmount = 0;

    for (const p of periods) {
      if (p.reports.length > 0) {
        created += 1;
        createdAmount += Number(p.reports[0].grossRevenue.toString());
      }
      if (p.status === EarningPeriodStatus.CALCULATED) preview += 1;
      if (p.distributions.length > 0) distributed += 1;
      const dist = p.distributions[0];
      if (dist) {
        const paid = dist.payouts.filter((po) => po.walletTxId != null).length;
        walletCredited += paid;
        const allPaid = dist.payouts.every(
          (po) => po.status === PayoutStatus.PAID,
        );
        if (p.status === EarningPeriodStatus.DISTRIBUTED && allPaid)
          completed += 1;
        failed += dist.payouts.filter(
          (po) => po.status === PayoutStatus.FAILED,
        ).length;
      }
    }

    const stages = [
      {
        key: 'created',
        label: 'Revenue event создан',
        count: created,
        amountUsdt: formatMoneyRu(createdAmount),
      },
      {
        key: 'preview',
        label: 'Preview рассчитан',
        count: preview,
        amountUsdt: null,
      },
      {
        key: 'distribution',
        label: 'Distribution запущен',
        count: distributed,
        amountUsdt: null,
      },
      {
        key: 'wallet',
        label: 'Wallet ledger начислен',
        count: walletCredited,
        amountUsdt: null,
      },
      {
        key: 'completed',
        label: 'Completed',
        count: completed,
        amountUsdt: null,
      },
      {
        key: 'failed',
        label: 'Failed / manual review',
        count: failed,
        amountUsdt: null,
      },
    ];

    return { stages };
  }

  async split(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'revenue');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const agg = await this.grossFromPeriods(
      this.periodWhere(from, to, query.trackId?.trim()),
    );
    const total = agg.gross || 1;
    return {
      holdersShareUsdt: formatMoneyRu(agg.holders),
      artistShareUsdt: formatMoneyRu(agg.artist),
      platformShareUsdt: formatMoneyRu(agg.platform),
      grossRevenueUsdt: formatMoneyRu(agg.gross),
      holdersPct: Math.round((agg.holders / total) * 1000) / 10,
      artistPct: Math.round((agg.artist / total) * 1000) / 10,
      platformPct: Math.round((agg.platform / total) * 1000) / 10,
    };
  }

  async topHolders(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'revenue');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const limit = Math.min(query.limit ?? 15, 30);

    const grouped = await this.prisma.payout.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: [PayoutStatus.PAID, PayoutStatus.ACCRUED] },
        ...(query.trackId?.trim() ? { releaseId: query.trackId.trim() } : {}),
      },
      _sum: { amountNet: true },
      _count: { id: true },
      orderBy: { _sum: { amountNet: 'desc' } },
      take: limit,
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
      select: { id: true, email: true },
    });
    const emailMap = new Map(users.map((u) => [u.id, u.email]));

    return {
      items: grouped.map((g) => ({
        userId: g.userId,
        email: emailMap.get(g.userId) ?? '—',
        totalPayoutUsdt: formatMoneyRu(g._sum.amountNet ?? 0),
        payoutCount: g._count.id,
        releasesCount: 0,
        riskStatus: 'none',
      })),
    };
  }

  async failed(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'revenue');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const limit = Math.min(query.limit ?? 20, 40);

    const failedPayouts = await this.prisma.payout.findMany({
      where: {
        status: PayoutStatus.FAILED,
        createdAt: { gte: from, lte: to },
        ...(query.trackId?.trim() ? { releaseId: query.trackId.trim() } : {}),
      },
      include: {
        release: { select: { title: true } },
        earningDistribution: { select: { id: true, earningPeriodId: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return {
      items: failedPayouts.map((p) => ({
        payoutId: p.id,
        distributionId: p.earningDistributionId,
        releaseId: p.releaseId,
        releaseTitle: p.release.title,
        amountUsdt: formatMoneyRu(p.amountNet.toString()),
        reason: 'payout_failed',
        status: 'failed',
        retryAvailable: true,
        lastAttemptAt: p.updatedAt.toISOString(),
      })),
    };
  }

  async reconciliation(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'revenue');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const payouts = await this.prisma.payout.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: PayoutStatus.PAID,
      },
      select: {
        id: true,
        amountNet: true,
        walletTxId: true,
        earningDistributionId: true,
      },
    });

    const payoutSum = payouts.reduce(
      (s, p) => s + Number(p.amountNet.toString()),
      0,
    );
    const missingTx = payouts.filter((p) => !p.walletTxId);

    const ledgerSum = await this.prisma.walletTransaction.aggregate({
      where: {
        txType: WalletTxType.PAYOUT,
        createdAt: { gte: from, lte: to },
      },
      _sum: { netAmount: true },
      _count: true,
    });

    const ledgerTotal = Number(ledgerSum._sum?.netAmount ?? 0);
    const matched = Math.abs(payoutSum - ledgerTotal) < 0.01;

    return {
      matched,
      payoutItemsCount: payouts.length,
      payoutSumUsdt: formatMoneyRu(payoutSum),
      ledgerTxCount: ledgerSum._count,
      ledgerSumUsdt: formatMoneyRu(ledgerTotal),
      missingWalletTxCount: missingTx.length,
      mismatchedAmountUsdt: matched
        ? '0,00'
        : formatMoneyRu(Math.abs(payoutSum - ledgerTotal)),
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

@Injectable()
export class AdminAnalyticsRiskService {
  constructor(private readonly prisma: PrismaService) {}

  private slaHours(severity: string): number {
    const s = severity.toLowerCase();
    if (s === 'critical') return 2;
    if (s === 'high') return 8;
    if (s === 'medium') return 24;
    return 72;
  }

  private flagFilter(
    from: Date,
    to: Date,
    query: AdminAnalyticsQueryDto,
    opts?: { openOnly?: boolean },
  ): Prisma.RiskFlagWhereInput {
    const w: Prisma.RiskFlagWhereInput = { createdAt: { gte: from, lte: to } };
    if (opts?.openOnly) {
      w.isActive = true;
      w.status = ComplianceRiskStatus.OPEN;
    }
    if (query.status?.trim()) {
      const st = query.status.toUpperCase().replace(/-/g, '_');
      const statusMap: Record<string, ComplianceRiskStatus> = {
        OPEN: ComplianceRiskStatus.OPEN,
        IN_REVIEW: ComplianceRiskStatus.IN_REVIEW,
        RESOLVED: ComplianceRiskStatus.RESOLVED,
        DISMISSED: ComplianceRiskStatus.DISMISSED,
        REVIEWED: ComplianceRiskStatus.RESOLVED,
        BLOCKED: ComplianceRiskStatus.BLOCKED,
        ON_HOLD: ComplianceRiskStatus.IN_REVIEW,
      };
      if (statusMap[st]) {
        w.status = statusMap[st];
      }
    }
    if (query.segment?.trim()) {
      w.severity = query.segment.toLowerCase();
    }
    if (query.role?.trim()) {
      w.entityType = query.role.trim();
    }
    if (query.source?.trim()) {
      w.flagCode = query.source.trim();
    }
    return w;
  }

  async summary(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'risk');
    const { from, to, previousFrom, previousTo } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const periodWhere = this.flagFilter(from, to, query);
    const prevWhere = this.flagFilter(previousFrom, previousTo, query);

    const now = Date.now();
    const openFlags = await this.prisma.riskFlag.findMany({
      where: { isActive: true, status: ComplianceRiskStatus.OPEN },
      select: {
        severity: true,
        createdAt: true,
        reviewedByUserId: true,
        riskScore: true,
      },
    });

    let overdue = 0;
    let unassigned = 0;
    for (const f of openFlags) {
      if (!f.reviewedByUserId) unassigned += 1;
      const hours = (now - f.createdAt.getTime()) / (1000 * 60 * 60);
      if (hours > this.slaHours(f.severity)) overdue += 1;
    }

    const [
      flagsInPeriod,
      prevFlagsInPeriod,
      highCriticalOpen,
      blockedUsers,
      frozenOps,
      hvWithdrawals,
      suspiciousTrades,
      frozenListings,
      reviewedInPeriod,
      dismissedInPeriod,
    ] = await Promise.all([
      this.prisma.riskFlag.count({ where: periodWhere }),
      this.prisma.riskFlag.count({ where: prevWhere }),
      this.prisma.riskFlag.count({
        where: { isActive: true, severity: { in: ['high', 'critical'] } },
      }),
      this.prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
      this.prisma.complianceFreeze.count({ where: { isActive: true } }),
      this.prisma.withdrawal.count({
        where: {
          status: {
            in: [
              WithdrawalStatus.REQUESTED,
              WithdrawalStatus.PROCESSING,
              WithdrawalStatus.ON_HOLD,
            ],
          },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          action: 'trade.mark_suspicious',
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.marketListing.count({
        where: { deletedAt: null, status: ListingStatus.PAUSED },
      }),
      this.prisma.riskFlag.count({
        where: {
          ...periodWhere,
          status: {
            in: [
              ComplianceRiskStatus.RESOLVED,
              ComplianceRiskStatus.DISMISSED,
              ComplianceRiskStatus.REVIEWED,
            ],
          },
        },
      }),
      this.prisma.riskFlag.count({
        where: {
          ...periodWhere,
          status: {
            in: [
              ComplianceRiskStatus.RESOLVED,
              ComplianceRiskStatus.DISMISSED,
              ComplianceRiskStatus.REVIEWED,
            ],
          },
          reviewedAt: { not: null },
        },
      }),
    ]);

    const reviewedWithTime = await this.prisma.riskFlag.findMany({
      where: {
        reviewedAt: { gte: from, lte: to },
        createdAt: { not: undefined },
      },
      select: { createdAt: true, reviewedAt: true },
      take: 200,
    });
    let reviewHoursSum = 0;
    let reviewCount = 0;
    for (const f of reviewedWithTime) {
      if (f.reviewedAt) {
        reviewHoursSum +=
          (f.reviewedAt.getTime() - f.createdAt.getTime()) / (1000 * 60 * 60);
        reviewCount += 1;
      }
    }
    const avgReviewHours =
      reviewCount > 0
        ? Math.round((reviewHoursSum / reviewCount) * 10) / 10
        : null;

    const frozenAmount = await this.prisma.withdrawal.findMany({
      where: { status: WithdrawalStatus.ON_HOLD },
      include: { walletTx: { select: { amount: true } } },
      take: 50,
    });
    const frozenVolume = frozenAmount.reduce(
      (s, w) => s + Number(w.walletTx.amount.toString()),
      0,
    );

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      openFlags: openFlags.length,
      highCriticalOpen,
      highSeverity: highCriticalOpen,
      unassignedOpen: unassigned,
      overdueSla: overdue,
      blockedUsers,
      frozenOperations: frozenOps,
      frozenVolumeUsdt: formatMoneyRu(frozenVolume),
      highValuePendingWithdrawals: hvWithdrawals,
      flagsInPeriod,
      suspiciousTrades,
      frozenListings,
      reviewedCases: reviewedInPeriod,
      dismissedCases: dismissedInPeriod,
      averageReviewHours: avgReviewHours,
      criticalCount: openFlags.filter((f) => f.severity === 'critical').length,
      highCount: openFlags.filter((f) => f.severity === 'high').length,
      deltas: {
        flagsPct: pctChange(flagsInPeriod, prevFlagsInPeriod),
      },
    };
  }

  async bySeverity(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'risk');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const flags = await this.prisma.riskFlag.findMany({
      where: this.flagFilter(from, to, query),
      select: { severity: true, createdAt: true, status: true },
    });

    const bySev = new Map<string, number>();
    const byDay = new Map<string, number>();
    const byStatus = new Map<string, number>();

    for (const f of flags) {
      bySev.set(f.severity, (bySev.get(f.severity) ?? 0) + 1);
      const day = f.createdAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
      byStatus.set(
        f.status.toLowerCase(),
        (byStatus.get(f.status.toLowerCase()) ?? 0) + 1,
      );
    }

    return {
      items: [...bySev.entries()].map(([severity, count]) => ({
        severity,
        count,
      })),
      byStatus: [...byStatus.entries()].map(([status, count]) => ({
        status,
        count,
      })),
      trend: [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, count]) => ({ period, count })),
    };
  }

  async byType(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'risk');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const flags = await this.prisma.riskFlag.findMany({
      where: this.flagFilter(from, to, query),
      select: { entityType: true, flagCode: true },
    });

    const byEntity = new Map<string, number>();
    const byRule = new Map<string, number>();
    for (const f of flags) {
      const et = f.entityType ?? 'unknown';
      byEntity.set(et, (byEntity.get(et) ?? 0) + 1);
      byRule.set(f.flagCode, (byRule.get(f.flagCode) ?? 0) + 1);
    }

    return {
      items: [...byEntity.entries()].map(([type, count]) => ({ type, count })),
      byRule: [...byRule.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([ruleCode, count]) => ({ ruleCode, count })),
    };
  }

  async queueAging(roles: string[], _query: AdminAnalyticsQueryDto) {
    void _query;
    assertAnalyticsArea(roles, 'risk');
    const open = await this.prisma.riskFlag.findMany({
      where: { isActive: true, status: ComplianceRiskStatus.OPEN },
      select: { createdAt: true, severity: true },
    });

    const now = Date.now();
    const buckets = [
      { label: '0–2 ч', key: '0-2h', count: 0, overdue: 0 },
      { label: '2–8 ч', key: '2-8h', count: 0, overdue: 0 },
      { label: '8–24 ч', key: '8-24h', count: 0, overdue: 0 },
      { label: '24–72 ч', key: '24-72h', count: 0, overdue: 0 },
      { label: '72 ч+', key: '72h+', count: 0, overdue: 0 },
    ];

    let oldestHours = 0;
    for (const f of open) {
      const hours = (now - f.createdAt.getTime()) / (1000 * 60 * 60);
      if (hours > oldestHours) oldestHours = hours;
      const sla = this.slaHours(f.severity);
      const isOverdue = hours > sla;
      if (hours < 2) buckets[0].count += 1;
      else if (hours < 8) buckets[1].count += 1;
      else if (hours < 24) buckets[2].count += 1;
      else if (hours < 72) buckets[3].count += 1;
      else buckets[4].count += 1;
      if (isOverdue) {
        if (hours < 2) buckets[0].overdue += 1;
        else if (hours < 8) buckets[1].overdue += 1;
        else if (hours < 24) buckets[2].overdue += 1;
        else if (hours < 72) buckets[3].overdue += 1;
        else buckets[4].overdue += 1;
      }
    }

    const avgAgeHours =
      open.length > 0
        ? Math.round(
            open.reduce(
              (s, f) => s + (now - f.createdAt.getTime()) / (1000 * 60 * 60),
              0,
            ) / open.length,
          )
        : 0;

    return {
      items: buckets,
      buckets,
      averageAgeHours: avgAgeHours,
      oldestOpenHours: Math.round(oldestHours),
      overdueTotal: buckets.reduce((s, b) => s + b.overdue, 0),
    };
  }

  async highValueOperations(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'risk');
    const threshold = 5000;
    const limit = Math.min(query.limit ?? 20, 30);

    const withdrawals = await this.prisma.withdrawal.findMany({
      where: {
        status: {
          in: [
            WithdrawalStatus.REQUESTED,
            WithdrawalStatus.PROCESSING,
            WithdrawalStatus.ON_HOLD,
          ],
        },
      },
      include: {
        walletTx: { include: { wallet: { include: { user: true } } } },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const items = withdrawals
      .filter((w) => Number(w.walletTx.amount.toString()) >= threshold)
      .slice(0, limit)
      .map((w) => ({
        id: w.id,
        operationId: w.id,
        type: 'withdrawal',
        userId: w.walletTx.wallet.userId,
        userEmail: w.walletTx.wallet.user.email,
        amountUsdt: formatMoneyRu(w.walletTx.amount),
        status: w.status.toLowerCase(),
        riskScore: w.status === WithdrawalStatus.ON_HOLD ? 75 : 50,
        createdAt: w.createdAt.toISOString(),
      }));

    return { items, thresholdUsdt: formatMoneyRu(threshold) };
  }

  async queue(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'risk');
    const limit = Math.min(query.limit ?? 25, 50);
    const now = Date.now();

    const flags = await this.prisma.riskFlag.findMany({
      where: { isActive: true, status: ComplianceRiskStatus.OPEN },
      include: {
        user: { select: { id: true, email: true } },
        reviewedBy: { select: { email: true } },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
      take: limit,
    });

    const amountForEntity = async (
      entityType: string | null,
      entityId: string | null,
    ) => {
      if (entityType === 'withdrawal' && entityId) {
        const w = await this.prisma.withdrawal.findUnique({
          where: { id: entityId },
          include: { walletTx: { select: { amount: true } } },
        });
        return w ? formatMoneyRu(w.walletTx.amount) : null;
      }
      return null;
    };

    const items = await Promise.all(
      flags.map(async (f) => {
        const hours = (now - f.createdAt.getTime()) / (1000 * 60 * 60);
        const sla = this.slaHours(f.severity);
        return {
          riskId: f.id,
          ruleCode: f.flagCode,
          severity: f.severity,
          riskScore: f.riskScore ?? 0,
          entityType: f.entityType ?? 'user',
          entityId: f.entityId,
          userId: f.userId,
          userEmail: f.user.email,
          amountUsdt: await amountForEntity(f.entityType, f.entityId),
          status: f.status.toLowerCase(),
          assignedTo: f.reviewedBy?.email ?? null,
          slaOverdue: hours > sla,
          slaHoursRemaining: Math.max(0, Math.round(sla - hours)),
          updatedAt: f.updatedAt.toISOString(),
        };
      }),
    );

    return { items };
  }

  async rulesPerformance(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'risk');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const flags = await this.prisma.riskFlag.findMany({
      where: this.flagFilter(from, to, query),
      select: {
        flagCode: true,
        severity: true,
        status: true,
        riskScore: true,
        createdAt: true,
        reviewedAt: true,
        entityType: true,
      },
    });

    const byRule = new Map<
      string,
      {
        triggered: number;
        highCritical: number;
        reviewed: number;
        dismissed: number;
        scores: number[];
        resolutionMs: number[];
        entityType: string | null;
        lastAt: Date;
      }
    >();

    for (const f of flags) {
      const prev = byRule.get(f.flagCode) ?? {
        triggered: 0,
        highCritical: 0,
        reviewed: 0,
        dismissed: 0,
        scores: [],
        resolutionMs: [],
        entityType: f.entityType,
        lastAt: f.createdAt,
      };
      prev.triggered += 1;
      if (['high', 'critical'].includes(f.severity)) prev.highCritical += 1;
      if (
        f.status === ComplianceRiskStatus.RESOLVED ||
        f.status === ComplianceRiskStatus.REVIEWED
      ) {
        prev.reviewed += 1;
      }
      if (
        f.status === ComplianceRiskStatus.DISMISSED ||
        f.status === ComplianceRiskStatus.REVIEWED
      ) {
        prev.dismissed += 1;
      }
      if (f.riskScore != null) prev.scores.push(f.riskScore);
      if (f.reviewedAt) {
        prev.resolutionMs.push(f.reviewedAt.getTime() - f.createdAt.getTime());
      }
      if (f.createdAt > prev.lastAt) prev.lastAt = f.createdAt;
      byRule.set(f.flagCode, prev);
    }

    return {
      items: [...byRule.entries()]
        .sort((a, b) => b[1].triggered - a[1].triggered)
        .map(([ruleCode, v]) => {
          const fpRate =
            v.reviewed > 0
              ? Math.round((v.dismissed / v.reviewed) * 1000) / 10
              : null;
          const avgResHours =
            v.resolutionMs.length > 0
              ? Math.round(
                  v.resolutionMs.reduce((s, m) => s + m, 0) /
                    v.resolutionMs.length /
                    (1000 * 60 * 60),
                )
              : null;
          return {
            ruleCode,
            label: ruleCode.replace(/_/g, ' '),
            entityType: v.entityType ?? '—',
            triggeredCount: v.triggered,
            highCriticalCount: v.highCritical,
            reviewedCount: v.reviewed,
            falsePositiveCount: v.dismissed,
            falsePositiveRatePct: fpRate,
            avgRiskScore:
              v.scores.length > 0
                ? Math.round(
                    v.scores.reduce((a, b) => a + b, 0) / v.scores.length,
                  )
                : null,
            avgResolutionHours: avgResHours,
            lastTriggeredAt: v.lastAt.toISOString(),
          };
        }),
    };
  }

  async repeatOffenders(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'risk');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const limit = Math.min(query.limit ?? 15, 30);

    const grouped = await this.prisma.riskFlag.groupBy({
      by: ['userId'],
      where: this.flagFilter(from, to, query),
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const userIds = grouped.map((g) => g.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, status: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const items = await Promise.all(
      grouped
        .filter((g) => g._count.id >= 2)
        .map(async (g) => {
          const critical = await this.prisma.riskFlag.count({
            where: {
              userId: g.userId,
              severity: 'critical',
              createdAt: { gte: from, lte: to },
            },
          });
          const last = await this.prisma.riskFlag.findFirst({
            where: { userId: g.userId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true, flagCode: true },
          });
          const u = userMap.get(g.userId);
          return {
            userId: g.userId,
            email: u?.email ?? '—',
            flagsCount: g._count.id,
            criticalCount: critical,
            blocked: u?.status === UserStatus.SUSPENDED,
            lastFlagCode: last?.flagCode ?? '—',
            lastFlagAt: last?.createdAt.toISOString() ?? null,
          };
        }),
    );

    return { items };
  }

  async freezeImpact(roles: string[], _query: AdminAnalyticsQueryDto) {
    void _query;
    assertAnalyticsArea(roles, 'risk');
    const [frozenWd, frozenListings, blockedUsers, freezes] = await Promise.all(
      [
        this.prisma.withdrawal.count({
          where: { status: WithdrawalStatus.ON_HOLD },
        }),
        this.prisma.marketListing.count({
          where: { deletedAt: null, status: ListingStatus.PAUSED },
        }),
        this.prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
        this.prisma.complianceFreeze.findMany({
          where: { isActive: true },
          take: 100,
        }),
      ],
    );

    const wdRows = await this.prisma.withdrawal.findMany({
      where: { status: WithdrawalStatus.ON_HOLD },
      include: { walletTx: { select: { amount: true } } },
    });
    const frozenAmount = wdRows.reduce(
      (s, w) => s + Number(w.walletTx.amount.toString()),
      0,
    );

    return {
      frozenWithdrawals: frozenWd,
      frozenListings,
      blockedUsers,
      activeFreezes: freezes.length,
      frozenAmountUsdt: formatMoneyRu(frozenAmount),
    };
  }

  async resolutionQuality(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'risk');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const where = this.flagFilter(from, to, query);

    const closedStatuses = [
      ComplianceRiskStatus.RESOLVED,
      ComplianceRiskStatus.DISMISSED,
      ComplianceRiskStatus.REVIEWED,
    ];

    const [reviewed, open, total, dismissed] = await Promise.all([
      this.prisma.riskFlag.count({
        where: { ...where, status: { in: closedStatuses } },
      }),
      this.prisma.riskFlag.count({
        where: { ...where, status: ComplianceRiskStatus.OPEN },
      }),
      this.prisma.riskFlag.count({ where }),
      this.prisma.riskFlag.count({
        where: {
          ...where,
          status: {
            in: [ComplianceRiskStatus.DISMISSED, ComplianceRiskStatus.REVIEWED],
          },
        },
      }),
    ]);

    const reviewedFlags = await this.prisma.riskFlag.findMany({
      where: { ...where, reviewedAt: { not: null } },
      select: { createdAt: true, reviewedAt: true },
      take: 300,
    });

    let resSum = 0;
    for (const f of reviewedFlags) {
      if (f.reviewedAt)
        resSum += f.reviewedAt.getTime() - f.createdAt.getTime();
    }
    const avgResolutionHours =
      reviewedFlags.length > 0
        ? Math.round(resSum / reviewedFlags.length / (1000 * 60 * 60))
        : null;

    const resolutionRatePct =
      total > 0 ? Math.round((reviewed / total) * 1000) / 10 : 0;
    const falsePositiveApprox = dismissed;
    const falsePositiveRatePct =
      reviewed > 0
        ? Math.round((falsePositiveApprox / reviewed) * 1000) / 10
        : null;

    return {
      reviewedCases: reviewed,
      openCases: open,
      dismissedApprox: falsePositiveApprox,
      falsePositiveRatePct,
      resolutionRatePct,
      avgResolutionHours,
      note: 'False positive approximated via DISMISSED status (legacy REVIEWED included).',
    };
  }
}

const SUPPORT_CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  DEPOSIT: 'Пополнение',
  WITHDRAWAL: 'Вывод',
  WALLET: 'Кошелёк',
  PRIMARY_PURCHASE: 'Покупка юнитов',
  ACCOUNT: 'Аккаунт',
  SECONDARY_MARKET: 'Вторичный рынок',
  PAYOUTS: 'Начисления',
  TECHNICAL: 'Техническая проблема',
  OTHER: 'Другое',
};

const FINANCE_CATEGORIES: SupportTicketCategory[] = [
  SupportTicketCategory.DEPOSIT,
  SupportTicketCategory.WITHDRAWAL,
  SupportTicketCategory.PAYOUTS,
  SupportTicketCategory.SECONDARY_MARKET,
];

const PRODUCT_PAIN_BY_CATEGORY: Record<SupportTicketCategory, string> = {
  DEPOSIT: 'Пополнение не зачислено',
  WITHDRAWAL: 'Вывод задержан',
  WALLET: 'Операция по кошельку',
  PRIMARY_PURCHASE: 'Покупка юнитов',
  ACCOUNT: 'Ошибка входа / аккаунт',
  SECONDARY_MARKET: 'Вторичный рынок / листинг',
  PAYOUTS: 'Начисление не получено',
  TECHNICAL: 'Техническая проблема',
  OTHER: 'Непонятный статус операции',
};

const OPEN_STATUSES: SupportTicketStatus[] = [
  SupportTicketStatus.OPEN,
  SupportTicketStatus.IN_PROGRESS,
  SupportTicketStatus.WAITING_USER,
  SupportTicketStatus.ESCALATED,
];

@Injectable()
export class AdminAnalyticsSupportService {
  constructor(private readonly prisma: PrismaService) {}

  /** SLA by priority (computed; no SLA column in DB). HIGH treated as urgent tier. */
  private slaHours(
    priority: SupportTicketPriority,
    status?: SupportTicketStatus,
  ): number {
    if (status === SupportTicketStatus.ESCALATED) return 2;
    if (priority === SupportTicketPriority.CRITICAL) return 2;
    if (priority === SupportTicketPriority.HIGH) return 8;
    if (priority === SupportTicketPriority.MEDIUM) return 24;
    return 72;
  }

  private ticketFilter(
    from: Date,
    to: Date,
    query: AdminAnalyticsQueryDto,
    opts?: { openOnly?: boolean; periodField?: 'createdAt' | 'all' },
  ): Prisma.SupportTicketWhereInput {
    const w: Prisma.SupportTicketWhereInput = {};
    if (opts?.periodField !== 'all') {
      w.createdAt = { gte: from, lte: to };
    }
    if (opts?.openOnly) {
      w.status = { in: OPEN_STATUSES };
    }
    if (query.status?.trim()) {
      const st = query.status.toUpperCase().replace(/-/g, '_');
      if (
        Object.values(SupportTicketStatus).includes(st as SupportTicketStatus)
      ) {
        w.status = st as SupportTicketStatus;
      }
    }
    if (query.segment?.trim()) {
      const catKey = query.segment.toLowerCase().replace(/-/g, '_');
      const map: Record<string, SupportTicketCategory> = {
        deposit: SupportTicketCategory.DEPOSIT,
        withdrawal: SupportTicketCategory.WITHDRAWAL,
        wallet: SupportTicketCategory.OTHER,
        primary_purchase: SupportTicketCategory.OTHER,
        secondary_market: SupportTicketCategory.SECONDARY_MARKET,
        revenue_distribution: SupportTicketCategory.PAYOUTS,
        account: SupportTicketCategory.ACCOUNT,
        technical: SupportTicketCategory.TECHNICAL,
        other: SupportTicketCategory.OTHER,
      };
      if (map[catKey]) w.category = map[catKey];
    }
    if (query.source?.trim()) {
      const pr = query.source.toLowerCase();
      const pmap: Record<string, SupportTicketPriority> = {
        low: SupportTicketPriority.LOW,
        medium: SupportTicketPriority.MEDIUM,
        high: SupportTicketPriority.HIGH,
        critical: SupportTicketPriority.HIGH,
      };
      if (pmap[pr]) w.priority = pmap[pr];
    }
    if (query.role?.trim()) {
      const team = query.role.toLowerCase();
      if (team === 'finance') w.category = { in: FINANCE_CATEGORIES };
      else if (team === 'technical')
        w.category = SupportTicketCategory.TECHNICAL;
      else if (team === 'compliance') w.status = SupportTicketStatus.ESCALATED;
      else if (team === 'support') {
        w.category = {
          in: [SupportTicketCategory.ACCOUNT, SupportTicketCategory.OTHER],
        };
      }
    }
    if (query.hasDeposit === 'true') w.category = { in: FINANCE_CATEGORIES };
    if (query.hasRisk === 'true') w.status = SupportTicketStatus.ESCALATED;
    if (query.managerId?.trim()) w.assignedToUserId = query.managerId.trim();
    if (query.hasHoldings === 'unassigned') w.assignedToUserId = null;
    if (query.hasHoldings === 'high_priority')
      w.priority = SupportTicketPriority.HIGH;
    return w;
  }

  private openTicketFilter(
    query: AdminAnalyticsQueryDto,
  ): Prisma.SupportTicketWhereInput {
    const w: Prisma.SupportTicketWhereInput = { status: { in: OPEN_STATUSES } };
    if (query.status?.trim()) {
      const st = query.status.toUpperCase().replace(/-/g, '_');
      if (
        Object.values(SupportTicketStatus).includes(st as SupportTicketStatus)
      ) {
        w.status = st as SupportTicketStatus;
      }
    }
    if (query.segment?.trim()) {
      const catKey = query.segment.toLowerCase().replace(/-/g, '_');
      const map: Record<string, SupportTicketCategory> = {
        deposit: SupportTicketCategory.DEPOSIT,
        withdrawal: SupportTicketCategory.WITHDRAWAL,
        wallet: SupportTicketCategory.OTHER,
        primary_purchase: SupportTicketCategory.OTHER,
        secondary_market: SupportTicketCategory.SECONDARY_MARKET,
        revenue_distribution: SupportTicketCategory.PAYOUTS,
        account: SupportTicketCategory.ACCOUNT,
        technical: SupportTicketCategory.TECHNICAL,
        other: SupportTicketCategory.OTHER,
      };
      if (map[catKey]) w.category = map[catKey];
    }
    if (query.source?.trim()) {
      const pr = query.source.toLowerCase();
      const pmap: Record<string, SupportTicketPriority> = {
        low: SupportTicketPriority.LOW,
        medium: SupportTicketPriority.MEDIUM,
        high: SupportTicketPriority.HIGH,
        critical: SupportTicketPriority.HIGH,
      };
      if (pmap[pr]) w.priority = pmap[pr];
    }
    if (query.role?.trim()) {
      const team = query.role.toLowerCase();
      if (team === 'finance') w.category = { in: FINANCE_CATEGORIES };
      else if (team === 'technical')
        w.category = SupportTicketCategory.TECHNICAL;
      else if (team === 'compliance') w.status = SupportTicketStatus.ESCALATED;
      else if (team === 'support') {
        w.category = {
          in: [SupportTicketCategory.ACCOUNT, SupportTicketCategory.OTHER],
        };
      }
    }
    if (query.hasDeposit === 'true') w.category = { in: FINANCE_CATEGORIES };
    if (query.hasRisk === 'true') w.status = SupportTicketStatus.ESCALATED;
    if (query.managerId?.trim()) w.assignedToUserId = query.managerId.trim();
    if (query.hasHoldings === 'unassigned') w.assignedToUserId = null;
    if (query.hasHoldings === 'high_priority')
      w.priority = SupportTicketPriority.HIGH;
    return w;
  }

  private escalationTarget(category: SupportTicketCategory): string {
    if (
      category === SupportTicketCategory.DEPOSIT ||
      category === SupportTicketCategory.WITHDRAWAL ||
      category === SupportTicketCategory.PAYOUTS
    ) {
      return 'finance';
    }
    if (category === SupportTicketCategory.TECHNICAL) return 'technical';
    if (category === SupportTicketCategory.SECONDARY_MARKET)
      return 'compliance';
    return 'support';
  }

  private ticketSlaOverdue(
    tickets: Array<{
      createdAt: Date;
      priority: SupportTicketPriority;
      status: SupportTicketStatus;
    }>,
  ): number {
    const now = Date.now();
    let overdue = 0;
    for (const t of tickets) {
      const hours = (now - t.createdAt.getTime()) / (1000 * 60 * 60);
      if (hours > this.slaHours(t.priority, t.status)) overdue += 1;
    }
    return overdue;
  }

  async summary(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'operations');
    const { from, to, previousFrom, previousTo } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const periodWhere = this.ticketFilter(from, to, query);
    const prevWhere = this.ticketFilter(previousFrom, previousTo, query);

    const openTickets = await this.prisma.supportTicket.findMany({
      where: { status: { in: OPEN_STATUSES } },
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        assignedToUserId: true,
        category: true,
      },
    });

    const now = Date.now();
    let unassigned = 0;
    let inProgress = 0;
    let waitingUser = 0;
    let overdueSla = 0;
    let oldestOpenHours = 0;
    for (const t of openTickets) {
      if (!t.assignedToUserId) unassigned += 1;
      if (t.status === SupportTicketStatus.IN_PROGRESS) inProgress += 1;
      if (t.status === SupportTicketStatus.WAITING_USER) waitingUser += 1;
      const hours = (now - t.createdAt.getTime()) / (1000 * 60 * 60);
      if (hours > oldestOpenHours) oldestOpenHours = hours;
      if (hours > this.slaHours(t.priority, t.status)) overdueSla += 1;
    }

    const [
      createdInPeriod,
      prevCreated,
      closedInPeriod,
      prevClosed,
      escalated,
      financeRelated,
      depositTickets,
      withdrawalTickets,
      marketTickets,
      payoutsTickets,
      managersActive,
      reopenedApprox,
    ] = await Promise.all([
      this.prisma.supportTicket.count({ where: periodWhere }),
      this.prisma.supportTicket.count({ where: prevWhere }),
      this.prisma.supportTicket.count({
        where: { ...periodWhere, status: SupportTicketStatus.CLOSED },
      }),
      this.prisma.supportTicket.count({
        where: { ...prevWhere, status: SupportTicketStatus.CLOSED },
      }),
      this.prisma.supportTicket.count({
        where: { status: SupportTicketStatus.ESCALATED },
      }),
      this.prisma.supportTicket.count({
        where: { ...periodWhere, category: { in: FINANCE_CATEGORIES } },
      }),
      this.prisma.supportTicket.count({
        where: { ...periodWhere, category: SupportTicketCategory.DEPOSIT },
      }),
      this.prisma.supportTicket.count({
        where: { ...periodWhere, category: SupportTicketCategory.WITHDRAWAL },
      }),
      this.prisma.supportTicket.count({
        where: {
          ...periodWhere,
          category: SupportTicketCategory.SECONDARY_MARKET,
        },
      }),
      this.prisma.supportTicket.count({
        where: { ...periodWhere, category: SupportTicketCategory.PAYOUTS },
      }),
      this.prisma.supportTicket.groupBy({
        by: ['assignedToUserId'],
        where: {
          assignedToUserId: { not: null },
          status: { in: OPEN_STATUSES },
        },
        _count: { id: true },
      }),
      this.prisma.supportTicket.groupBy({
        by: ['userId'],
        where: periodWhere,
        _count: { id: true },
        having: { id: { _count: { gte: 2 } } },
      }),
    ]);

    const firstResponse = await this.computeFirstResponseStats(periodWhere);
    const resolution = await this.computeResolutionStats(periodWhere);

    const managerLoads = managersActive.map((m) => m._count.id);
    const maxLoad = managerLoads.length ? Math.max(...managerLoads) : 0;
    const avgLoad =
      managerLoads.length > 0
        ? Math.round(
            (managerLoads.reduce((a, b) => a + b, 0) / managerLoads.length) *
              10,
          ) / 10
        : 0;

    const closedForSla = await this.prisma.supportTicket.findMany({
      where: { ...periodWhere, status: SupportTicketStatus.CLOSED },
      select: {
        createdAt: true,
        updatedAt: true,
        priority: true,
        status: true,
      },
      take: 300,
    });
    let slaMet = 0;
    for (const t of closedForSla) {
      const hours =
        (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      if (hours <= this.slaHours(t.priority, t.status)) slaMet += 1;
    }
    const slaCompliancePct =
      closedForSla.length > 0
        ? Math.round((slaMet / closedForSla.length) * 1000) / 10
        : null;

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      openTickets: openTickets.length,
      inProgressTickets: inProgress,
      waitingUserTickets: waitingUser,
      unassignedOpen: unassigned,
      escalatedTickets: escalated,
      financeRelatedTickets: financeRelated,
      depositTickets,
      withdrawalTickets,
      marketTickets,
      payoutsTickets,
      createdInPeriod,
      closedInPeriod,
      overdueSla,
      oldestOpenHours: Math.round(oldestOpenHours),
      averageFirstResponseMinutes: firstResponse.avgMinutes,
      averageResolutionHours: resolution.avgHours,
      slaCompliancePct,
      activeManagers: managersActive.length,
      avgManagerLoad: avgLoad,
      maxManagerLoad: maxLoad,
      reopenedTickets: reopenedApprox.length,
      deltas: {
        createdPct: pctChange(createdInPeriod, prevCreated),
        closedPct: pctChange(closedInPeriod, prevClosed),
      },
      slaNote:
        'SLA рассчитывается по createdAt + priority/status (escalated = 2ч, high = 8ч, medium = 24ч, low = 72ч).',
    };
  }

  private async computeFirstResponseStats(
    where: Prisma.SupportTicketWhereInput,
  ) {
    const tickets = await this.prisma.supportTicket.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        userId: true,
        notes: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true, authorUserId: true },
        },
      },
      take: 200,
    });
    const deltas: number[] = [];
    for (const t of tickets) {
      const first = t.notes[0];
      if (first && first.authorUserId !== t.userId) {
        deltas.push(
          (first.createdAt.getTime() - t.createdAt.getTime()) / (1000 * 60),
        );
      }
    }
    const avgMinutes =
      deltas.length > 0
        ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
        : null;
    return { avgMinutes, sampleSize: deltas.length };
  }

  private async computeResolutionStats(where: Prisma.SupportTicketWhereInput) {
    const closed = await this.prisma.supportTicket.findMany({
      where: { ...where, status: SupportTicketStatus.CLOSED },
      select: { createdAt: true, updatedAt: true },
      take: 300,
    });
    const hours = closed.map(
      (t) => (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60),
    );
    const avgHours =
      hours.length > 0
        ? Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) /
          10
        : null;
    return { avgHours, sampleSize: hours.length };
  }

  async byStatus(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'operations');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const where = this.ticketFilter(from, to, query, { periodField: 'all' });
    const tickets = await this.prisma.supportTicket.findMany({
      where: { ...where, createdAt: { gte: from, lte: to } },
      select: { status: true, createdAt: true },
    });

    const byStatus = new Map<string, number>();
    const byDay = new Map<string, number>();
    for (const t of tickets) {
      const st = t.status.toLowerCase();
      byStatus.set(st, (byStatus.get(st) ?? 0) + 1);
      const day = t.createdAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }

    return {
      items: [...byStatus.entries()].map(([status, count]) => ({
        status,
        count,
      })),
      trend: [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, count]) => ({ period, count })),
    };
  }

  async byCategory(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'operations');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const where = this.ticketFilter(from, to, query);
    const tickets = await this.prisma.supportTicket.findMany({
      where,
      select: { category: true, createdAt: true },
    });

    const byCat = new Map<string, number>();
    const byDay = new Map<string, number>();
    const categoryApi: Record<SupportTicketCategory, string> = {
      DEPOSIT: 'deposit',
      WITHDRAWAL: 'withdrawal',
      WALLET: 'wallet',
      PRIMARY_PURCHASE: 'primary_purchase',
      ACCOUNT: 'account',
      SECONDARY_MARKET: 'secondary_market',
      PAYOUTS: 'payouts',
      TECHNICAL: 'technical',
      OTHER: 'other',
    };
    for (const t of tickets) {
      const key = categoryApi[t.category];
      byCat.set(key, (byCat.get(key) ?? 0) + 1);
      const day = t.createdAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }

    return {
      items: [...byCat.entries()].map(([category, count]) => {
        const enumKey = category
          .toUpperCase()
          .replace(/-/g, '_') as SupportTicketCategory;
        return {
          category,
          label: SUPPORT_CATEGORY_LABELS[enumKey] ?? category,
          count,
        };
      }),
      share: [...byCat.entries()].map(([category, count]) => {
        const total = tickets.length || 1;
        const enumKey = category
          .toUpperCase()
          .replace(/-/g, '_') as SupportTicketCategory;
        return {
          category,
          label: SUPPORT_CATEGORY_LABELS[enumKey] ?? category,
          pct: Math.round((count / total) * 1000) / 10,
        };
      }),
      trend: [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, count]) => ({ period, count })),
    };
  }

  async responseTime(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'operations');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const where = this.ticketFilter(from, to, query);

    const closed = await this.prisma.supportTicket.findMany({
      where: { ...where, status: SupportTicketStatus.CLOSED },
      select: { createdAt: true, updatedAt: true },
      take: 500,
    });

    const byDay = new Map<string, { sum: number; n: number }>();
    for (const t of closed) {
      const day = t.updatedAt.toISOString().slice(0, 10);
      const hours =
        (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      const prev = byDay.get(day) ?? { sum: 0, n: 0 };
      prev.sum += hours;
      prev.n += 1;
      byDay.set(day, prev);
    }

    const resolution = await this.computeResolutionStats(where);
    const firstResponseTickets = await this.prisma.supportTicket.findMany({
      where,
      select: {
        createdAt: true,
        userId: true,
        notes: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true, authorUserId: true },
        },
      },
      take: 500,
    });
    const frByDay = new Map<string, { sum: number; n: number }>();
    for (const t of firstResponseTickets) {
      const first = t.notes[0];
      if (!first || first.authorUserId === t.userId) continue;
      const day = first.createdAt.toISOString().slice(0, 10);
      const mins =
        (first.createdAt.getTime() - t.createdAt.getTime()) / (1000 * 60);
      const prev = frByDay.get(day) ?? { sum: 0, n: 0 };
      prev.sum += mins;
      prev.n += 1;
      frByDay.set(day, prev);
    }
    const firstResponse = await this.computeFirstResponseStats(where);

    return {
      averageResolutionHours: resolution.avgHours,
      averageFirstResponseMinutes: firstResponse.avgMinutes,
      sampleSize: resolution.sampleSize,
      items: [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, v]) => ({
          period,
          averageHours: v.n > 0 ? Math.round((v.sum / v.n) * 10) / 10 : null,
        })),
      firstResponseTrend: [...frByDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, v]) => ({
          period,
          averageMinutes: v.n > 0 ? Math.round(v.sum / v.n) : null,
        })),
    };
  }

  async byManager(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'operations');
    return this.workload(roles, query);
  }

  async queue(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'operations');
    const limit = Math.min(query.limit ?? 30, 50);
    const now = Date.now();

    let tickets = await this.prisma.supportTicket.findMany({
      where: this.openTicketFilter(query),
      include: {
        user: { select: { id: true, email: true } },
        assignedTo: { select: { email: true } },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, createdAt: true },
        },
      },
      take: 100,
    });

    if (query.hasRisk === 'overdue') {
      const now = Date.now();
      tickets = tickets.filter((t) => {
        const hours = (now - t.createdAt.getTime()) / (1000 * 60 * 60);
        return hours > this.slaHours(t.priority, t.status);
      });
    }

    const priorityOrder: Record<SupportTicketPriority, number> = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };

    const sorted = tickets
      .map((t) => {
        const hours = (now - t.createdAt.getTime()) / (1000 * 60 * 60);
        const sla = this.slaHours(t.priority, t.status);
        return {
          ticketId: t.id,
          userId: t.userId,
          userEmail: t.user.email,
          subject: t.subject,
          category: t.category.toLowerCase(),
          categoryLabel: SUPPORT_CATEGORY_LABELS[t.category],
          priority: t.priority.toLowerCase(),
          status: t.status.toLowerCase(),
          assignedTo: t.assignedTo?.email ?? null,
          slaOverdue: hours > sla,
          relatedEntityId: this.extractEntityId(t.subject),
          lastMessagePreview: t.notes[0]?.body?.slice(0, 80) ?? null,
          updatedAt: t.updatedAt.toISOString(),
          _prio: priorityOrder[t.priority],
          _hours: hours,
          _unassigned: t.assignedToUserId ? 1 : 0,
        };
      })
      .sort((a, b) => {
        if (a._prio !== b._prio) return a._prio - b._prio;
        if (a.slaOverdue !== b.slaOverdue) return a.slaOverdue ? -1 : 1;
        if (a._unassigned !== b._unassigned)
          return a._unassigned - b._unassigned;
        return b._hours - a._hours;
      })
      .slice(0, limit)
      .map((row) => {
        const { _prio, _hours, _unassigned, ...rest } = row;
        void _prio;
        void _hours;
        void _unassigned;
        return rest;
      });

    return { items: sorted };
  }

  private extractEntityId(subject: string): string | null {
    const m = subject.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
    );
    return m?.[0] ?? null;
  }

  async sla(roles: string[], _query: AdminAnalyticsQueryDto) {
    void _query;
    assertAnalyticsArea(roles, 'operations');
    const open = await this.prisma.supportTicket.findMany({
      where: { status: { in: OPEN_STATUSES } },
      select: { createdAt: true, priority: true, status: true },
    });

    const now = Date.now();
    const buckets = [
      { label: '0–2 ч', key: '0-2h', count: 0, overdue: 0 },
      { label: '2–8 ч', key: '2-8h', count: 0, overdue: 0 },
      { label: '8–24 ч', key: '8-24h', count: 0, overdue: 0 },
      { label: '24–72 ч', key: '24-72h', count: 0, overdue: 0 },
      { label: '72 ч+', key: '72h+', count: 0, overdue: 0 },
    ];

    const overdueByPriority = new Map<string, number>();
    let avgAgeHours = 0;
    for (const t of open) {
      const hours = (now - t.createdAt.getTime()) / (1000 * 60 * 60);
      avgAgeHours += hours;
      const sla = this.slaHours(t.priority, t.status);
      const isOverdue = hours > sla;
      if (hours < 2) buckets[0].count += 1;
      else if (hours < 8) buckets[1].count += 1;
      else if (hours < 24) buckets[2].count += 1;
      else if (hours < 72) buckets[3].count += 1;
      else buckets[4].count += 1;
      if (isOverdue) {
        const pk = t.priority.toLowerCase();
        overdueByPriority.set(pk, (overdueByPriority.get(pk) ?? 0) + 1);
        if (hours < 2) buckets[0].overdue += 1;
        else if (hours < 8) buckets[1].overdue += 1;
        else if (hours < 24) buckets[2].overdue += 1;
        else if (hours < 72) buckets[3].overdue += 1;
        else buckets[4].overdue += 1;
      }
    }

    return {
      buckets,
      averageAgeHours: open.length ? Math.round(avgAgeHours / open.length) : 0,
      overdueTotal: this.ticketSlaOverdue(open),
      overdueByPriority: [...overdueByPriority.entries()].map(
        ([priority, count]) => ({
          priority,
          count,
        }),
      ),
      slaNote:
        'SLA по priority/status; escalated = 2ч. Отдельное поле SLA в БД отсутствует.',
    };
  }

  async financeRelated(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'operations');
    const limit = Math.min(query.limit ?? 20, 40);
    const now = Date.now();

    const tickets = await this.prisma.supportTicket.findMany({
      where: {
        category: { in: FINANCE_CATEGORIES },
        status: { in: OPEN_STATUSES },
      },
      include: {
        user: { select: { email: true, id: true } },
        assignedTo: { select: { email: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: limit,
    });

    return {
      items: tickets.map((t) => {
        const hours = (now - t.createdAt.getTime()) / (1000 * 60 * 60);
        return {
          ticketId: t.id,
          userId: t.userId,
          userEmail: t.user.email,
          category: t.category.toLowerCase(),
          categoryLabel: SUPPORT_CATEGORY_LABELS[t.category],
          relatedEntityId: this.extractEntityId(t.subject),
          amountUsdt: null as string | null,
          status: t.status.toLowerCase(),
          priority: t.priority.toLowerCase(),
          assignedTo: t.assignedTo?.email ?? null,
          slaOverdue: hours > this.slaHours(t.priority, t.status),
        };
      }),
    };
  }

  async escalations(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'operations');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const limit = Math.min(query.limit ?? 20, 40);
    const now = Date.now();

    const tickets = await this.prisma.supportTicket.findMany({
      where: {
        status: SupportTicketStatus.ESCALATED,
        createdAt: { gte: from, lte: to },
      },
      include: {
        assignedTo: { select: { email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return {
      count: tickets.length,
      items: tickets.map((t) => ({
        ticketId: t.id,
        category: t.category.toLowerCase(),
        categoryLabel: SUPPORT_CATEGORY_LABELS[t.category],
        priority: t.priority.toLowerCase(),
        escalatedTo: this.escalationTarget(t.category),
        reason: t.subject.slice(0, 120),
        assignedTeam: this.escalationTarget(t.category),
        assignedTo: t.assignedTo?.email ?? null,
        hoursInEscalation: Math.round(
          (now - t.updatedAt.getTime()) / (1000 * 60 * 60),
        ),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    };
  }

  async workload(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'operations');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const assigned = await this.prisma.supportTicket.groupBy({
      by: ['assignedToUserId'],
      where: { assignedToUserId: { not: null } },
      _count: { id: true },
    });

    const userIds = assigned.map((g) => g.assignedToUserId!).filter(Boolean);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    const emailMap = new Map(users.map((u) => [u.id, u.email]));

    const items = await Promise.all(
      assigned.map(async (g) => {
        const managerId = g.assignedToUserId!;
        const [open, inProgress, closedInPeriod, escalated] = await Promise.all(
          [
            this.prisma.supportTicket.count({
              where: {
                assignedToUserId: managerId,
                status: { in: OPEN_STATUSES },
              },
            }),
            this.prisma.supportTicket.count({
              where: {
                assignedToUserId: managerId,
                status: SupportTicketStatus.IN_PROGRESS,
              },
            }),
            this.prisma.supportTicket.count({
              where: {
                assignedToUserId: managerId,
                status: SupportTicketStatus.CLOSED,
                updatedAt: { gte: from, lte: to },
              },
            }),
            this.prisma.supportTicket.count({
              where: {
                assignedToUserId: managerId,
                status: SupportTicketStatus.ESCALATED,
              },
            }),
          ],
        );

        const closed = await this.prisma.supportTicket.findMany({
          where: {
            assignedToUserId: managerId,
            status: SupportTicketStatus.CLOSED,
            updatedAt: { gte: from, lte: to },
          },
          select: {
            createdAt: true,
            updatedAt: true,
            priority: true,
            status: true,
          },
          take: 50,
        });
        const resHours =
          closed.length > 0
            ? Math.round(
                closed.reduce(
                  (s, t) =>
                    s +
                    (t.updatedAt.getTime() - t.createdAt.getTime()) /
                      (1000 * 60 * 60),
                  0,
                ) / closed.length,
              )
            : null;

        let slaMet = 0;
        for (const t of closed) {
          const hours =
            (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
          if (hours <= this.slaHours(t.priority, t.status)) slaMet += 1;
        }
        const slaCompliancePct =
          closed.length > 0
            ? Math.round((slaMet / closed.length) * 1000) / 10
            : null;

        const frTickets = await this.prisma.supportTicket.findMany({
          where: {
            assignedToUserId: managerId,
            createdAt: { gte: from, lte: to },
          },
          select: {
            createdAt: true,
            userId: true,
            notes: {
              orderBy: { createdAt: 'asc' },
              take: 1,
              select: { createdAt: true, authorUserId: true },
            },
          },
          take: 40,
        });
        const frMins: number[] = [];
        for (const t of frTickets) {
          const first = t.notes[0];
          if (first && first.authorUserId !== t.userId) {
            frMins.push(
              (first.createdAt.getTime() - t.createdAt.getTime()) / (1000 * 60),
            );
          }
        }
        const avgFirstResponseMinutes =
          frMins.length > 0
            ? Math.round(frMins.reduce((a, b) => a + b, 0) / frMins.length)
            : null;

        return {
          managerId,
          managerEmail: emailMap.get(managerId) ?? '—',
          openTickets: open,
          inProgressTickets: inProgress,
          closedInPeriod: closedInPeriod,
          escalatedCount: escalated,
          avgResolutionHours: resHours,
          avgFirstResponseMinutes,
          slaCompliancePct,
          reopenedCount: 0,
          totalAssigned: g._count.id,
        };
      }),
    );

    return {
      items: items.sort((a, b) => b.openTickets - a.openTickets),
    };
  }

  async resolutionQuality(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'operations');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const where = this.ticketFilter(from, to, query);

    const [closed, repeatUsers, withNotes] = await Promise.all([
      this.prisma.supportTicket.count({
        where: { ...where, status: SupportTicketStatus.CLOSED },
      }),
      this.prisma.supportTicket.groupBy({
        by: ['userId'],
        where,
        _count: { id: true },
        having: { id: { _count: { gte: 2 } } },
      }),
      this.prisma.supportTicket.findMany({
        where: { ...where, status: SupportTicketStatus.CLOSED },
        select: { id: true, _count: { select: { notes: true } } },
        take: 200,
      }),
    ]);

    const closedNoNotes = await this.prisma.supportTicket.count({
      where: {
        ...where,
        status: SupportTicketStatus.CLOSED,
        notes: { none: {} },
      },
    });

    const noteCounts = withNotes.map((t) => t._count.notes);
    const avgMessages =
      noteCounts.length > 0
        ? Math.round(
            (noteCounts.reduce((a, b) => a + b, 0) / noteCounts.length) * 10,
          ) / 10
        : null;

    return {
      closedTickets: closed,
      reopenedTickets: 0,
      repeatedUsersCount: repeatUsers.length,
      closedWithoutResponseCount: closedNoNotes,
      avgMessagesPerTicket: avgMessages,
      note: 'Reopened tickets не хранятся в схеме; reopenedTickets = 0 до отдельного поля.',
    };
  }

  async productPainPoints(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'operations');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const where = this.ticketFilter(from, to, query);

    const grouped = await this.prisma.supportTicket.groupBy({
      by: ['category'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return {
      items: grouped.map((g) => ({
        key: g.category.toLowerCase(),
        label: PRODUCT_PAIN_BY_CATEGORY[g.category],
        categoryLabel: SUPPORT_CATEGORY_LABELS[g.category],
        count: g._count.id,
      })),
    };
  }
}
