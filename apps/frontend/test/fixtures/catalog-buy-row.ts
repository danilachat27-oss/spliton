import type { MarketOverviewRow } from "@/types/market-overview";

export const BUY_PANEL_TEST_RELEASE_ID = "11111111-1111-4111-8111-111111111111";

export function makeBuyPanelTestRow(overrides?: Partial<MarketOverviewRow>): MarketOverviewRow {
  return {
    id: BUY_PANEL_TEST_RELEASE_ID,
    symbol: "TST",
    title: "Test Release",
    artist: "Test Artist",
    segment: "Pop",
    yieldPct: 8,
    payoutsUsdt: 100,
    activityScore: 50,
    availableUnits: 100,
    primaryUnitPriceUsdt: 10,
    secondaryLabel: "Средний",
    liquidityLabel: "Средняя",
    trend: "up",
    sparkline: [1, 2, 3],
    status: "Активен",
    payoutFreq: "monthly",
    categories: ["all"],
    ...overrides,
  };
}
