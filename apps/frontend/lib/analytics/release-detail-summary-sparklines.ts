import type { ExchangeNeonTrend } from "@/components/shared/charts/exchange-neon-sparkline";
import type {
  ReleaseDetailPageData,
  ReleaseDetailPayoutRow,
  ReleaseDetailSummaryRow,
  ReleaseDetailSummaryRowKind,
} from "@/types/analytics/release-detail";

export type ReleaseDetailSparklineCharts = {
  volumeUsdt?: number[];
  volumeUnits?: number[];
  liquidityVolume24h?: number[];
  liquidityScore?: number[];
  soldUnits?: number;
  totalUnits?: number;
  availableUnits?: number;
};

const MAX_POINTS = 10;

function parseNumericToken(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function tailSeries(values: number[], maxPoints = MAX_POINTS): number[] {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) return [];
  if (clean.length === 1) return [clean[0]!, clean[0]!];
  return clean.slice(-maxPoints);
}

function padFlatSeries(value: number, points = 6): number[] {
  return Array.from({ length: points }, () => value);
}

export function parseUsdtAmount(raw: string): number {
  if (!raw || raw.trim() === "—") return 0;
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/USDT/gi, "")
    .replace(/[^\d.,+-]/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function parseUnitsPair(raw: string): { sold: number; total: number } | null {
  if (!raw || raw.trim() === "—") return null;
  const ratio = raw.match(/([\d\s.,]+)\s*\/\s*([\d\s.,]+)/);
  if (!ratio) return null;
  return { sold: parseNumericToken(ratio[1]!), total: parseNumericToken(ratio[2]!) };
}

export function parseUnitsAmount(raw: string): number {
  if (!raw || raw.trim() === "—") return 0;
  const pair = parseUnitsPair(raw);
  if (pair) return pair.sold;
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/u\./gi, "")
    .replace(/[^\d.,+-]/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function trendFromSeries(values: number[]): ExchangeNeonTrend {
  if (values.length < 2) return "flat";
  const first = values[0]!;
  const last = values[values.length - 1]!;
  const delta = last - first;
  const scale = Math.max(Math.abs(first), Math.abs(last), 1);
  if (Math.abs(delta) / scale < 0.002) return "flat";
  return delta > 0 ? "up" : "down";
}

function payoutAmountSeries(payoutHistory: ReleaseDetailPayoutRow[]): number[] {
  const sorted = [...payoutHistory].sort((a, b) => a.period.localeCompare(b.period));
  return tailSeries(
    sorted.map((row) => parseUsdtAmount(row.toHolders || row.distribution || row.gross)),
  );
}

function cumulativeSeries(values: number[]): number[] {
  if (values.length === 0) return [];
  let sum = 0;
  return values.map((v) => {
    sum += v;
    return sum;
  });
}

function scaleSeriesToTarget(values: number[], target: number): number[] {
  if (values.length === 0 || target <= 0) return [];
  const last = values[values.length - 1]!;
  if (last <= 0) {
    return interpolateSeries(0, target, values.length);
  }
  return values.map((v) => (v / last) * target);
}

function interpolateSeries(from: number, to: number, points: number): number[] {
  if (points <= 1) return [to];
  return Array.from({ length: points }, (_, i) => from + ((to - from) * i) / (points - 1));
}

function soldUnitsHistorySeries(charts?: ReleaseDetailSparklineCharts): number[] {
  const sold = charts?.soldUnits ?? 0;
  const total = charts?.totalUnits ?? 0;
  if (sold <= 0) return [];

  const dailyFlow = tailSeries(charts?.volumeUnits ?? charts?.liquidityVolume24h ?? []);

  if (dailyFlow.length >= 2) {
    const cum = cumulativeSeries(dailyFlow.map((v) => Math.max(0, v)));
    return tailSeries(scaleSeriesToTarget(cum, sold));
  }

  if (total > sold) {
    return tailSeries(interpolateSeries(0, sold, 8));
  }

  return tailSeries(padFlatSeries(sold, 6));
}

function availableUnitsHistorySeries(
  soldSeries: number[],
  charts?: ReleaseDetailSparklineCharts,
): number[] {
  const total = charts?.totalUnits ?? 0;
  const availableNow = charts?.availableUnits ?? 0;

  if (soldSeries.length >= 2 && total > 0) {
    return tailSeries(soldSeries.map((sold) => Math.max(0, total - sold)));
  }

  if (availableNow > 0) {
    return tailSeries(
      interpolateSeries(total > 0 ? total - availableNow : availableNow, availableNow, 6),
    );
  }

  return [];
}

function roundStatusSeries(
  payoutHistory: ReleaseDetailPayoutRow[],
  charts?: ReleaseDetailSparklineCharts,
): number[] | undefined {
  const payouts = payoutAmountSeries(payoutHistory);
  if (payouts.some((v) => v > 0)) {
    return tailSeries(cumulativeSeries(payouts));
  }

  const liquidity = tailSeries(charts?.liquidityScore ?? []);
  if (liquidity.length >= 2 && liquidity.some((v) => v > 0)) {
    return liquidity;
  }

  const volume = tailSeries(charts?.liquidityVolume24h ?? []);
  if (volume.length >= 2 && volume.some((v) => v > 0)) {
    return volume;
  }

  return undefined;
}

function userPositionSeries(data: ReleaseDetailPageData): number[] | undefined {
  const ledger = data.myHistory?.ledger ?? [];
  if (ledger.length >= 1) {
    const sorted = [...ledger].sort(
      (a, b) => new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime(),
    );
    let units = 0;
    const series = sorted.map((event) => {
      units += parseUnitsAmount(event.unitsDelta);
      return Math.max(0, units);
    });
    return tailSeries(series);
  }

  const payouts = data.myHistory?.payouts ?? [];
  if (payouts.length >= 2) {
    const sorted = [...payouts].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return tailSeries(cumulativeSeries(sorted.map((p) => parseUsdtAmount(p.amountNet))));
  }

  const trades = data.myHistory?.trades ?? [];
  if (trades.length >= 2) {
    let units = 0;
    const sorted = [...trades].sort(
      (a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime(),
    );
    const series = sorted.map((trade) => {
      const delta = parseUnitsAmount(trade.units);
      units += trade.side.toLowerCase() === "sell" ? -delta : delta;
      return Math.max(0, units);
    });
    return tailSeries(series);
  }

  return undefined;
}

function secondaryVolumeSeries(charts?: ReleaseDetailSparklineCharts): number[] | undefined {
  const volume = tailSeries(charts?.volumeUsdt ?? []);
  if (volume.length >= 2) return volume;
  return undefined;
}

function resolveSummaryRowKind(
  row: ReleaseDetailSummaryRow,
  index: number,
): ReleaseDetailSummaryRowKind | "wallet" | "gross" {
  if (row.kind) {
    if (row.kind === "position" || row.kind === "my-position") return "wallet";
    if (row.kind === "action") return "gross";
    return row.kind;
  }
  const label = row.label.toLowerCase();
  if (index === 0 || label.includes("gross") || label.includes("ориентир")) return "gross";
  if (label.includes("статус")) return "round-status";
  if (label.includes("выплат")) return "payouts";
  if (label.includes("units") && (label.includes("оборот") || label.includes("circulation"))) return "units";
  if (label.includes("доступно") || label.includes("available")) return "available";
  if (label.includes("secondary") || label.includes("вторич")) return "secondary";
  if (label.includes("мин") && label.includes("вход")) return "min-entry";
  if (label.includes("кошел") || label.includes("wallet") || label.includes("позиц")) return "wallet";
  return "gross";
}

function sparklineForSummaryRow(
  row: ReleaseDetailSummaryRow,
  index: number,
  data: ReleaseDetailPageData,
  charts?: ReleaseDetailSparklineCharts,
  soldSeries?: number[],
): number[] | undefined {
  const kind = resolveSummaryRowKind(row, index);
  if (kind === "gross" || kind === "min-entry" || kind === "action") return undefined;

  const payoutHistory = data.payoutHistory;
  const sold = soldSeries ?? soldUnitsHistorySeries(charts);

  switch (kind) {
    case "round-status":
      return roundStatusSeries(payoutHistory, charts);
    case "payouts": {
      const payouts = payoutAmountSeries(payoutHistory);
      return payouts.length >= 2 ? payouts : undefined;
    }
    case "units":
      return sold.length >= 2 ? sold : undefined;
    case "available": {
      const available = availableUnitsHistorySeries(sold, charts);
      return available.length >= 2 ? available : undefined;
    }
    case "secondary":
      return secondaryVolumeSeries(charts);
    case "wallet":
      return userPositionSeries(data);
    default:
      return undefined;
  }
}

export function applyReleaseDetailSummarySparklines(
  data: ReleaseDetailPageData,
  charts?: ReleaseDetailSparklineCharts,
): ReleaseDetailPageData {
  const soldSeries = soldUnitsHistorySeries(charts);

  return {
    ...data,
    summaryPanel: data.summaryPanel.map((row, index) => {
      const sparkline = sparklineForSummaryRow(row, index, data, charts, soldSeries);
      if (!sparkline || sparkline.length < 2) return row;
      return { ...row, sparkline };
    }),
  };
}
