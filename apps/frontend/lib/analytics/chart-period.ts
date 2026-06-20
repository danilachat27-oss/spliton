export const CHART_PERIOD_IDS = ["24h", "7d", "30d", "90d", "1y", "all"] as const;

export type ChartPeriodId = (typeof CHART_PERIOD_IDS)[number];

export const CHART_PERIOD_OPTIONS = CHART_PERIOD_IDS.map((id) => ({ id }));

export const DEFAULT_CHART_PERIOD: ChartPeriodId = "30d";
