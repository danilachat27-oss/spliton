import { parseApiClientError } from "@/lib/api/api-client-error";
import { getPublicApiBaseUrl } from "@/lib/public-env";
import type { ChartPeriodId } from "@/lib/analytics/chart-period";

export type ChartSeriesApi = {
  period: string;
  bucket: string;
  timezone: string;
  from: string | null;
  to: string;
  points: Array<{
    timestamp: string;
    value: number;
    values?: Record<string, number>;
  }>;
  summary: Record<string, string | number | null>;
  lastUpdatedAt: string;
  source: string;
  emptyReason?: string;
};

type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

function baseUrl() {
  return getPublicApiBaseUrl();
}

function qs(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function parseChart(res: Response): Promise<ChartSeriesApi> {
  if (!res.ok) throw await parseApiClientError(res);
  return res.json() as Promise<ChartSeriesApi>;
}

export async function fetchMarketPriceChart(
  releaseId: string,
  period: ChartPeriodId,
  fetcher?: Fetcher,
): Promise<ChartSeriesApi> {
  const path = `/api/v1/market/charts/price${qs({ releaseId, period })}`;
  const res = fetcher
    ? await fetcher(`${baseUrl()}${path}`)
    : await fetch(`${baseUrl()}${path}`, { credentials: "include" });
  return parseChart(res);
}

export async function fetchMarketVolumeChart(
  releaseId: string,
  period: ChartPeriodId,
  fetcher?: Fetcher,
): Promise<ChartSeriesApi> {
  const path = `/api/v1/market/charts/volume${qs({ releaseId, period })}`;
  const res = fetcher
    ? await fetcher(`${baseUrl()}${path}`)
    : await fetch(`${baseUrl()}${path}`, { credentials: "include" });
  return parseChart(res);
}

export async function fetchMarketLiquidityChart(
  releaseId: string,
  period: ChartPeriodId,
  fetcher?: Fetcher,
): Promise<ChartSeriesApi> {
  const path = `/api/v1/market/charts/liquidity${qs({ releaseId, period })}`;
  const res = fetcher
    ? await fetcher(`${baseUrl()}${path}`)
    : await fetch(`${baseUrl()}${path}`, { credentials: "include" });
  return parseChart(res);
}

export function chartPointsToValues(chart: ChartSeriesApi): number[] {
  return chart.points.map((p) => p.value);
}

export function chartPointsToDual(
  chart: ChartSeriesApi,
  secondKey: string,
): { primary: number[]; secondary?: number[] } {
  return {
    primary: chart.points.map((p) => p.value),
    secondary: chart.points.map((p) => p.values?.[secondKey] ?? 0),
  };
}
