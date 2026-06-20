"use client";

import * as React from "react";

import type { AnalyticsPeriodKey, AnalyticsQuery } from "@/features/admin/analytics/types";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultCustomRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from: toDateInputValue(from), to: toDateInputValue(to) };
}

export function useAnalyticsPeriod(defaultPeriod: AnalyticsPeriodKey = "30d") {
  const [period, setPeriod] = React.useState<AnalyticsPeriodKey>(defaultPeriod);
  const [customRange, setCustomRange] = React.useState(defaultCustomRange);

  const setPeriodWithReset = React.useCallback((next: AnalyticsPeriodKey) => {
    setPeriod(next);
  }, []);

  const setCustomDates = React.useCallback((from: string, to: string) => {
    setCustomRange({ from, to });
    setPeriod("custom");
  }, []);

  const query = React.useMemo<AnalyticsQuery>(() => {
    if (period === "custom" && customRange.from && customRange.to) {
      return { period: "custom", dateFrom: customRange.from, dateTo: customRange.to };
    }
    return { period };
  }, [period, customRange.from, customRange.to]);

  return {
    period,
    setPeriod: setPeriodWithReset,
    customFrom: customRange.from,
    customTo: customRange.to,
    setCustomDates,
    query,
  };
}

export function parseAnalyticsMoney(value: string): number {
  return Number(value.replace(/\s/g, "").replace(",", ".")) || 0;
}

export function moneyPointsToValues(points: Array<{ period: string; amountUsdt: string }>) {
  return points.map((p) => ({ period: p.period, value: parseAnalyticsMoney(p.amountUsdt) }));
}

export function countPointsToValues(points: Array<{ period: string; count: number }>) {
  return points.map((p) => ({ period: p.period, value: p.count }));
}
