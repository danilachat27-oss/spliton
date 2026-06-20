import { Injectable } from '@nestjs/common';
import { Prisma, TradeSettlementStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SecondaryMarketEnrichmentService } from '../market/secondary-market-enrichment.service';
import { d } from './portfolio-decimal.util';

export type ReleaseMarkPrice = {
  currentPrice: Prisma.Decimal;
  priceSource: 'best_ask' | 'last_trade' | 'primary';
  lastTradePrice: Prisma.Decimal | null;
};

@Injectable()
export class PortfolioPricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichment: SecondaryMarketEnrichmentService,
  ) {}

  async resolveMarkPrices(
    releases: { id: string; primaryUnitPrice: Prisma.Decimal }[],
  ): Promise<Map<string, ReleaseMarkPrice>> {
    const map = new Map<string, ReleaseMarkPrice>();
    if (releases.length === 0) return map;

    const ids = releases.map((r) => r.id);
    const primaryById = new Map(
      releases.map((r) => [r.id, r.primaryUnitPrice] as const),
    );

    const [contextByRelease, lastTrades] = await Promise.all([
      this.enrichment.loadByReleaseIds(ids),
      this.prisma.trade.findMany({
        where: {
          releaseId: { in: ids },
          settlementStatus: TradeSettlementStatus.SETTLED,
        },
        orderBy: { executedAt: 'desc' },
        distinct: ['releaseId'],
        select: {
          releaseId: true,
          price: true,
        },
      }),
    ]);

    const lastTradeByRelease = new Map(
      lastTrades.map((t) => [t.releaseId, t.price]),
    );

    for (const releaseId of ids) {
      const primary = primaryById.get(releaseId) ?? new Prisma.Decimal(0);
      const ctx = contextByRelease.get(releaseId);
      const bestAsk = ctx?.bestAsk ? d(ctx.bestAsk) : null;
      const last = lastTradeByRelease.get(releaseId) ?? null;
      if (bestAsk && bestAsk.greaterThan(0)) {
        map.set(releaseId, {
          currentPrice: bestAsk,
          priceSource: 'best_ask',
          lastTradePrice: last,
        });
        continue;
      }
      if (last && last.greaterThan(0)) {
        map.set(releaseId, {
          currentPrice: last,
          priceSource: 'last_trade',
          lastTradePrice: last,
        });
        continue;
      }
      map.set(releaseId, {
        currentPrice: primary,
        priceSource: 'primary',
        lastTradePrice: null,
      });
    }

    return map;
  }
}
