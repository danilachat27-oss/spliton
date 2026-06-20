import { describe, expect, it } from "vitest";

import { formatApiError } from "@/lib/i18n/format-api-error";
import {
  adaptPayoutChartPoints,
  payoutChartKpiFromSeries,
} from "@/lib/portfolio/payouts-chart-adapter";
import { localizedApiError } from "@/lib/api/localized-error";

describe("payouts chart adapter", () => {
  it("builds cumulative series from backend points", () => {
    const series = adaptPayoutChartPoints([
      { timestamp: "2026-01-01T00:00:00.000Z", value: 10 },
      { timestamp: "2026-02-01T00:00:00.000Z", value: 25 },
    ]);
    expect(series).toHaveLength(2);
    expect(series[0]?.cumulativeUSDT).toBe(10);
    expect(series[1]?.cumulativeUSDT).toBe(35);
  });

  it("returns zero KPI for empty series", () => {
    const kpi = payoutChartKpiFromSeries([]);
    expect(kpi.cumulativeNow).toBe(0);
    expect(kpi.periodVolume).toBe(0);
  });
});

describe("P0 financial error sanitization", () => {
  it("does not expose Prisma errors to users", () => {
    const msg = localizedApiError({
      code: "INTERNAL_ERROR",
      message: "PrismaClientKnownRequestError P2002",
    });
    expect(msg.toLowerCase()).not.toContain("prisma");
  });

  it("maps insufficient balance code", () => {
    expect(formatApiError({ code: "WALLET_INSUFFICIENT_BALANCE" }, "ru")).toMatch(/Недостаточно/);
  });

  it("maps release not found for sell flow", () => {
    expect(formatApiError({ code: "RELEASE_NOT_FOUND" }, "ru")).toMatch(/не найден/i);
  });
});
