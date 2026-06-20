import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppLocale } from "@/lib/i18n/types";
import type {
  PortfolioActivityItemApi,
  PortfolioOverviewApi,
  PortfolioPositionApi,
} from "@/services/portfolio.service";

import {
  adaptActivityRow,
  adaptPositionRow,
  adaptRecentActivity,
  adaptUpcomingFromOverview,
  adaptValueHistoryToChart,
  UPCOMING_EXPECTED_RELEASE_ID,
} from "./portfolio-adapter";

const CYRILLIC = /[\u0400-\u04FF]/;
const LOCALES: AppLocale[] = ["ru", "en", "es", "pt"];

const samplePosition = (): PortfolioPositionApi => ({
  id: "pos-1",
  releaseId: "rel-1",
  slug: "track-slug",
  symbol: "TRK01",
  release: "Midnight Drive",
  artist: "Nova",
  coverUrl: null,
  genre: "Electronic",
  unitsTotal: "1250",
  unitsAvailable: "1000",
  unitsLocked: "250",
  listedUnits: "100",
  avgEntryPrice: "1.2",
  currentPrice: "1.5",
  priceSource: "last_trade",
  hasMarketPrice: true,
  lastTradePriceUsdt: "1.5",
  marketValue: "1875.50",
  costBasis: "1500",
  totalInvestedUsdt: "1500",
  pnlUnrealized: "375.50",
  pnlPct: "25",
  portfolioSharePct: "12.5",
  liquidityPercent: "80.0",
  status: "Active",
  availableToSell: true,
  canBuyMore: true,
  dateEntered: "2024-06-15T10:00:00.000Z",
  updatedAt: "2024-06-15T10:00:00.000Z",
  totalAccruedUsdt: "0.00",
  totalPaidUsdt: "0.00",
  pendingPayoutUsdt: "0.00",
  activeListingsCount: 1,
});

const sampleActivity = (): PortfolioActivityItemApi => ({
  id: "act-1",
  occurredAt: "2026-06-05T08:00:00.000Z",
  type: "Purchase",
  kind: "purchase",
  release: "Midnight Drive",
  releaseId: "rel-1",
  units: "100",
  amount: "150 USDT",
  status: "Completed",
  txId: "abc123def456",
  details: "Primary market",
});

describe("portfolio-adapter locale", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats position dates and units across ru/en/es/pt", () => {
    const row = samplePosition();
    const formatted = LOCALES.map((locale) => adaptPositionRow(row, locale));

    for (const item of formatted) {
      expect(item.dateEntered).toBeTruthy();
      expect(item.dateEntered).not.toBe("—");
      expect(item.units).toMatch(/1[\s.,]?250/);
      expect(item.heldUnits).toBe(1250);
      expect(item.value).toMatch(/USDT/);
    }

    expect(formatted[0]!.dateEntered).not.toEqual(formatted[1]!.dateEntered);
  });

  it("EN locale does not include Russian month or relative words", () => {
    const position = adaptPositionRow(samplePosition(), "en");
    expect(position.dateEntered).not.toMatch(CYRILLIC);

    const activity = adaptActivityRow(sampleActivity(), "en");
    expect(activity.date).not.toMatch(CYRILLIC);
    expect(activity.relative).not.toMatch(CYRILLIC);
    expect(activity.relative).not.toMatch(/мин\.|ч\.|дн\./);
  });

  it("ES and PT render non-RU formatted dates", () => {
    for (const locale of ["es", "pt"] as const) {
      const position = adaptPositionRow(samplePosition(), locale);
      expect(position.dateEntered).not.toMatch(CYRILLIC);

      const recent = adaptRecentActivity([sampleActivity()], locale)[0]!;
      expect(recent.date).not.toMatch(CYRILLIC);
    }
  });

  it("handles invalid and null values safely", () => {
    const badRow: PortfolioPositionApi = {
      ...samplePosition(),
      unitsTotal: "not-a-number",
      marketValue: "bad",
      dateEntered: "",
    };

    const out = adaptPositionRow(badRow, "en");
    expect(out.units).toBe("not-a-number");
    expect(out.heldUnits).toBeUndefined();
    expect(out.value).toBe("bad USDT");
    expect(out.dateEntered).toBe("—");

    const badActivity = adaptActivityRow(
      { ...sampleActivity(), occurredAt: "invalid" },
      "en",
    );
    expect(badActivity.date).toBe("—");
    expect(badActivity.relative).toBe("");
  });

  it("adaptValueHistoryToChart returns empty series when no points", () => {
    expect(adaptValueHistoryToChart([], 100, "en")).toEqual([]);
  });

  it("adaptValueHistoryToChart uses locale-aware month labels", () => {
    const points = [{ ts: "2026-01-15T00:00:00.000Z", value: "100" }];
    const en = adaptValueHistoryToChart(points, 100, "en")[0]!.label;
    const ru = adaptValueHistoryToChart(points, 100, "ru")[0]!.label;
    expect(en).toBeTruthy();
    expect(ru).toBeTruthy();
    expect(en).not.toEqual(ru);
    expect(en).not.toMatch(CYRILLIC);
  });

  it("adaptUpcomingFromOverview uses internal release id, not Russian label", () => {
    const overview = {
      expectedPayouts: "500",
    } as PortfolioOverviewApi;
    const items = adaptUpcomingFromOverview(overview);
    expect(items[0]?.release).toBe(UPCOMING_EXPECTED_RELEASE_ID);
    expect(items[0]?.release).not.toMatch(CYRILLIC);
  });

  it("has no ru-RU hardcoded locale in portfolio-adapter source", () => {
    const src = fs.readFileSync(path.join(__dirname, "portfolio-adapter.ts"), "utf8");
    expect(src).not.toMatch(/ru-RU/);
    expect(src).not.toMatch(/мин\. назад|ч\. назад|дн\. назад/);
    expect(src).not.toMatch(/Янв|Ожидаемые выплаты/);
  });
});
