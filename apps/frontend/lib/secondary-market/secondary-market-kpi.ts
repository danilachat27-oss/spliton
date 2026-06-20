import type { MarketOverviewChartsApi, MarketOverviewStatsApi } from "@/services/market-overview.service";
import { listingEffectiveStatus } from "@/lib/secondary-market/listing-availability.util";

export const SECONDARY_MARKET_DEMO_KPI = {
  volume24h: "184 200",
  activeLots: "48",
  liquidPct: "64%",
  sparkline: [0.4, 0.42, 0.41, 0.45, 0.44, 0.48, 0.52, 0.51, 0.55, 0.58],
} as const;

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export type SecondaryMarketKpiListing = { liquidity: string; status?: string };

export type SecondaryMarketKpiDisplay = {
  isLive: boolean;
  showDemoLabel: boolean;
  volume24h: string;
  activeLots: string;
  liquidPct: string;
  sparklineValues: number[];
  sparklinePositive: boolean;
  usesHardcodedDemo: boolean;
};

export function mapSecondaryMarketKpi(input: {
  isLive: boolean;
  loading: boolean;
  stats: MarketOverviewStatsApi | null;
  charts: MarketOverviewChartsApi | null;
  listingsSource: SecondaryMarketKpiListing[];
}): SecondaryMarketKpiDisplay {
  const { isLive, loading, stats, charts, listingsSource } = input;

  const liveVolume24hRaw =
    stats?.secondaryMarket.volume24hUsdt ?? stats?.totals.totalVolume24hUsdt;
  const liveVolume24h =
    liveVolume24hRaw != null ? formatUsdt(Number.parseFloat(String(liveVolume24hRaw)) || 0) : "—";
  const liveActiveLots = stats ? String(stats.secondaryMarket.activeListings) : "—";
  const liquidTotal = listingsSource.length;
  const liquidHigh = listingsSource.filter((l) => l.liquidity === "high").length;
  const liveLiquidPct = liquidTotal > 0 ? `${Math.round((liquidHigh / liquidTotal) * 100)}%` : "—";
  const liveSparkline = (charts?.series.secondaryVolume ?? [])
    .map((p) => Number(p.value))
    .filter((n) => Number.isFinite(n));
  const sparklinePositive =
    liveSparkline.length >= 2 ? liveSparkline[liveSparkline.length - 1]! >= liveSparkline[0]! : true;

  if (!isLive) {
    const demoActiveLots = String(
      listingsSource.filter((l) => listingEffectiveStatus(l) === "active").length,
    );
    return {
      isLive: false,
      showDemoLabel: true,
      volume24h: SECONDARY_MARKET_DEMO_KPI.volume24h,
      activeLots: demoActiveLots,
      liquidPct: SECONDARY_MARKET_DEMO_KPI.liquidPct,
      sparklineValues: [...SECONDARY_MARKET_DEMO_KPI.sparkline],
      sparklinePositive: true,
      usesHardcodedDemo: true,
    };
  }

  return {
    isLive: true,
    showDemoLabel: false,
    volume24h: loading ? "…" : liveVolume24h,
    activeLots: loading ? "…" : liveActiveLots,
    liquidPct: loading ? "…" : liveLiquidPct,
    sparklineValues: loading ? [] : liveSparkline,
    sparklinePositive,
    usesHardcodedDemo: false,
  };
}
