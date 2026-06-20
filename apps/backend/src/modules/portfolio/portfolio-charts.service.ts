import { Injectable } from '@nestjs/common';
import {
  PayoutStatus,
  Prisma,
  PriceBucket,
  WalletTxStatus,
  WalletTxType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildChartResponse,
  isChartPeriod,
  periodSince,
  resolveChartBucket,
  type ChartPeriod,
  type ChartSeriesPoint,
} from '../../common/charts/chart-period.util';
import { PortfolioPositionsService } from './portfolio-positions.service';
import { decToMoney } from './portfolio-decimal.util';

@Injectable()
export class PortfolioChartsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly positionsService: PortfolioPositionsService,
  ) {}

  private normalizePeriod(period?: string): ChartPeriod {
    const p = period ?? '30d';
    if (!isChartPeriod(p)) return '30d';
    return p;
  }

  async getValueChart(userId: string, periodRaw?: string) {
    const period = this.normalizePeriod(periodRaw);
    const bucket = resolveChartBucket(period);
    const since = periodSince(period);
    const positions = await this.positionsService.loadPositions(userId);

    if (positions.length === 0) {
      return buildChartResponse({
        period,
        bucket,
        points: [],
        summary: { portfolioValue: '0' },
        source: 'price_history',
        emptyReason: 'NO_POSITIONS',
      });
    }

    const releaseIds = positions.map((p) => p.releaseId);
    const history = await this.prisma.priceHistory.findMany({
      where: {
        releaseId: { in: releaseIds },
        bucket: PriceBucket.D1,
        ...(since ? { ts: { gte: since } } : {}),
      },
      orderBy: { ts: 'asc' },
      take: 500,
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

    const points: ChartSeriesPoint[] = [];
    for (const [day, prices] of [...pricesByTs.entries()].sort()) {
      let value = new Prisma.Decimal(0);
      for (const [releaseId, units] of unitsByRelease) {
        const price = prices.get(releaseId);
        if (price) value = value.plus(units.mul(price));
      }
      if (value.greaterThan(0)) {
        points.push({
          timestamp: `${day}T00:00:00.000Z`,
          value: Number(value),
        });
      }
    }

    const totalNow = positions.reduce(
      (acc, p) => acc.plus(p._marketValue),
      new Prisma.Decimal(0),
    );

    return buildChartResponse({
      period,
      bucket,
      points,
      summary: { portfolioValue: decToMoney(totalNow), positionCount: positions.length },
      source: 'price_history',
      emptyReason: points.length ? undefined : 'NO_VALUE_HISTORY',
    });
  }

  async getPayoutsChart(userId: string, periodRaw?: string) {
    const period = this.normalizePeriod(periodRaw);
    const bucket = resolveChartBucket(period);
    const since = periodSince(period);

    const payouts = await this.prisma.payout.findMany({
      where: {
        userId,
        status: PayoutStatus.PAID,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });

    const byMonth = new Map<string, Prisma.Decimal>();
    for (const p of payouts) {
      const key = p.createdAt.toISOString().slice(0, 7);
      byMonth.set(
        key,
        (byMonth.get(key) ?? new Prisma.Decimal(0)).plus(p.amountNet),
      );
    }

    const points: ChartSeriesPoint[] = [...byMonth.entries()].map(
      ([month, amount]) => ({
        timestamp: `${month}-01T00:00:00.000Z`,
        value: Number(amount),
      }),
    );

    return buildChartResponse({
      period,
      bucket,
      points,
      summary: {
        totalPaid: decToMoney(
          payouts.reduce(
            (s, p) => s.plus(p.amountNet),
            new Prisma.Decimal(0),
          ),
        ),
      },
      source: 'aggregated',
      emptyReason: points.length ? undefined : 'NO_PAYOUTS',
    });
  }

  private periodWindowMs(period: ChartPeriod): number | null {
    const since = periodSince(period);
    if (!since) return null;
    return Date.now() - since.getTime();
  }

  private panTitleKey(
    side: 'previous' | 'current',
    window: ChartPeriod,
  ): string {
    const suffix =
      window === '7d' ? '7d' : window === '90d' ? '90d' : '30d';
    return side === 'previous' ? `previous_${suffix}` : `current_${suffix}`;
  }

  private async sumPaidPayouts(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<Prisma.Decimal> {
    const agg = await this.prisma.payout.aggregate({
      where: {
        userId,
        status: PayoutStatus.PAID,
        createdAt: { gte: from, lt: to },
      },
      _sum: { amountNet: true },
    });
    return agg._sum.amountNet ?? new Prisma.Decimal(0);
  }

  private async sumCompletedWithdrawals(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<Prisma.Decimal> {
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) return new Prisma.Decimal(0);

    const agg = await this.prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        txType: WalletTxType.WITHDRAWAL,
        status: WalletTxStatus.COMPLETED,
        happenedAt: { gte: from, lt: to },
      },
      _sum: { amount: true },
    });
    return agg._sum.amount ?? new Prisma.Decimal(0);
  }

  async getPayoutsCompare(userId: string, windowRaw?: string) {
    const allowed = ['7d', '30d', '90d'] as const;
    type CompareWindow = (typeof allowed)[number];
    const window: CompareWindow = allowed.includes(windowRaw as CompareWindow)
      ? (windowRaw as CompareWindow)
      : '30d';

    const ms = this.periodWindowMs(window);
    if (ms == null) {
      return {
        window,
        asset: 'USDT · TRC20',
        left: null,
        right: null,
        deltaAccrualsPct: null,
        emptyReason: 'INSUFFICIENT_DATA',
        updatedAt: new Date().toISOString(),
      };
    }

    const now = new Date();
    const currentStart = periodSince(window)!;
    const previousStart = new Date(currentStart.getTime() - ms);

    const [leftAccruals, rightAccruals, leftWithdrawals, rightWithdrawals] =
      await Promise.all([
        this.sumPaidPayouts(userId, previousStart, currentStart),
        this.sumPaidPayouts(userId, currentStart, now),
        this.sumCompletedWithdrawals(userId, previousStart, currentStart),
        this.sumCompletedWithdrawals(userId, currentStart, now),
      ]);

    const leftAccNum = Number(leftAccruals);
    const rightAccNum = Number(rightAccruals);
    const hasData =
      leftAccNum > 0 ||
      rightAccNum > 0 ||
      Number(leftWithdrawals) > 0 ||
      Number(rightWithdrawals) > 0;

    const deltaAccrualsPct =
      leftAccNum > 0 ? ((rightAccNum - leftAccNum) / leftAccNum) * 100 : null;

    return {
      window,
      asset: 'USDT · TRC20',
      left: {
        titleKey: this.panTitleKey('previous', window),
        from: previousStart.toISOString(),
        to: currentStart.toISOString(),
        accrualsUsdt: decToMoney(leftAccruals),
        withdrawalsUsdt: decToMoney(leftWithdrawals),
      },
      right: {
        titleKey: this.panTitleKey('current', window),
        from: currentStart.toISOString(),
        to: now.toISOString(),
        accrualsUsdt: decToMoney(rightAccruals),
        withdrawalsUsdt: decToMoney(rightWithdrawals),
      },
      deltaAccrualsPct,
      emptyReason: hasData ? undefined : 'INSUFFICIENT_DATA',
      updatedAt: now.toISOString(),
    };
  }

  async getAllocation(userId: string) {
    const positions = await this.positionsService.loadPositions(userId);
    const total = positions.reduce(
      (acc, p) => acc.plus(p._marketValue),
      new Prisma.Decimal(0),
    );

    const byGenre = new Map<string, Prisma.Decimal>();
    for (const p of positions) {
      const g = p.genre || 'Other';
      byGenre.set(g, (byGenre.get(g) ?? new Prisma.Decimal(0)).plus(p._marketValue));
    }

    return {
      lastUpdatedAt: new Date().toISOString(),
      totalValue: decToMoney(total),
      byGenre: [...byGenre.entries()].map(([label, value]) => ({
        label,
        value: decToMoney(value),
        percent: total.greaterThan(0)
          ? Number(value.div(total).mul(100).toFixed(1))
          : 0,
      })),
      emptyReason: positions.length === 0 ? 'NO_POSITIONS' : undefined,
    };
  }
}
