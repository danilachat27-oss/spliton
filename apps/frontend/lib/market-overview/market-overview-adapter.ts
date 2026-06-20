import { buildReleaseMarketAnalyticsPageData } from "@/mocks/catalog/release-market-analytics.mock";
import type { MarketOverviewListQueryParams } from "@/lib/market-overview/market-overview-api-query";
import { buildMarketOverviewListQuery } from "@/lib/market-overview/market-overview-api-query";
import type {
  MarketOverviewDetailApi,
  MarketOverviewListItemApi,
} from "@/services/market-overview.service";
import type { ReleaseMarketAnalyticsPageData } from "@/types/catalog/release-market-analytics";
import type {
  MarketOverviewCategory,
  MarketOverviewRow,
} from "@/types/market-overview";

function mapLiquidityLabelFromApi(raw: string): MarketOverviewRow["liquidityLabel"] {
  const v = raw.trim();
  if (v === "Высокая" || v === "Deep" || v.toLowerCase() === "high") return "Высокая";
  if (v === "Средняя" || v === "Mid" || v.toLowerCase() === "med") return "Средняя";
  if (v === "Низкая" || v === "Thin" || v.toLowerCase() === "low") return "Низкая";
  return "Низкая";
}

function volume24hNumber(item: MarketOverviewListItemApi): number {
  const raw = item.volume24hUsdt;
  if (typeof raw === "string") return Number.parseFloat(raw) || 0;
  if (raw && typeof raw === "object" && "toString" in raw) {
    return Number.parseFloat(String(raw)) || 0;
  }
  return Number(raw) || 0;
}

export function adaptMarketOverviewRow(item: MarketOverviewListItemApi): MarketOverviewRow {
  return {
    id: item.id,
    symbol: item.symbol,
    title: item.title,
    artist: item.artist,
    segment: item.segment || item.genre,
    yieldPct: item.yieldPct,
    payoutsUsdt: item.payoutsUsdt,
    activityScore: item.activityScore,
    availableUnits: Number.parseFloat(item.availableUnits) || 0,
    primaryUnitPriceUsdt: Number.parseFloat(item.primaryUnitPriceUsdt) || 0,
    secondaryLabel: (item.secondaryLabel as MarketOverviewRow["secondaryLabel"]) || "—",
    liquidityLabel: mapLiquidityLabelFromApi(item.liquidityLabel),
    trend: item.trend,
    sparkline: item.sparkline.length > 0 ? item.sparkline : [item.primaryUnitPriceUsdt ? Number(item.primaryUnitPriceUsdt) : 1],
    status: item.status as MarketOverviewRow["status"],
    payoutFreq: item.payoutFreq,
    categories: item.categories.filter((c): c is MarketOverviewCategory =>
      [
        "all",
        "new",
        "yield",
        "stable",
        "demand",
        "secondary",
        "premium",
        "archive",
      ].includes(c),
    ),
  };
}

export function buildReleaseMarketAnalyticsFromOverviewDetail(
  detail: MarketOverviewDetailApi,
): ReleaseMarketAnalyticsPageData {
  const row = adaptMarketOverviewRow(detail.overview);
  const base = buildReleaseMarketAnalyticsPageData(row);
  const closes = detail.priceHistory.points.map((p) => Number.parseFloat(p.close));
  const payoutSeries = detail.volumeHistory.points.map((p) => Number.parseFloat(p.volumeUsdt));

  return {
    ...base,
    header: {
      ...base.header,
      catalogReleaseId: detail.release.id,
      releaseTitle: detail.release.title,
      artist: detail.release.artist,
      symbol: detail.release.symbol,
      genre: detail.release.genre,
    },
    hero: {
      ...base.hero,
      secondary: {
        value: `${detail.market.volume24hUsdt} USDT`,
        vsPrevious: `${detail.market.change7dPct}%`,
        vsTone:
          Number(detail.market.change7dPct) > 0
            ? "positive"
            : Number(detail.market.change7dPct) < 0
              ? "negative"
              : "neutral",
      },
      trend7d: {
        value: `${detail.market.change7dPct}%`,
        vsPrevious: "7D",
        vsTone:
          Number(detail.market.change7dPct) > 0
            ? "positive"
            : Number(detail.market.change7dPct) < 0
              ? "negative"
              : "neutral",
      },
    },
    charts: base.charts.map((chart, idx) => {
      if (idx === 0 && closes.length > 0) {
        return { ...chart, series: closes.slice(-24) };
      }
      if (idx === 1 && payoutSeries.length > 0) {
        return { ...chart, series: payoutSeries.slice(-24) };
      }
      return chart;
    }),
    liquidity: {
      ...base.liquidity,
      volume24h: {
        value: `${detail.market.volume24hUsdt} USDT`,
        hint: "Оборот 24ч",
      },
      spread: {
        value: detail.market.spread ? `${detail.market.spread} USDT` : "—",
        hint: "Спред bid/ask",
      },
      listings: {
        hasActive: detail.market.activeListings > 0,
        summary: `${detail.market.activeListings} активных лотов`,
      },
    },
    riskNotes: detail.riskNotes,
  };
}

export function marketOverviewQueryFromState(
  input: MarketOverviewListQueryParams & {
    categoryTab?: string;
    filters?: Record<string, string>;
  },
): MarketOverviewListQueryParams {
  const filters = input.filters;
  return buildMarketOverviewListQuery({
    period: input.period,
    search: input.search,
    category: input.category ?? (input.categoryTab as MarketOverviewListQueryParams["category"]),
    genre: input.genre ?? filters?.genre,
    status: input.status ?? filters?.status,
    payoutFreq: input.payoutFreq ?? filters?.payoutFreq,
    liquidity: input.liquidity ?? filters?.liquidity,
    yield: input.yield ?? filters?.yield,
    availability: input.availability ?? filters?.availability,
    sort: input.sort,
    sortDir: input.sortDir,
    page: input.page,
    pageSize: input.pageSize,
  });
}
