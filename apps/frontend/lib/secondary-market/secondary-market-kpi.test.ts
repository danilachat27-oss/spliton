import { describe, expect, it } from "vitest";

import type {
  MarketOverviewChartsApi,
  MarketOverviewStatsApi,
} from "@/services/market-overview.service";

import {
  mapSecondaryMarketKpi,
  SECONDARY_MARKET_DEMO_KPI,
} from "./secondary-market-kpi";

const liveStats = {
  updatedAt: "2026-01-01T00:00:00Z",
  period: "7d",
  totals: {
    publicReleases: 10,
    activePrimaryRounds: 5,
    activeSecondaryListings: 12,
    totalRaisedUsdt: "100000",
    totalVolumeUsdt: "50000",
    totalVolume24hUsdt: "12345.67",
    totalVolume7dUsdt: "40000",
    totalVolume30dUsdt: "50000",
    averageExpectedYieldPct: 8,
    averageLiquidityScore: 50,
    tradesCount: 100,
    holdersCount: 200,
  },
  primaryMarket: {
    activeRounds: 5,
    raisedUsdt: "100000",
    availableUnits: "5000",
    averageProgressPct: 60,
  },
  secondaryMarket: {
    activeListings: 17,
    volumeUsdt: "30000",
    volume24hUsdt: "9876.5",
    volume7dUsdt: "20000",
    volume30dUsdt: "30000",
    tradesCount: 50,
    bestAskMin: "10",
    bestAskMax: "20",
    averageSpreadPct: 2,
  },
} as unknown as MarketOverviewStatsApi;

const liveCharts = {
  updatedAt: "2026-01-01T00:00:00Z",
  period: "30d",
  series: {
    secondaryVolume: [
      { date: "2026-01-01", value: "100" },
      { date: "2026-01-02", value: "120" },
    ],
  },
} as unknown as MarketOverviewChartsApi;

describe("mapSecondaryMarketKpi", () => {
  it("live mode uses API stats and charts, not hardcoded demo", () => {
    const kpi = mapSecondaryMarketKpi({
      isLive: true,
      loading: false,
      stats: liveStats,
      charts: liveCharts,
      listingsSource: [
        { liquidity: "high" },
        { liquidity: "medium" },
        { liquidity: "high" },
        { liquidity: "low" },
      ],
    });

    expect(kpi.usesHardcodedDemo).toBe(false);
    expect(kpi.showDemoLabel).toBe(false);
    expect(kpi.volume24h.replace(/\s/g, " ")).toMatch(/9[\s\u00a0\u202f]?876/);
    expect(kpi.activeLots).toBe("17");
    expect(kpi.liquidPct).toBe("50%");
    expect(kpi.sparklineValues).toEqual([100, 120]);
    expect(kpi.volume24h).not.toBe(SECONDARY_MARKET_DEMO_KPI.volume24h);
  });

  it("live mode while loading shows placeholders, not demo hardcoded values", () => {
    const kpi = mapSecondaryMarketKpi({
      isLive: true,
      loading: true,
      stats: null,
      charts: null,
      listingsSource: [],
    });

    expect(kpi.volume24h).toBe("…");
    expect(kpi.activeLots).toBe("…");
    expect(kpi.sparklineValues).toEqual([]);
    expect(kpi.usesHardcodedDemo).toBe(false);
  });

  it("mock mode shows demo label and hardcoded KPI", () => {
    const kpi = mapSecondaryMarketKpi({
      isLive: false,
      loading: false,
      stats: liveStats,
      charts: liveCharts,
      listingsSource: [
        { liquidity: "high", status: "active" },
        { liquidity: "med", status: "sold_out" },
      ],
    });

    expect(kpi.showDemoLabel).toBe(true);
    expect(kpi.usesHardcodedDemo).toBe(true);
    expect(kpi.volume24h).toBe(SECONDARY_MARKET_DEMO_KPI.volume24h);
    expect(kpi.activeLots).toBe("1");
    expect(kpi.liquidPct).toBe(SECONDARY_MARKET_DEMO_KPI.liquidPct);
  });
});
