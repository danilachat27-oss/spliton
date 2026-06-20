import { PriceBucket } from '@prisma/client';

export const CHART_PERIODS = [
  '24h',
  '7d',
  '30d',
  '90d',
  '1y',
  'all',
] as const;

export type ChartPeriod = (typeof CHART_PERIODS)[number];

export const CHART_BUCKETS = ['hour', 'day', 'week', 'month'] as const;
export type ChartBucket = (typeof CHART_BUCKETS)[number];

export function isChartPeriod(value: string): value is ChartPeriod {
  return (CHART_PERIODS as readonly string[]).includes(value);
}

export function periodSince(period: ChartPeriod): Date | null {
  const now = Date.now();
  const map: Record<ChartPeriod, number | null> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000,
    all: null,
  };
  const ms = map[period];
  if (ms == null) return null;
  return new Date(now - ms);
}

export function resolveChartBucket(
  period: ChartPeriod,
  requested?: ChartBucket,
): ChartBucket {
  if (requested && CHART_BUCKETS.includes(requested)) return requested;
  if (period === '24h') return 'hour';
  if (period === '7d' || period === '30d' || period === '90d') return 'day';
  return 'week';
}

export function priceBucketForChart(bucket: ChartBucket): PriceBucket {
  if (bucket === 'hour') return PriceBucket.H1;
  return PriceBucket.D1;
}

export function maxChartPoints(period: ChartPeriod): number {
  if (period === '24h') return 48;
  if (period === '7d') return 168;
  if (period === '30d') return 90;
  if (period === '90d') return 120;
  if (period === '1y') return 52;
  return 500;
}

export type ChartPointMeta = Record<string, string | number | null>;

export type ChartSeriesPoint = {
  timestamp: string;
  value: number;
  values?: Record<string, number>;
  metadata?: ChartPointMeta;
};

export type ChartSeriesResponse = {
  period: ChartPeriod;
  bucket: ChartBucket;
  timezone: 'UTC';
  from: string | null;
  to: string;
  points: ChartSeriesPoint[];
  summary: Record<string, string | number | null>;
  lastUpdatedAt: string;
  source: 'trades' | 'price_history' | 'ledger' | 'listings' | 'aggregated';
  emptyReason?: string;
};

export function buildChartResponse(params: {
  period: ChartPeriod;
  bucket: ChartBucket;
  points: ChartSeriesPoint[];
  summary?: Record<string, string | number | null>;
  source: ChartSeriesResponse['source'];
  emptyReason?: string;
}): ChartSeriesResponse {
  const from =
    params.points.length > 0 ? params.points[0]!.timestamp : null;
  return {
    period: params.period,
    bucket: params.bucket,
    timezone: 'UTC',
    from,
    to: new Date().toISOString(),
    points: params.points,
    summary: params.summary ?? {},
    lastUpdatedAt: new Date().toISOString(),
    source: params.source,
    emptyReason:
      params.points.length === 0
        ? (params.emptyReason ?? 'NO_DATA_FOR_PERIOD')
        : undefined,
  };
}
