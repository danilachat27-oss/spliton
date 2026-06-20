import { Injectable } from '@nestjs/common';
import { PayoutStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UserWalletService } from '../wallets/user-wallet.service';
import type { PortfolioPositionsQueryDto } from './dto/portfolio-positions-query.dto';
import { d, decToMoney } from './portfolio-decimal.util';
import { PortfolioPositionsService } from './portfolio-positions.service';
import type {
  PortfolioMetricsDto,
  PortfolioOverviewDto,
  PortfolioPositionDto,
  PortfolioPositionsPageDto,
  PortfolioStructureItemDto,
} from './types/portfolio-api.types';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly positionsService: PortfolioPositionsService,
    private readonly userWallet: UserWalletService,
  ) {}

  async getPayoutsOverview(userId: string) {
    const [payoutAgg, wallet, latestPaid] = await Promise.all([
      this.prisma.payout.groupBy({
        by: ['status'],
        where: { userId },
        _sum: { amountNet: true },
      }),
      this.userWallet.getSummary(userId),
      this.prisma.payout.findFirst({
        where: { userId, status: PayoutStatus.PAID },
        orderBy: { createdAt: 'desc' },
        select: {
          amountNet: true,
          createdAt: true,
          releaseId: true,
        },
      }),
    ]);

    let totalPaid = new Prisma.Decimal(0);
    let pendingPayout = new Prisma.Decimal(0);
    let totalAccrued = new Prisma.Decimal(0);

    for (const row of payoutAgg) {
      const sum = row._sum.amountNet ?? new Prisma.Decimal(0);
      totalAccrued = totalAccrued.plus(sum);
      if (row.status === PayoutStatus.PAID) {
        totalPaid = totalPaid.plus(sum);
      }
      if (
        row.status === PayoutStatus.PENDING ||
        row.status === PayoutStatus.ACCRUED
      ) {
        pendingPayout = pendingPayout.plus(sum);
      }
    }

    let latestPayout: {
      amountUsdt: string;
      paidAt: string;
      releaseTitle: string | null;
    } | null = null;

    if (latestPaid?.createdAt) {
      let releaseTitle: string | null = null;
      if (latestPaid.releaseId) {
        const release = await this.prisma.release.findUnique({
          where: { id: latestPaid.releaseId },
          select: { title: true },
        });
        releaseTitle = release?.title ?? null;
      }
      latestPayout = {
        amountUsdt: decToMoney(latestPaid.amountNet),
        paidAt: latestPaid.createdAt.toISOString(),
        releaseTitle,
      };
    }

    return {
      totalAccruedUsdt: decToMoney(totalAccrued),
      totalPaidUsdt: decToMoney(totalPaid),
      pendingPayoutUsdt: decToMoney(pendingPayout),
      availableBalance: wallet.availableBalance,
      lockedBalance: wallet.lockedBalance,
      pendingBalance: wallet.pendingBalance,
      withdrawnTotal: wallet.withdrawnTotal,
      earnedTotal: wallet.earnedTotal,
      pendingWithdrawalsCount: wallet.pendingWithdrawalsCount,
      minWithdrawalUsdt: wallet.minWithdrawalUsdt,
      withdrawalFeeUsdt: wallet.withdrawalFeeUsdt,
      withdrawalEnabled: wallet.withdrawalEnabled,
      asset: wallet.asset,
      network: wallet.network,
      latestPayout,
      nextExpectedPayout: null,
      updatedAt: wallet.updatedAt,
    };
  }

  async getOverview(userId: string): Promise<PortfolioOverviewDto> {
    const positions = await this.positionsService.loadPositions(userId);
    const payoutByRelease = await this.aggregatePayoutsByRelease(userId);
    const stripped = positions.map((p) =>
      this.stripLoadedPosition(this.enrichPositionPayouts(p, payoutByRelease)),
    );

    const totalValue = positions.reduce(
      (acc, p) => acc.plus(p._marketValue),
      new Prisma.Decimal(0),
    );
    const totalUnits = positions.reduce(
      (acc, p) => acc.plus(p._unitsTotal),
      new Prisma.Decimal(0),
    );
    const unrealizedPnl = positions.reduce(
      (acc, p) => acc.plus(p._pnl),
      new Prisma.Decimal(0),
    );
    const lockedUnits = positions.reduce(
      (acc, p) => acc.plus(d(p.unitsLocked)),
      new Prisma.Decimal(0),
    );
    const lockedValue = positions.reduce(
      (acc, p) => acc.plus(d(p.unitsLocked).mul(d(p.currentPrice))),
      new Prisma.Decimal(0),
    );

    const [payoutAgg, change30dPct] = await Promise.all([
      this.prisma.payout.groupBy({
        by: ['status'],
        where: { userId },
        _sum: { amountNet: true },
      }),
      this.computeChange30dPct(userId, positions, totalValue),
    ]);

    let expectedPayouts = new Prisma.Decimal(0);
    let realizedIncome = new Prisma.Decimal(0);
    for (const row of payoutAgg) {
      const sum = row._sum.amountNet ?? new Prisma.Decimal(0);
      if (
        row.status === PayoutStatus.PENDING ||
        row.status === PayoutStatus.ACCRUED
      ) {
        expectedPayouts = expectedPayouts.plus(sum);
      }
      if (row.status === PayoutStatus.PAID) {
        realizedIncome = realizedIncome.plus(sum);
      }
    }

    const activeReleases = new Set(
      positions
        .filter((p) => p.status === 'Active' || p.status === 'Secondary')
        .map((p) => p.releaseId),
    ).size;

    const openRoundCount = positions.filter(
      (p) => p.status === 'Open round',
    ).length;

    const genreStructure = this.buildGenreStructure(positions, totalValue);
    const statusStructure = this.buildStatusStructure(positions);

    const largestShare = positions[0]
      ? Number(positions[0].portfolioSharePct)
      : 0;

    return {
      totalValue: decToMoney(totalValue),
      totalUnits: totalUnits.toFixed(0),
      activeReleases,
      positionCount: positions.length,
      expectedPayouts: decToMoney(expectedPayouts),
      realizedIncome: decToMoney(realizedIncome),
      unrealizedPnl: decToMoney(unrealizedPnl),
      change30dPct,
      topPositions: stripped.slice(0, 5),
      riskSummary: {
        lockedUnits: lockedUnits.toFixed(0),
        lockedValue: decToMoney(lockedValue),
        liquidityLabel: lockedUnits.greaterThan(0)
          ? 'Часть units в листингах'
          : 'Свободный выход',
        openRoundCount,
      },
      stats: [
        { label: 'Активных релизов', value: String(activeReleases) },
        { label: 'Всего позиций', value: String(positions.length) },
        { label: 'Всего UNT', value: this.formatUnits(totalUnits) },
        {
          label: 'Крупнейшая позиция',
          value: positions.length ? `${largestShare}%` : '0%',
        },
      ],
      genreStructure,
      statusStructure,
      updatedAt: new Date().toISOString(),
    };
  }

  async getPositions(
    userId: string,
    query: PortfolioPositionsQueryDto = {},
  ): Promise<PortfolioPositionsPageDto> {
    const payoutByRelease = await this.aggregatePayoutsByRelease(userId);
    const page = await this.positionsService.queryPositionsPage(
      userId,
      query,
      payoutByRelease,
    );
    return {
      items: page.items.map((p) =>
        this.stripLoadedPosition(
          this.enrichPositionPayouts(p, payoutByRelease),
        ),
      ),
      total: page.total,
      page: page.page,
      limit: page.limit,
    };
  }

  async getMetrics(userId: string): Promise<PortfolioMetricsDto> {
    const positions = await this.positionsService.loadPositions(userId);
    const totalValue = positions.reduce(
      (acc, p) => acc.plus(p._marketValue),
      new Prisma.Decimal(0),
    );
    const totalUnits = positions.reduce(
      (acc, p) => acc.plus(p._unitsTotal),
      new Prisma.Decimal(0),
    );
    const unrealizedPnl = positions.reduce(
      (acc, p) => acc.plus(p._pnl),
      new Prisma.Decimal(0),
    );

    const [payoutAgg, change30dPct, valueHistory, incomeByPeriod] =
      await Promise.all([
        this.prisma.payout.groupBy({
          by: ['status'],
          where: { userId },
          _sum: { amountNet: true },
        }),
        this.computeChange30dPct(userId, positions, totalValue),
        this.buildValueHistory(userId, positions),
        this.buildIncomeByPeriod(userId),
      ]);

    let totalPaid = new Prisma.Decimal(0);
    let totalAccrued = new Prisma.Decimal(0);
    let pendingPayouts = new Prisma.Decimal(0);
    for (const row of payoutAgg) {
      const sum = row._sum.amountNet ?? new Prisma.Decimal(0);
      if (row.status === PayoutStatus.PAID) totalPaid = totalPaid.plus(sum);
      if (
        row.status === PayoutStatus.ACCRUED ||
        row.status === PayoutStatus.PENDING
      ) {
        totalAccrued = totalAccrued.plus(sum);
        if (row.status === PayoutStatus.PENDING) {
          pendingPayouts = pendingPayouts.plus(sum);
        }
      }
    }

    const activeReleases = new Set(
      positions
        .filter((p) => p.status === 'Active' || p.status === 'Secondary')
        .map((p) => p.releaseId),
    ).size;

    const genreAllocation = this.buildGenreStructure(positions, totalValue);
    const statusAllocation = this.buildStatusStructure(positions);
    const averagePositionSizeUsdt = positions.length
      ? decToMoney(totalValue.div(positions.length))
      : null;

    const overview = {
      portfolioValueUsdt: decToMoney(totalValue),
      totalUnits: totalUnits.toFixed(0),
      activePositions: positions.length,
      activeReleases,
      totalAccruedUsdt: decToMoney(totalAccrued),
      totalPaidUsdt: decToMoney(totalPaid),
      pendingPayoutUsdt: decToMoney(pendingPayouts),
      unrealizedPnlUsdt: decToMoney(unrealizedPnl),
      change30dPct,
      averagePositionSizeUsdt,
    };

    const changeHint =
      change30dPct != null ? `${change30dPct} за 30д` : 'Недостаточно данных';

    return {
      overview,
      topStats: [
        {
          label: 'Стоимость портфеля',
          value: positions.length ? `$${decToMoney(totalValue)}` : '—',
          hint: positions.length
            ? `${positions.length} позиций`
            : 'Появится после первой покупки',
        },
        {
          label: 'Изменение за 30 дней',
          value: change30dPct != null ? `${change30dPct}%` : '—',
          hint: changeHint,
        },
        {
          label: 'Выплачено',
          value: totalPaid.greaterThan(0) ? `$${decToMoney(totalPaid)}` : '—',
          hint: totalPaid.greaterThan(0)
            ? 'реализованный доход'
            : 'Появится после первого периода выплат',
        },
      ],
      genreAllocation,
      statusAllocation,
      incomeByPeriod,
      valueHistory,
      performance: {
        pnl30dPct: change30dPct,
        portfolioValue: decToMoney(totalValue),
        realizedIncome: decToMoney(totalPaid),
        unrealizedPnl: decToMoney(unrealizedPnl),
        pendingPayouts: decToMoney(pendingPayouts),
        totalAccrued: decToMoney(totalAccrued),
      },
      productPnl: genreAllocation.slice(0, 5).map((g) => ({
        label: g.label,
        value: g.value,
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  private stripLoadedPosition(
    p: Awaited<ReturnType<PortfolioPositionsService['loadPositions']>>[number],
  ): PortfolioPositionDto {
    const {
      _unitsTotal,
      _marketValue,
      _pnl,
      _liquidityPercent,
      _payoutTotal,
      ...rest
    } = p;
    void _unitsTotal;
    void _marketValue;
    void _pnl;
    void _liquidityPercent;
    void _payoutTotal;
    return rest;
  }

  private async aggregatePayoutsByRelease(userId: string) {
    const rows = await this.prisma.payout.groupBy({
      by: ['releaseId', 'status'],
      where: { userId },
      _sum: { amountNet: true },
    });
    const map = new Map<
      string,
      { accrued: Prisma.Decimal; paid: Prisma.Decimal; pending: Prisma.Decimal }
    >();
    for (const row of rows) {
      const current = map.get(row.releaseId) ?? {
        accrued: new Prisma.Decimal(0),
        paid: new Prisma.Decimal(0),
        pending: new Prisma.Decimal(0),
      };
      const sum = row._sum.amountNet ?? new Prisma.Decimal(0);
      if (row.status === PayoutStatus.PAID) current.paid = current.paid.plus(sum);
      if (row.status === PayoutStatus.ACCRUED) {
        current.accrued = current.accrued.plus(sum);
      }
      if (row.status === PayoutStatus.PENDING) {
        current.pending = current.pending.plus(sum);
        current.accrued = current.accrued.plus(sum);
      }
      map.set(row.releaseId, current);
    }
    return map;
  }

  private enrichPositionPayouts(
    position: Awaited<ReturnType<PortfolioPositionsService['loadPositions']>>[number],
    payoutByRelease: Awaited<ReturnType<PortfolioService['aggregatePayoutsByRelease']>>,
  ) {
    const payout = payoutByRelease.get(position.releaseId);
    const accrued = payout?.accrued ?? new Prisma.Decimal(0);
    return {
      ...position,
      totalAccruedUsdt: decToMoney(accrued),
      totalPaidUsdt: decToMoney(payout?.paid ?? new Prisma.Decimal(0)),
      pendingPayoutUsdt: decToMoney(payout?.pending ?? new Prisma.Decimal(0)),
      _payoutTotal: accrued,
    };
  }

  private buildGenreStructure(
    positions: Awaited<ReturnType<PortfolioPositionsService['loadPositions']>>,
    totalValue: Prisma.Decimal,
  ): PortfolioStructureItemDto[] {
    const byGenre = new Map<string, Prisma.Decimal>();
    for (const p of positions) {
      const genre = p.genre || 'Other';
      byGenre.set(
        genre,
        (byGenre.get(genre) ?? new Prisma.Decimal(0)).plus(p._marketValue),
      );
    }
    return [...byGenre.entries()]
      .map(([label, value]) => {
        const pct = totalValue.greaterThan(0)
          ? value.div(totalValue).mul(100)
          : new Prisma.Decimal(0);
        return {
          label,
          value: `${pct.toFixed(0)}%`,
          percent: Number(pct.toFixed(0)),
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }

  private buildStatusStructure(
    positions: Awaited<ReturnType<PortfolioPositionsService['loadPositions']>>,
  ): PortfolioStructureItemDto[] {
    const byStatus = new Map<string, number>();
    for (const p of positions) {
      byStatus.set(p.status, (byStatus.get(p.status) ?? 0) + 1);
    }
    const total = positions.length || 1;
    return [...byStatus.entries()]
      .map(([label, count]) => {
        const percent = Math.round((count / total) * 100);
        return {
          label,
          value: `${count} ${count === 1 ? 'release' : 'releases'}`,
          percent,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }

  private formatUnits(value: Prisma.Decimal): string {
    const n = Number(value.toFixed(0));
    return new Intl.NumberFormat('ru-RU').format(n);
  }

  private async computeChange30dPct(
    userId: string,
    positions: Awaited<ReturnType<PortfolioPositionsService['loadPositions']>>,
    currentValue: Prisma.Decimal,
  ): Promise<string | null> {
    if (positions.length === 0 || !currentValue.greaterThan(0)) return null;

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const releaseIds = positions.map((p) => p.releaseId);
    const history = await this.prisma.priceHistory.findMany({
      where: {
        releaseId: { in: releaseIds },
        bucket: 'D1',
        ts: { gte: since },
      },
      orderBy: { ts: 'asc' },
    });

    const firstCloseByRelease = new Map<string, Prisma.Decimal>();
    for (const row of history) {
      if (!firstCloseByRelease.has(row.releaseId)) {
        firstCloseByRelease.set(row.releaseId, row.closePrice);
      }
    }

    let pastValue = new Prisma.Decimal(0);
    for (const p of positions) {
      const pastPrice =
        firstCloseByRelease.get(p.releaseId) ?? d(p.avgEntryPrice);
      pastValue = pastValue.plus(p._unitsTotal.mul(pastPrice));
    }

    if (!pastValue.greaterThan(0)) return null;
    const change = currentValue.minus(pastValue).div(pastValue).mul(100);
    const sign = change.greaterThanOrEqualTo(0) ? '+' : '';
    return `${sign}${change.toFixed(1)}`;
  }

  private async buildValueHistory(
    userId: string,
    positions: Awaited<ReturnType<PortfolioPositionsService['loadPositions']>>,
  ): Promise<{ ts: string; value: string }[]> {
    void userId;
    if (positions.length === 0) return [];

    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const releaseIds = positions.map((p) => p.releaseId);
    const history = await this.prisma.priceHistory.findMany({
      where: {
        releaseId: { in: releaseIds },
        bucket: 'D1',
        ts: { gte: since },
      },
      orderBy: { ts: 'asc' },
    });

    const pricesByTs = new Map<string, Map<string, Prisma.Decimal>>();
    for (const row of history) {
      const key = row.ts.toISOString().slice(0, 10);
      let inner = pricesByTs.get(key);
      if (!inner) {
        inner = new Map();
        pricesByTs.set(key, inner);
      }
      inner.set(row.releaseId, row.closePrice);
    }

    const unitsByRelease = new Map(
      positions.map((p) => [p.releaseId, p._unitsTotal] as const),
    );

    const points: { ts: string; value: string }[] = [];
    for (const [day, prices] of [...pricesByTs.entries()].sort()) {
      let value = new Prisma.Decimal(0);
      for (const [releaseId, units] of unitsByRelease) {
        const price = prices.get(releaseId);
        if (price) value = value.plus(units.mul(price));
      }
      if (value.greaterThan(0)) {
        points.push({ ts: day, value: decToMoney(value) });
      }
    }

    if (points.length === 0) {
      return [];
    }

    return points;
  }

  private async buildIncomeByPeriod(
    userId: string,
  ): Promise<{ period: string; amount: string }[]> {
    const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const payouts = await this.prisma.payout.findMany({
      where: {
        userId,
        status: PayoutStatus.PAID,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
    });

    const byMonth = new Map<string, Prisma.Decimal>();
    for (const p of payouts) {
      const key = `${p.createdAt.getUTCFullYear()}-${String(p.createdAt.getUTCMonth() + 1).padStart(2, '0')}`;
      byMonth.set(
        key,
        (byMonth.get(key) ?? new Prisma.Decimal(0)).plus(p.amountNet),
      );
    }

    return [...byMonth.entries()].map(([period, amount]) => ({
      period,
      amount: decToMoney(amount),
    }));
  }
}
