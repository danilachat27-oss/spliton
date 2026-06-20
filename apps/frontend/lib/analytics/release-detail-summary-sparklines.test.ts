import { describe, expect, it } from "vitest";

import {
  applyReleaseDetailSummarySparklines,
  parseUnitsAmount,
  parseUnitsPair,
  parseUsdtAmount,
  trendFromSeries,
} from "@/lib/analytics/release-detail-summary-sparklines";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";

import type { ReleaseDetailPageState } from "@/lib/analytics/release-detail-state";

function basePageState(): ReleaseDetailPageState {
  return {
    lifecycle: "active_primary",
    lifecycleLabelKey: "analytics.detail.lifecycle.activePrimary",
    badgeTone: "success",
    canBuyPrimary: true,
    primaryBlockingReasonKey: null,
    secondaryEnabled: true,
    secondaryMarketHref: "/secondary/market",
    fillProgressDisplay: "54%",
    hasUserPosition: false,
    isGuest: true,
    primaryCta: { labelKey: "analytics.detail.cta.buyUnits", href: "/catalog/buy" },
    secondaryCta: null,
  };
}

function baseData(overrides: Partial<ReleaseDetailPageData> = {}): ReleaseDetailPageData {
  return {
    row: {
      id: "1",
      symbol: "TST",
      release: "Test",
      artist: "Artist",
      genre: "electronic",
      yieldPct: "12%",
      changePct: "+1,2%",
      payouts: "100 USDT",
      units: "1000",
      status: "Active",
      trend: "up",
      sparkline: [1, 2, 3],
      payoutBand: { lo: "1", hi: "2", t: 0.5 },
    },
    breadcrumbs: [],
    heroBlurb: "",
    summaryPanel: [
      { kind: "gross", label: "Ориентир gross", value: "12%" },
      { kind: "round-status", label: "Статус раунда", value: "Раунд активен" },
      { kind: "position", label: "Позиция", value: "0 u." },
      { kind: "payouts", label: "Выплаты (30D)", value: "0 USDT" },
      { kind: "units", label: "Units в обороте", value: "500 / 1 000" },
      { kind: "available", label: "Доступно в первичке", value: "500 u." },
      { kind: "secondary", label: "Secondary (30D)", value: "0 USDT" },
    ],
    performance: {
      title: "",
      subtitle: "",
      seriesByPeriod: {
        "7d": [10, 11, 12],
        "30d": [10, 11, 12, 13],
        "90d": [],
        ytd: [],
        all: [],
      },
      miniStats: [],
    },
    quickStats: [],
    about: { title: "", paragraphs: [] },
    howItWorks: { title: "", blocks: [] },
    terms: { title: "", rows: [] },
    payoutHistory: [
      {
        period: "2026-01",
        gross: "100 USDT",
        poolShare: "26%",
        distribution: "26 USDT",
        perUnit: "1 USDT",
        toHolders: "20 USDT",
      },
      {
        period: "2026-02",
        gross: "200 USDT",
        poolShare: "26%",
        distribution: "52 USDT",
        perUnit: "2 USDT",
        toHolders: "40 USDT",
      },
    ],
    secondary: { title: "", rows: [] },
    faq: [],
    related: [],
    pageState: basePageState(),
    lifecycleLabel: "Раунд открыт",
    ...overrides,
  };
}

const chartFixtures = {
  soldUnits: 500,
  totalUnits: 1000,
  availableUnits: 500,
  volumeUsdt: [0, 10, 20, 30],
  volumeUnits: [5, 15, 40, 80, 150, 260, 380, 500],
  liquidityVolume24h: [100, 120, 90, 140, 180, 210, 260, 300],
  liquidityScore: [2.1, 2.4, 2.8, 3.2, 3.5, 3.9, 4.2, 4.6],
};

describe("release-detail-summary-sparklines", () => {
  it("parses USDT amounts", () => {
    expect(parseUsdtAmount("1 234,50 USDT")).toBe(1234.5);
    expect(parseUsdtAmount("—")).toBe(0);
  });

  it("parses sold/total units pair", () => {
    expect(parseUnitsPair("500 / 1 000")).toEqual({ sold: 500, total: 1000 });
    expect(parseUnitsAmount("500 / 1 000")).toBe(500);
  });

  it("builds payout sparkline from payout history", () => {
    const data = applyReleaseDetailSummarySparklines(baseData(), chartFixtures);
    const payouts = data.summaryPanel.find((row) => row.kind === "payouts");
    expect(payouts?.sparkline).toEqual([20, 40]);
  });

  it("uses volume chart for secondary card", () => {
    const data = applyReleaseDetailSummarySparklines(baseData(), chartFixtures);
    const secondary = data.summaryPanel.find((row) => row.kind === "secondary");
    expect(secondary?.sparkline).toEqual([0, 10, 20, 30]);
  });

  it("builds distinct sparklines per pulse metric", () => {
    const data = applyReleaseDetailSummarySparklines(baseData(), chartFixtures);
    const round = data.summaryPanel.find((row) => row.kind === "round-status");
    const units = data.summaryPanel.find((row) => row.kind === "units");
    const available = data.summaryPanel.find((row) => row.kind === "available");
    const position = data.summaryPanel.find((row) => row.kind === "position");

    expect(round?.sparkline).toEqual([20, 60]);
    expect(units?.sparkline?.[units.sparkline!.length - 1]).toBe(500);
    expect(available?.sparkline?.[0]).toBeGreaterThan(available?.sparkline?.at(-1)!);
    expect(position?.sparkline).toBeUndefined();
    expect(round?.sparkline).not.toEqual(units?.sparkline);
    expect(units?.sparkline).not.toEqual(available?.sparkline);
  });

  it("does not reuse price chart as fallback", () => {
    const data = applyReleaseDetailSummarySparklines(baseData(), {
      ...chartFixtures,
      volumeUsdt: [],
      volumeUnits: [],
      liquidityVolume24h: [],
      liquidityScore: [],
    });
    const round = data.summaryPanel.find((row) => row.kind === "round-status");
    const secondary = data.summaryPanel.find((row) => row.kind === "secondary");
    expect(round?.sparkline).toEqual([20, 60]);
    expect(secondary?.sparkline).toBeUndefined();
  });

  it("derives trend from series", () => {
    expect(trendFromSeries([1, 2, 3])).toBe("up");
    expect(trendFromSeries([3, 2, 1])).toBe("down");
    expect(trendFromSeries([5, 5, 5])).toBe("flat");
  });
});
