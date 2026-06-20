import { Injectable } from '@nestjs/common';
import {
  ListingStatus,
  Prisma,
  PrimaryRaiseRoundStatus,
  ReleaseStatus,
  TradeSettlementStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  assertAnalyticsArea,
  formatMoneyRu,
  pctChange,
  resolveAnalyticsPeriod,
} from '../../common/admin-analytics.util';
import type { AdminAnalyticsQueryDto } from '../../common/dto/admin-analytics-query.dto';

@Injectable()
export class AdminAnalyticsTracksService {
  constructor(private readonly prisma: PrismaService) {}

  private releaseWhere(): Prisma.ReleaseWhereInput {
    return { deletedAt: null };
  }

  private computeReadiness(release: {
    coverUrl: string | null;
    description: string | null;
    genre: string | null;
    platformSharePct: Prisma.Decimal | null;
    artistSharePct: Prisma.Decimal | null;
    holderSharePct: Prisma.Decimal | null;
    totalUnits: Prisma.Decimal;
    releaseArtists: { id: string }[];
    primaryRaiseRounds: { status: PrimaryRaiseRoundStatus }[];
    audioPreviewUrl: string | null;
  }) {
    const missing: string[] = [];
    let score = 0;
    if (release.coverUrl) score += 20;
    else missing.push('cover');
    if (release.releaseArtists.length > 0) score += 15;
    else missing.push('artist');
    if (release.description?.trim()) score += 15;
    else missing.push('description');
    if (release.genre?.trim()) score += 5;
    else missing.push('genre');
    const shareSum =
      Number(release.platformSharePct?.toString() ?? 0) +
      Number(release.artistSharePct?.toString() ?? 0) +
      Number(release.holderSharePct?.toString() ?? 0);
    if (shareSum >= 99 && shareSum <= 101) score += 20;
    else missing.push('revenue_shares');
    if (Number(release.totalUnits.toString()) > 0) score += 15;
    else missing.push('units');
    if (
      release.primaryRaiseRounds.some(
        (r) => r.status === PrimaryRaiseRoundStatus.LIVE,
      )
    )
      score += 15;
    else missing.push('live_round');
    if (release.audioPreviewUrl) score += 5;
    else missing.push('audio_preview');
    return { readinessScore: Math.min(100, score), missingFields: missing };
  }

  async summary(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'tracks');
    const { from, to, previousFrom, previousTo } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const baseWhere = this.releaseWhere();

    const byStatus = await this.prisma.release.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: { id: true },
    });

    const statusCount = (s: ReleaseStatus) =>
      byStatus.find((r) => r.status === s)?._count.id ?? 0;

    const [
      totalReleases,
      liveRounds,
      completedRounds,
      roundsNoSales,
      raisedAgg,
      listingsActive,
      tradesPeriod,
      volumePeriod,
      prevRaised,
      incompleteCover,
    ] = await Promise.all([
      this.prisma.release.count({ where: baseWhere }),
      this.prisma.primaryRaiseRound.count({
        where: { status: PrimaryRaiseRoundStatus.LIVE },
      }),
      this.prisma.primaryRaiseRound.count({
        where: { status: PrimaryRaiseRoundStatus.COMPLETED },
      }),
      this.prisma.primaryRaiseRound.count({
        where: {
          soldUnits: { equals: 0 },
          status: {
            in: [PrimaryRaiseRoundStatus.LIVE, PrimaryRaiseRoundStatus.PAUSED],
          },
        },
      }),
      this.prisma.primaryRaiseRound.aggregate({
        _sum: { raisedAmountUsdt: true, soldUnits: true, totalUnits: true },
      }),
      this.prisma.marketListing.count({
        where: { status: ListingStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.trade.count({
        where: { executedAt: { gte: from, lte: to } },
      }),
      this.prisma.trade.aggregate({
        where: { executedAt: { gte: from, lte: to } },
        _sum: { grossAmount: true },
      }),
      this.prisma.primaryRaiseRound.aggregate({
        where: { updatedAt: { gte: previousFrom, lte: previousTo } },
        _sum: { raisedAmountUsdt: true },
      }),
      this.prisma.release.count({ where: { ...baseWhere, coverUrl: null } }),
    ]);

    const totalRaised = Number(
      (raisedAgg._sum.raisedAmountUsdt ?? 0).toString(),
    );
    const prevRaisedNum = Number(
      (prevRaised._sum.raisedAmountUsdt ?? 0).toString(),
    );
    const soldUnits = Number((raisedAgg._sum.soldUnits ?? 0).toString());
    const totalUnits = Number((raisedAgg._sum.totalUnits ?? 0).toString());
    const availableUnits = Math.max(0, totalUnits - soldUnits);

    const liveRoundRows = await this.prisma.primaryRaiseRound.findMany({
      where: { status: PrimaryRaiseRoundStatus.LIVE },
      select: { raiseTargetUsdt: true, raisedAmountUsdt: true },
    });
    const avgProgress =
      liveRoundRows.length > 0
        ? Math.round(
            liveRoundRows.reduce((s, r) => {
              const t = Number(r.raiseTargetUsdt.toString());
              const raised = Number(r.raisedAmountUsdt.toString());
              return s + (t > 0 ? (raised / t) * 100 : 0);
            }, 0) / liveRoundRows.length,
          )
        : 0;

    const payload = {
      period: { from: from.toISOString(), to: to.toISOString() },
      totalReleases,
      publishedReleases:
        statusCount(ReleaseStatus.ACTIVE) + statusCount(ReleaseStatus.SOLD_OUT),
      draftReleases: statusCount(ReleaseStatus.DRAFT),
      reviewReleases: statusCount(ReleaseStatus.REVIEW),
      incompleteReleases: incompleteCover,
      liveRounds,
      completedRounds,
      roundsWithoutSales: roundsNoSales,
      averageRoundProgressPct: avgProgress,
      totalUnits: Math.round(totalUnits),
      soldUnits: Math.round(soldUnits),
      availableUnits: Math.round(availableUnits),
      totalRaisedUsdt: formatMoneyRu(totalRaised),
      activeListings: listingsActive,
      secondaryTrades: tradesPeriod,
      secondaryVolumeUsdt: formatMoneyRu(volumePeriod._sum.grossAmount ?? 0),
      byStatus: byStatus.map((s) => ({
        status: s.status.toLowerCase(),
        count: s._count.id,
      })),
      activeReleases: statusCount(ReleaseStatus.ACTIVE),
      liveRoundsLegacy: liveRounds,
      deltas: {
        raisedPct: pctChange(totalRaised, prevRaisedNum),
      },
    };
    return payload;
  }

  async roundProgress(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'tracks');
    const limit = Math.min(query.limit ?? 25, 50);
    const rounds = await this.prisma.primaryRaiseRound.findMany({
      where: {
        status: {
          in: [
            PrimaryRaiseRoundStatus.LIVE,
            PrimaryRaiseRoundStatus.PAUSED,
            PrimaryRaiseRoundStatus.DRAFT,
            PrimaryRaiseRoundStatus.COMPLETED,
          ],
        },
      },
      include: {
        release: {
          include: {
            releaseArtists: { include: { artist: true }, take: 1 },
          },
        },
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    const releaseIds = [...new Set(rounds.map((r) => r.releaseId))];
    const holderCounts = await this.prisma.userPosition.groupBy({
      by: ['releaseId'],
      where: { releaseId: { in: releaseIds } },
      _count: { userId: true },
    });
    const holderMap = new Map(
      holderCounts.map((h) => [h.releaseId, h._count.userId]),
    );

    const now = Date.now();
    const items = rounds.map((r) => {
      const target = Number(r.raiseTargetUsdt.toString());
      const hardCap = Number(r.hardCapUsdt.toString());
      const raised = Number(r.raisedAmountUsdt.toString());
      const sold = Number(r.soldUnits.toString());
      const total = Number(r.totalUnits.toString());
      const progressPct =
        target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
      const daysLeft =
        r.endDate != null
          ? Math.max(
              0,
              Math.ceil((r.endDate.getTime() - now) / (24 * 60 * 60 * 1000)),
            )
          : null;
      const warnings: string[] = [];
      if (sold <= 0 && r.status === PrimaryRaiseRoundStatus.LIVE)
        warnings.push('no_sales');
      if (progressPct < 10 && r.status === PrimaryRaiseRoundStatus.LIVE)
        warnings.push('low_progress');
      if (
        daysLeft != null &&
        daysLeft <= 7 &&
        r.status === PrimaryRaiseRoundStatus.LIVE
      )
        warnings.push('ending_soon');
      if (sold >= total && total > 0) warnings.push('sold_out');
      if (!r.release.coverUrl) warnings.push('missing_cover');

      const artistName = r.release.releaseArtists[0]?.artist?.name ?? '—';
      return {
        roundId: r.id,
        trackId: r.releaseId,
        trackTitle: r.release.title,
        artistName,
        status: r.status.toLowerCase(),
        raisedUsdt: formatMoneyRu(raised),
        targetUsdt: formatMoneyRu(target),
        hardCapUsdt: formatMoneyRu(hardCap),
        progressPct,
        soldUnits: sold.toFixed(0),
        availableUnits: Math.max(0, total - sold).toFixed(0),
        totalUnits: total.toFixed(0),
        holdersCount: holderMap.get(r.releaseId) ?? 0,
        daysLeft,
        warnings,
      };
    });

    return { items };
  }

  async units(roles: string[], _query: AdminAnalyticsQueryDto) {
    void _query;
    assertAnalyticsArea(roles, 'tracks');
    const agg = await this.prisma.primaryRaiseRound.aggregate({
      _sum: { soldUnits: true, totalUnits: true },
    });
    const sold = Number((agg._sum.soldUnits ?? 0).toString());
    const total = Number((agg._sum.totalUnits ?? 0).toString());
    const lockedListings = await this.prisma.marketListing.aggregate({
      where: { status: ListingStatus.ACTIVE, deletedAt: null },
      _sum: { unitsAvailable: true },
    });
    const locked = Number((lockedListings._sum.unitsAvailable ?? 0).toString());

    const byRelease = await this.prisma.primaryRaiseRound.groupBy({
      by: ['releaseId'],
      _sum: { soldUnits: true, totalUnits: true },
      orderBy: { _sum: { soldUnits: 'desc' } },
      take: 15,
    });
    const releases = await this.prisma.release.findMany({
      where: { id: { in: byRelease.map((b) => b.releaseId) } },
      select: { id: true, title: true },
    });
    const titleMap = new Map(releases.map((r) => [r.id, r.title]));

    return {
      soldUnits: Math.round(sold),
      availableUnits: Math.round(Math.max(0, total - sold)),
      lockedInListings: Math.round(locked),
      byRelease: byRelease.map((b) => ({
        trackId: b.releaseId,
        trackTitle: titleMap.get(b.releaseId) ?? '—',
        soldUnits: Number((b._sum.soldUnits ?? 0).toString()).toFixed(0),
        availableUnits: Math.max(
          0,
          Number((b._sum.totalUnits ?? 0).toString()) -
            Number((b._sum.soldUnits ?? 0).toString()),
        ).toFixed(0),
      })),
    };
  }

  async readiness(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'tracks');
    const limit = Math.min(query.limit ?? 20, 50);
    const releases = await this.prisma.release.findMany({
      where: this.releaseWhere(),
      include: {
        releaseArtists: { take: 1 },
        primaryRaiseRounds: { select: { status: true } },
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
    });

    const items = releases.map((r) => {
      const { readinessScore, missingFields } = this.computeReadiness(r);
      return {
        trackId: r.id,
        trackTitle: r.title,
        status: r.status.toLowerCase(),
        readinessScore,
        missingFields,
      };
    });

    items.sort((a, b) => a.readinessScore - b.readinessScore);
    return { items: items.slice(0, limit) };
  }

  async top(roles: string[], _query: AdminAnalyticsQueryDto) {
    void _query;
    assertAnalyticsArea(roles, 'tracks');

    const raisedByRelease = await this.prisma.primaryRaiseRound.groupBy({
      by: ['releaseId'],
      _sum: { raisedAmountUsdt: true, soldUnits: true },
    });
    const releases = await this.prisma.release.findMany({
      where: {
        id: { in: raisedByRelease.map((r) => r.releaseId) },
        ...this.releaseWhere(),
      },
      select: { id: true, title: true, coverUrl: true },
    });
    const titleMap = new Map(releases.map((r) => [r.id, r]));

    const topByRaised = [...raisedByRelease]
      .map((r) => ({
        trackId: r.releaseId,
        trackTitle: titleMap.get(r.releaseId)?.title ?? '—',
        valueUsdt: formatMoneyRu(r._sum.raisedAmountUsdt ?? 0),
        metric: Number((r._sum.raisedAmountUsdt ?? 0).toString()),
      }))
      .sort((a, b) => b.metric - a.metric)
      .slice(0, 5);

    const holderGroups = await this.prisma.userPosition.groupBy({
      by: ['releaseId'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 5,
    });

    const lowProgress = await this.prisma.primaryRaiseRound.findMany({
      where: { status: PrimaryRaiseRoundStatus.LIVE, soldUnits: { equals: 0 } },
      include: { release: { select: { id: true, title: true } } },
      take: 5,
    });

    const noCover = await this.prisma.release.findMany({
      where: { ...this.releaseWhere(), coverUrl: null },
      take: 5,
      select: { id: true, title: true },
    });

    const attention = [
      ...lowProgress.map((r) => ({
        trackId: r.releaseId,
        trackTitle: r.release.title,
        reason: 'live_round_no_sales',
        label: 'Live раунд без продаж',
      })),
      ...noCover.map((r) => ({
        trackId: r.id,
        trackTitle: r.title,
        reason: 'missing_cover',
        label: 'Нет обложки',
      })),
    ].slice(0, 10);

    return {
      topByRaised,
      topByHolders: holderGroups.map((h) => ({
        trackId: h.releaseId,
        trackTitle: titleMap.get(h.releaseId)?.title ?? '—',
        holdersCount: h._count.userId,
      })),
      attention,
    };
  }

  async revenue(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'tracks');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const fees = await this.prisma.fee.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        subjectType: { in: ['release', 'primary_purchase', 'order'] },
      },
      select: { subjectId: true, amountCharged: true },
    });

    const payouts = await this.prisma.payout.groupBy({
      by: ['releaseId'],
      where: { createdAt: { gte: from, lte: to } },
      _sum: { amountNet: true },
    });

    const byRelease = new Map<string, number>();
    for (const f of fees) {
      if (!f.subjectId) continue;
      byRelease.set(
        f.subjectId,
        (byRelease.get(f.subjectId) ?? 0) + Number(f.amountCharged.toString()),
      );
    }

    const payoutMap = new Map(
      payouts.map((p) => [
        p.releaseId,
        Number((p._sum.amountNet ?? 0).toString()),
      ]),
    );

    const releases = await this.prisma.release.findMany({
      where: {
        id: { in: [...new Set([...byRelease.keys(), ...payoutMap.keys()])] },
      },
      select: { id: true, title: true },
    });
    const titleMap = new Map(releases.map((r) => [r.id, r.title]));

    return {
      items: [...byRelease.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([trackId, amount]) => ({
          trackId,
          trackTitle: titleMap.get(trackId) ?? trackId.slice(0, 8),
          grossRevenueUsdt: formatMoneyRu(amount),
          distributedUsdt: formatMoneyRu(payoutMap.get(trackId) ?? 0),
          platformShareUsdt: formatMoneyRu(amount * 0.1),
        })),
    };
  }

  async holders(roles: string[], _query: AdminAnalyticsQueryDto) {
    void _query;
    assertAnalyticsArea(roles, 'tracks');
    const grouped = await this.prisma.userPosition.groupBy({
      by: ['releaseId'],
      _count: { userId: true },
      _sum: { unitsTotal: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 20,
    });

    const releases = await this.prisma.release.findMany({
      where: { id: { in: grouped.map((g) => g.releaseId) } },
      select: { id: true, title: true },
    });
    const titleMap = new Map(releases.map((r) => [r.id, r.title]));

    const items = await Promise.all(
      grouped.map(async (g) => {
        const totalUnits = Number((g._sum.unitsTotal ?? 0).toString());
        const top = await this.prisma.userPosition.findFirst({
          where: { releaseId: g.releaseId },
          orderBy: { unitsTotal: 'desc' },
          select: { unitsTotal: true },
        });
        const topUnits = Number((top?.unitsTotal ?? 0).toString());
        const topSharePct =
          totalUnits > 0 ? Math.round((topUnits / totalUnits) * 1000) / 10 : 0;
        return {
          trackId: g.releaseId,
          trackTitle: titleMap.get(g.releaseId) ?? '—',
          holdersCount: g._count.userId,
          totalUnits: totalUnits.toFixed(0),
          averageUnitsPerHolder:
            g._count.userId > 0
              ? (totalUnits / g._count.userId).toFixed(2)
              : '0',
          topHolderSharePct: topSharePct,
          highConcentration: topSharePct >= 50,
        };
      }),
    );

    return { items };
  }

  async secondaryActivity(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'tracks');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const [trades, listings] = await Promise.all([
      this.prisma.trade.groupBy({
        by: ['releaseId'],
        where: { executedAt: { gte: from, lte: to } },
        _count: { id: true },
        _sum: { grossAmount: true, units: true },
      }),
      this.prisma.marketListing.groupBy({
        by: ['releaseId'],
        where: { status: ListingStatus.ACTIVE, deletedAt: null },
        _count: { id: true },
      }),
    ]);

    const releaseIds = [
      ...new Set([
        ...trades.map((t) => t.releaseId),
        ...listings.map((l) => l.releaseId),
      ]),
    ];
    const releases = await this.prisma.release.findMany({
      where: { id: { in: releaseIds } },
      select: { id: true, title: true, primaryUnitPrice: true },
    });
    const titleMap = new Map(releases.map((r) => [r.id, r]));

    return {
      items: releaseIds.map((releaseId) => {
        const t = trades.find((x) => x.releaseId === releaseId);
        const l = listings.find((x) => x.releaseId === releaseId);
        const rel = titleMap.get(releaseId);
        const tradeCount = t?._count.id ?? 0;
        const volume = Number((t?._sum.grossAmount ?? 0).toString());
        const units = Number((t?._sum.units ?? 0).toString());
        const avgPrice = units > 0 ? volume / units : 0;
        const primaryPrice = Number(rel?.primaryUnitPrice?.toString() ?? 0);
        return {
          trackId: releaseId,
          trackTitle: rel?.title ?? '—',
          listingsCount: l?._count.id ?? 0,
          tradesCount: tradeCount,
          volumeUsdt: formatMoneyRu(volume),
          averagePriceUsdt: formatMoneyRu(avgPrice),
          primaryPriceUsdt: formatMoneyRu(primaryPrice),
          priceVsPrimaryPct:
            primaryPrice > 0
              ? Math.round(((avgPrice - primaryPrice) / primaryPrice) * 1000) /
                10
              : null,
        };
      }),
    };
  }
}

@Injectable()
export class AdminAnalyticsMarketService {
  constructor(private readonly prisma: PrismaService) {}

  private releaseIdFromQuery(
    query: AdminAnalyticsQueryDto,
  ): string | undefined {
    return query.trackId?.trim() || undefined;
  }

  private settledTradeWhere(
    from: Date,
    to: Date,
    releaseId?: string,
  ): Prisma.TradeWhereInput {
    const base: Prisma.TradeWhereInput = {
      executedAt: { gte: from, lte: to },
      settlementStatus: TradeSettlementStatus.SETTLED,
    };
    if (releaseId) base.releaseId = releaseId;
    return base;
  }

  private async suspiciousTradeIds(): Promise<Set<string>> {
    const logs = await this.prisma.auditLog.findMany({
      where: { action: 'trade.mark_suspicious', entityType: 'trade' },
      select: { entityId: true },
    });
    return new Set(
      logs.map((l) => l.entityId).filter((id): id is string => Boolean(id)),
    );
  }

  async summary(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'market');
    const { from, to, previousFrom, previousTo } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const releaseId = this.releaseIdFromQuery(query);
    const tradeWhere = this.settledTradeWhere(from, to, releaseId);
    const prevTradeWhere = this.settledTradeWhere(
      previousFrom,
      previousTo,
      releaseId,
    );
    const staleBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const listingActiveWhere: Prisma.MarketListingWhereInput = {
      deletedAt: null,
      status: ListingStatus.ACTIVE,
      ...(releaseId ? { releaseId } : {}),
    };

    const [
      activeListings,
      frozenListings,
      activeRows,
      tradesAgg,
      prevTradesAgg,
      uniqueSellers,
      uniqueBuyers,
      suspiciousCount,
      staleListings,
      feesAgg,
      prevFeesAgg,
    ] = await Promise.all([
      this.prisma.marketListing.count({ where: listingActiveWhere }),
      this.prisma.marketListing.count({
        where: {
          deletedAt: null,
          status: ListingStatus.PAUSED,
          ...(releaseId ? { releaseId } : {}),
        },
      }),
      this.prisma.marketListing.findMany({
        where: listingActiveWhere,
        select: { unitsAvailable: true, pricePerUnit: true, createdAt: true },
      }),
      this.prisma.trade.aggregate({
        where: tradeWhere,
        _count: true,
        _sum: { grossAmount: true, feeTotal: true, units: true },
        _avg: { price: true, grossAmount: true },
      }),
      this.prisma.trade.aggregate({
        where: prevTradeWhere,
        _sum: { grossAmount: true },
        _count: true,
      }),
      this.prisma.trade.groupBy({
        by: ['sellerUserId'],
        where: tradeWhere,
      }),
      this.prisma.trade.groupBy({
        by: ['buyerUserId'],
        where: tradeWhere,
      }),
      this.prisma.auditLog.count({
        where: {
          action: 'trade.mark_suspicious',
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.marketListing.count({
        where: { ...listingActiveWhere, createdAt: { lt: staleBefore } },
      }),
      this.prisma.fee.aggregate({
        where: {
          feeCode: 'secondary_market_fee',
          createdAt: { gte: from, lte: to },
        },
        _sum: { amountCharged: true },
      }),
      this.prisma.fee.aggregate({
        where: {
          feeCode: 'secondary_market_fee',
          createdAt: { gte: previousFrom, lte: previousTo },
        },
        _sum: { amountCharged: true },
      }),
    ]);

    let unitsListed = 0;
    let listingsValue = 0;
    let listingAgeSum = 0;
    const now = Date.now();
    for (const row of activeRows) {
      const units = Number(row.unitsAvailable.toString());
      const price = Number(row.pricePerUnit.toString());
      unitsListed += units;
      listingsValue += units * price;
      listingAgeSum += now - row.createdAt.getTime();
    }
    const avgListingAgeDays =
      activeRows.length > 0
        ? Math.round(listingAgeSum / activeRows.length / (24 * 60 * 60 * 1000))
        : 0;

    const volume = Number(tradesAgg._sum.grossAmount ?? 0);
    const prevVolume = Number(prevTradesAgg._sum.grossAmount ?? 0);
    const fees = Number(feesAgg._sum.amountCharged ?? 0);
    const prevFees = Number(prevFeesAgg._sum.amountCharged ?? 0);
    const tradeCount = tradesAgg._count;
    const avgTradeSize = tradeCount > 0 ? volume / tradeCount : 0;

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      activeListings,
      unitsListed: Math.round(unitsListed),
      listingsValueUsdt: formatMoneyRu(listingsValue),
      avgListingAgeDays,
      staleListings,
      frozenListings,
      completedTrades: tradeCount,
      volumeUsdt: formatMoneyRu(volume),
      avgTradeSizeUsdt: formatMoneyRu(avgTradeSize),
      avgPricePerUnitUsdt: tradesAgg._avg.price
        ? formatMoneyRu(tradesAgg._avg.price.toString())
        : null,
      uniqueSellers: uniqueSellers.length,
      uniqueBuyers: uniqueBuyers.length,
      secondaryFeesUsdt: formatMoneyRu(fees),
      avgFeePerTradeUsdt:
        tradeCount > 0 ? formatMoneyRu(fees / tradeCount) : null,
      suspiciousTrades: suspiciousCount,
      listingsCreated: activeListings,
      tradesCompleted: tradeCount,
      feesUsdt: formatMoneyRu(Number(tradesAgg._sum.feeTotal ?? 0)),
      deltas: {
        volumePct: pctChange(volume, prevVolume),
        tradesPct: pctChange(tradeCount, prevTradesAgg._count),
        feesPct: pctChange(fees, prevFees),
      },
    };
  }

  async volume(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'market');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const releaseId = this.releaseIdFromQuery(query);

    const trades = await this.prisma.trade.findMany({
      where: this.settledTradeWhere(from, to, releaseId),
      select: {
        executedAt: true,
        grossAmount: true,
        units: true,
        buyerUserId: true,
        sellerUserId: true,
      },
    });

    const buckets = new Map<
      string,
      {
        volume: number;
        units: number;
        count: number;
        buyers: Set<string>;
        sellers: Set<string>;
      }
    >();
    for (const t of trades) {
      const key = t.executedAt.toISOString().slice(0, 10);
      const prev = buckets.get(key) ?? {
        volume: 0,
        units: 0,
        count: 0,
        buyers: new Set(),
        sellers: new Set(),
      };
      prev.volume += Number(t.grossAmount.toString());
      prev.units += Number(t.units.toString());
      prev.count += 1;
      prev.buyers.add(t.buyerUserId);
      prev.sellers.add(t.sellerUserId);
      buckets.set(key, prev);
    }

    return {
      items: [...buckets.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, v]) => ({
          period,
          volumeUsdt: formatMoneyRu(v.volume),
          units: v.units.toFixed(2),
          tradesCount: v.count,
          uniqueBuyers: v.buyers.size,
          uniqueSellers: v.sellers.size,
        })),
    };
  }

  async listings(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'market');
    const releaseId = this.releaseIdFromQuery(query);

    const byStatus = await this.prisma.marketListing.groupBy({
      by: ['status'],
      where: { deletedAt: null, ...(releaseId ? { releaseId } : {}) },
      _count: { id: true },
    });

    const byRelease = await this.prisma.marketListing.groupBy({
      by: ['releaseId'],
      where: {
        deletedAt: null,
        status: ListingStatus.ACTIVE,
        ...(releaseId ? { releaseId } : {}),
      },
      _count: { id: true },
      _sum: { unitsAvailable: true },
      orderBy: { _count: { id: 'desc' } },
      take: 15,
    });

    const releases = await this.prisma.release.findMany({
      where: { id: { in: byRelease.map((b) => b.releaseId) } },
      select: { id: true, title: true },
    });
    const titleMap = new Map(releases.map((r) => [r.id, r.title]));

    return {
      items: byStatus.map((s) => ({
        status: s.status.toLowerCase(),
        count: s._count.id,
      })),
      byTrack: byRelease.map((b) => ({
        trackId: b.releaseId,
        trackTitle: titleMap.get(b.releaseId) ?? '—',
        count: b._count.id,
        unitsListed: Number((b._sum.unitsAvailable ?? 0).toString()).toFixed(0),
      })),
    };
  }

  async trades(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'market');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const releaseId = this.releaseIdFromQuery(query);
    const suspiciousIds = await this.suspiciousTradeIds();

    const rows = await this.prisma.trade.findMany({
      where: {
        executedAt: { gte: from, lte: to },
        ...(releaseId ? { releaseId } : {}),
      },
      select: { id: true, executedAt: true, settlementStatus: true },
    });

    const completedBuckets = new Map<string, number>();
    const suspiciousBuckets = new Map<string, number>();
    let failed = 0;

    for (const t of rows) {
      const key = t.executedAt.toISOString().slice(0, 10);
      if (suspiciousIds.has(t.id)) {
        suspiciousBuckets.set(key, (suspiciousBuckets.get(key) ?? 0) + 1);
      } else if (t.settlementStatus === TradeSettlementStatus.SETTLED) {
        completedBuckets.set(key, (completedBuckets.get(key) ?? 0) + 1);
      } else if (t.settlementStatus === TradeSettlementStatus.FAILED) {
        failed += 1;
      }
    }

    const toSeries = (m: Map<string, number>) =>
      [...m.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, count]) => ({ period, count }));

    return {
      total: rows.length,
      failedCount: failed,
      completed: toSeries(completedBuckets),
      suspicious: toSeries(suspiciousBuckets),
      byDay: toSeries(completedBuckets),
    };
  }

  async topUsers(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'market');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const releaseId = this.releaseIdFromQuery(query);
    const limit = Math.min(query.limit ?? 10, 25);
    const tradeWhere = this.settledTradeWhere(from, to, releaseId);

    const [buyers, sellers, listingSellers] = await Promise.all([
      this.prisma.trade.groupBy({
        by: ['buyerUserId'],
        where: tradeWhere,
        _count: { id: true },
        _sum: { grossAmount: true, units: true },
        orderBy: { _sum: { grossAmount: 'desc' } },
        take: limit,
      }),
      this.prisma.trade.groupBy({
        by: ['sellerUserId'],
        where: tradeWhere,
        _count: { id: true },
        _sum: { grossAmount: true, units: true },
        orderBy: { _sum: { grossAmount: 'desc' } },
        take: limit,
      }),
      this.prisma.marketListing.groupBy({
        by: ['sellerUserId'],
        where: {
          deletedAt: null,
          status: ListingStatus.ACTIVE,
          ...(releaseId ? { releaseId } : {}),
        },
        _count: { id: true },
        _sum: { unitsAvailable: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
      }),
    ]);

    const userIds = [
      ...new Set([
        ...buyers.map((b) => b.buyerUserId),
        ...sellers.map((s) => s.sellerUserId),
        ...listingSellers.map((s) => s.sellerUserId),
      ]),
    ];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    const emailMap = new Map(users.map((u) => [u.id, u.email]));

    const mapParticipant = (
      userId: string,
      tradesCount: number,
      volume: unknown,
      units?: unknown,
      listingsCount?: number,
    ) => ({
      userId,
      email: emailMap.get(userId) ?? '—',
      tradesCount,
      listingsCount: listingsCount ?? 0,
      volumeUsdt: formatMoneyRu(volume ?? 0),
      units:
        units != null &&
        (typeof units === 'string' ||
          typeof units === 'number' ||
          typeof units === 'bigint')
          ? Number(units.toString()).toFixed(0)
          : '0',
      riskStatus: 'none',
    });

    return {
      buyers: buyers.map((b) =>
        mapParticipant(
          b.buyerUserId,
          b._count.id,
          b._sum.grossAmount,
          b._sum.units,
        ),
      ),
      sellers: sellers.map((s) =>
        mapParticipant(
          s.sellerUserId,
          s._count.id,
          s._sum.grossAmount,
          s._sum.units,
        ),
      ),
      listingSellers: listingSellers.map((s) =>
        mapParticipant(
          s.sellerUserId,
          0,
          0,
          s._sum.unitsAvailable,
          s._count.id,
        ),
      ),
    };
  }

  async fees(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'market');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const fees = await this.prisma.fee.findMany({
      where: {
        feeCode: 'secondary_market_fee',
        createdAt: { gte: from, lte: to },
      },
      select: { createdAt: true, amountCharged: true, subjectId: true },
    });

    const byDay = new Map<string, number>();
    const byRelease = new Map<string, number>();
    let total = 0;
    for (const f of fees) {
      total += Number(f.amountCharged.toString());
      const day = f.createdAt.toISOString().slice(0, 10);
      byDay.set(
        day,
        (byDay.get(day) ?? 0) + Number(f.amountCharged.toString()),
      );
      if (f.subjectId) {
        byRelease.set(
          f.subjectId,
          (byRelease.get(f.subjectId) ?? 0) +
            Number(f.amountCharged.toString()),
        );
      }
    }

    return {
      secondaryFeesUsdt: formatMoneyRu(total),
      items: [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, amount]) => ({
          period,
          amountUsdt: formatMoneyRu(amount),
        })),
      byRelease: [...byRelease.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([releaseId, amount]) => ({
          releaseId,
          feeUsdt: formatMoneyRu(amount),
        })),
    };
  }

  async depth(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'market');
    const releaseId = this.releaseIdFromQuery(query);

    if (!releaseId) {
      const top = await this.prisma.marketListing.groupBy({
        by: ['releaseId'],
        where: { deletedAt: null, status: ListingStatus.ACTIVE },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      });
      const releases = await this.prisma.release.findMany({
        where: { id: { in: top.map((t) => t.releaseId) } },
        select: { id: true, title: true },
      });
      const titleMap = new Map(releases.map((r) => [r.id, r.title]));
      return {
        releaseId: null,
        levels: [],
        topReleases: top.map((t) => ({
          releaseId: t.releaseId,
          releaseTitle: titleMap.get(t.releaseId) ?? '—',
          listingsCount: t._count.id,
        })),
        hint: 'Выберите релиз для просмотра стакана листингов.',
      };
    }

    const [listings, release] = await Promise.all([
      this.prisma.marketListing.findMany({
        where: { deletedAt: null, status: ListingStatus.ACTIVE, releaseId },
        select: { pricePerUnit: true, unitsAvailable: true },
        orderBy: { pricePerUnit: 'asc' },
      }),
      this.prisma.release.findUnique({
        where: { id: releaseId },
        select: { title: true, primaryUnitPrice: true },
      }),
    ]);

    const levelMap = new Map<
      string,
      { units: number; listings: number; value: number }
    >();
    for (const l of listings) {
      const priceKey = l.pricePerUnit.toString();
      const units = Number(l.unitsAvailable.toString());
      const price = Number(priceKey);
      const prev = levelMap.get(priceKey) ?? {
        units: 0,
        listings: 0,
        value: 0,
      };
      prev.units += units;
      prev.listings += 1;
      prev.value += units * price;
      levelMap.set(priceKey, prev);
    }

    const prices = [...levelMap.keys()].map(Number).sort((a, b) => a - b);
    const primary = Number(release?.primaryUnitPrice?.toString() ?? 0);
    const bestAsk = prices[0] ?? null;

    return {
      releaseId,
      releaseTitle: release?.title ?? '—',
      primaryPriceUsdt: primary > 0 ? formatMoneyRu(primary) : null,
      bestAskUsdt: bestAsk != null ? formatMoneyRu(bestAsk) : null,
      spreadPct:
        bestAsk != null && primary > 0
          ? Math.round(((bestAsk - primary) / primary) * 1000) / 10
          : null,
      levels: [...levelMap.entries()]
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([price, v]) => ({
          pricePerUnitUsdt: formatMoneyRu(price),
          totalUnits: v.units.toFixed(0),
          totalValueUsdt: formatMoneyRu(v.value),
          listingsCount: v.listings,
        })),
      topReleases: [],
      hint: 'Стакан показывает активные листинги на продажу. Листинг исполняется полностью.',
    };
  }

  async liquidity(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'market');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const releaseId = this.releaseIdFromQuery(query);
    const tradeWhere = this.settledTradeWhere(from, to, releaseId);
    const suspiciousIds = await this.suspiciousTradeIds();

    const [tradeByRelease, listingByRelease] = await Promise.all([
      this.prisma.trade.groupBy({
        by: ['releaseId'],
        where: tradeWhere,
        _count: { id: true },
        _sum: { grossAmount: true, units: true },
        _avg: { price: true },
        _max: { executedAt: true },
        orderBy: { _sum: { grossAmount: 'desc' } },
        take: 20,
      }),
      this.prisma.marketListing.groupBy({
        by: ['releaseId'],
        where: {
          deletedAt: null,
          status: ListingStatus.ACTIVE,
          ...(releaseId ? { releaseId } : {}),
        },
        _count: { id: true },
        _sum: { unitsAvailable: true },
      }),
    ]);

    const releaseIds = [
      ...new Set([
        ...tradeByRelease.map((t) => t.releaseId),
        ...listingByRelease.map((l) => l.releaseId),
      ]),
    ];
    const releases = await this.prisma.release.findMany({
      where: { id: { in: releaseIds } },
      include: { releaseArtists: { include: { artist: true }, take: 1 } },
    });
    const relMap = new Map(releases.map((r) => [r.id, r]));
    const listingMap = new Map(listingByRelease.map((l) => [l.releaseId, l]));

    const tradeSuspicious = await this.prisma.trade.findMany({
      where: {
        id: { in: [...suspiciousIds] },
        executedAt: { gte: from, lte: to },
      },
      select: { releaseId: true },
    });
    const suspByRelease = new Map<string, number>();
    for (const t of tradeSuspicious) {
      suspByRelease.set(t.releaseId, (suspByRelease.get(t.releaseId) ?? 0) + 1);
    }

    const items = releaseIds.map((id) => {
      const t = tradeByRelease.find((x) => x.releaseId === id);
      const l = listingMap.get(id);
      const rel = relMap.get(id);
      const vol = Number(t?._sum.grossAmount ?? 0);
      const trades = t?._count.id ?? 0;
      const listings = l?._count.id ?? 0;
      const score =
        trades * 3 + listings * 2 + Math.min(100, Math.round(vol / 1000));
      return {
        releaseId: id,
        releaseTitle: rel?.title ?? '—',
        artistName: rel?.releaseArtists[0]?.artist?.name ?? '—',
        activeListings: listings,
        unitsListed: Number((l?._sum.unitsAvailable ?? 0).toString()).toFixed(
          0,
        ),
        completedTrades: trades,
        tradeVolumeUsdt: formatMoneyRu(vol),
        avgPriceUsdt: t?._avg.price
          ? formatMoneyRu(t._avg.price.toString())
          : '—',
        lastTradeAt: t?._max.executedAt?.toISOString() ?? null,
        suspiciousCount: suspByRelease.get(id) ?? 0,
        liquidityScore: score,
        primaryPriceUsdt: rel?.primaryUnitPrice
          ? formatMoneyRu(rel.primaryUnitPrice.toString())
          : null,
      };
    });

    items.sort((a, b) => b.liquidityScore - a.liquidityScore);

    return { items };
  }

  async prices(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'market');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const releaseId = this.releaseIdFromQuery(query);
    const tradeWhere = this.settledTradeWhere(from, to, releaseId);

    const [listingAgg, tradeAgg, trades] = await Promise.all([
      this.prisma.marketListing.aggregate({
        where: {
          deletedAt: null,
          status: ListingStatus.ACTIVE,
          ...(releaseId ? { releaseId } : {}),
        },
        _avg: { pricePerUnit: true },
        _min: { pricePerUnit: true },
        _max: { pricePerUnit: true },
      }),
      this.prisma.trade.aggregate({
        where: tradeWhere,
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true },
      }),
      this.prisma.trade.findMany({
        where: tradeWhere,
        select: { releaseId: true, price: true, grossAmount: true },
        take: 500,
      }),
    ]);

    const avgTrade = Number(tradeAgg._avg.price ?? 0);
    const outliers = trades
      .filter((t) => {
        const p = Number(t.price.toString());
        return avgTrade > 0 && p > avgTrade * 1.5;
      })
      .slice(0, 10);

    const outReleaseIds = [...new Set(outliers.map((o) => o.releaseId))];
    const releases = await this.prisma.release.findMany({
      where: { id: { in: outReleaseIds } },
      select: { id: true, title: true, primaryUnitPrice: true },
    });
    const relMap = new Map(releases.map((r) => [r.id, r]));

    return {
      avgListingPriceUsdt: listingAgg._avg.pricePerUnit
        ? formatMoneyRu(listingAgg._avg.pricePerUnit.toString())
        : null,
      avgTradePriceUsdt: tradeAgg._avg.price
        ? formatMoneyRu(tradeAgg._avg.price.toString())
        : null,
      minTradePriceUsdt: tradeAgg._min.price
        ? formatMoneyRu(tradeAgg._min.price.toString())
        : null,
      maxTradePriceUsdt: tradeAgg._max.price
        ? formatMoneyRu(tradeAgg._max.price.toString())
        : null,
      outliers: outliers.map((o) => {
        const rel = relMap.get(o.releaseId);
        const primary = Number(rel?.primaryUnitPrice?.toString() ?? 0);
        const price = Number(o.price.toString());
        return {
          releaseId: o.releaseId,
          releaseTitle: rel?.title ?? '—',
          tradePriceUsdt: formatMoneyRu(price),
          primaryPriceUsdt: primary > 0 ? formatMoneyRu(primary) : null,
          premiumPct:
            primary > 0
              ? Math.round(((price - primary) / primary) * 1000) / 10
              : null,
        };
      }),
    };
  }

  async risk(roles: string[], query: AdminAnalyticsQueryDto) {
    assertAnalyticsArea(roles, 'market');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const limit = Math.min(query.limit ?? 15, 30);
    const suspiciousIds = await this.suspiciousTradeIds();

    const suspiciousList = [...suspiciousIds];
    const trades =
      suspiciousList.length === 0
        ? []
        : await this.prisma.trade.findMany({
            where: {
              id: { in: suspiciousList },
              executedAt: { gte: from, lte: to },
            },
            include: {
              buyer: { select: { id: true, email: true } },
              seller: { select: { id: true, email: true } },
              release: { select: { id: true, title: true } },
            },
            orderBy: { executedAt: 'desc' },
            take: limit,
          });

    const frozenListings = await this.prisma.marketListing.findMany({
      where: { deletedAt: null, status: ListingStatus.PAUSED },
      include: {
        release: { select: { title: true } },
        seller: { select: { email: true } },
      },
      take: limit,
    });

    return {
      suspiciousTrades: trades.map((t) => ({
        tradeId: t.id,
        releaseId: t.releaseId,
        releaseTitle: t.release.title,
        sellerEmail: t.seller.email,
        buyerEmail: t.buyer.email,
        grossAmountUsdt: formatMoneyRu(t.grossAmount.toString()),
        reason: 'marked_suspicious',
        status: 'suspicious',
        updatedAt: t.executedAt.toISOString(),
      })),
      frozenListings: frozenListings.map((l) => ({
        listingId: l.id,
        releaseTitle: l.release.title,
        sellerEmail: l.seller.email,
        status: 'frozen',
        units: l.unitsAvailable.toString(),
      })),
      washTradeSuspects: 0,
    };
  }
}
