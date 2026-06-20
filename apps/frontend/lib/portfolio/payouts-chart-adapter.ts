import type { PayoutAccrualChartPoint } from "@/components/dashboard/assets/payouts-mock-data";
import { formatDate } from "@/lib/i18n/formatters";
import type { AppLocale } from "@/lib/i18n/types";
import type { PortfolioChartPointApi } from "@/services/portfolio.service";

export type PayoutChartRangeId = "24h" | "7d" | "30d" | "1y";

export function mapPayoutChartRangeToApi(range: PayoutChartRangeId): string {
  return range;
}

export function adaptPayoutChartPoints(
  points: PortfolioChartPointApi[],
  locale: AppLocale = "ru",
): PayoutAccrualChartPoint[] {
  let cumulative = 0;
  return points.map((point) => {
    const periodUSDT = Number.isFinite(point.value) ? point.value : 0;
    cumulative += periodUSDT;
    const date = new Date(point.timestamp);
    const label = Number.isNaN(date.getTime())
      ? point.timestamp
      : formatDate(date, locale, { day: "2-digit", month: "short" });
    return {
      label,
      periodUSDT,
      cumulativeUSDT: cumulative,
    };
  });
}

export function payoutChartKpiFromSeries(series: PayoutAccrualChartPoint[]) {
  if (series.length === 0) {
    return {
      cumulativeNow: 0,
      cumulativeDeltaPct: 0,
      periodVolume: 0,
      periodDeltaPct: 0,
    };
  }
  const first = series[0]!.cumulativeUSDT - series[0]!.periodUSDT;
  const last = series[series.length - 1]!;
  const periodVolume = series.reduce((sum, p) => sum + p.periodUSDT, 0);
  const cumulativeDeltaPct =
    first > 0 ? ((last.cumulativeUSDT - first) / first) * 100 : 0;
  return {
    cumulativeNow: last.cumulativeUSDT,
    cumulativeDeltaPct,
    periodVolume,
    periodDeltaPct: 0,
  };
}
