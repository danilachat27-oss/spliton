export type AnalyticsPeriodKey = "24h" | "7d" | "30d" | "90d" | "custom";

export type AnalyticsQuery = {
  period?: AnalyticsPeriodKey;
  dateFrom?: string;
  dateTo?: string;
  granularity?: "day" | "week" | "month";
  status?: string;
  trackId?: string;
  source?: string;
  segment?: string;
  role?: string;
  limit?: number;
  hasDeposit?: string;
  hasRisk?: string;
  managerId?: string;
};

export type AnalyticsPeriodRange = {
  from: string;
  to: string;
};

export type AnalyticsDelta = {
  depositsPct?: number | null;
  withdrawalsPct?: number | null;
  netFlowPct?: number | null;
  newUsersPct?: number | null;
};

export type AnalyticsMoneyPoint = {
  period: string;
  amountUsdt: string;
  count?: number;
};

export type AnalyticsCountPoint = {
  period: string;
  count: number;
};

export type AnalyticsDashboardTrends = {
  period: AnalyticsPeriodRange;
  deposits: AnalyticsMoneyPoint[];
  withdrawals: AnalyticsMoneyPoint[];
  platformRevenue: AnalyticsMoneyPoint[];
  newUsers: AnalyticsCountPoint[];
  payouts: AnalyticsMoneyPoint[];
  marketVolume: AnalyticsMoneyPoint[];
  marketTrades: AnalyticsCountPoint[];
  riskFlags: AnalyticsCountPoint[];
  supportTickets: AnalyticsCountPoint[];
};

export type AnalyticsSegmentRow = {
  key: string;
  label: string;
  count: number;
  amountUsdt?: string;
};

export type AnalyticsFunnelStep = {
  step: string;
  label: string;
  count: number;
  conversionPct: number | null;
};
