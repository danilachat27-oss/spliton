import { getPublicApiBaseUrl } from "@/lib/public-env";
import { formatApiError } from "@/lib/i18n/format-api-error";
import type { WalletActivityList } from "@/services/wallet.service";

export const PORTFOLIO_API_PATHS = {
  overview: "/api/v1/portfolio/overview",
  positions: "/api/v1/portfolio/positions",
  metrics: "/api/v1/portfolio/metrics",
  activity: "/api/v1/portfolio/activity",
} as const;

export type PortfolioPositionApi = {
  id: string;
  releaseId: string;
  slug: string;
  /** Market symbol for UI labels (e.g. AC2145) */
  symbol?: string;
  release: string;
  artist: string;
  coverUrl: string | null;
  genre: string;
  unitsTotal: string;
  unitsAvailable: string;
  unitsLocked: string;
  /** Units available in primary listings or secondary listings (optional for compatibility) */
  listedUnits?: string;
  avgEntryPrice: string;
  currentPrice: string;
  priceSource: string;
  hasMarketPrice?: boolean;
  lastTradePriceUsdt?: string | null;
  marketValue: string;
  costBasis: string;
  pnlUnrealized: string;
  pnlPct: string;
  status: "Active" | "Open round" | "Secondary" | "Closed";
  availableToSell: boolean;
  canBuyMore?: boolean;
  dateEntered: string;
  portfolioSharePct: string;
  liquidityPercent?: string;
  totalAccruedUsdt?: string;
  totalPaidUsdt?: string;
  pendingPayoutUsdt?: string;
  activeListingsCount?: number;
  updatedAt?: string;
};

export type PortfolioStructureApi = {
  label: string;
  value: string;
  percent: number;
};

export type PortfolioOverviewApi = {
  totalValue: string;
  totalUnits: string;
  activeReleases: number;
  positionCount: number;
  expectedPayouts: string;
  realizedIncome: string;
  unrealizedPnl: string;
  change30dPct: string | null;
  topPositions: PortfolioPositionApi[];
  riskSummary: {
    lockedUnits: string;
    lockedValue: string;
    liquidityLabel: string;
    openRoundCount: number;
  };
  stats: { label: string; value: string }[];
  genreStructure: PortfolioStructureApi[];
  statusStructure: PortfolioStructureApi[];
  updatedAt: string;
};

export type PortfolioMetricsOverviewApi = {
  portfolioValueUsdt: string;
  totalUnits: string;
  activePositions: number;
  activeReleases: number;
  totalAccruedUsdt: string;
  totalPaidUsdt: string;
  pendingPayoutUsdt: string;
  unrealizedPnlUsdt: string;
  change30dPct: string | null;
  averagePositionSizeUsdt: string | null;
};

export type PortfolioMetricsApi = {
  overview: PortfolioMetricsOverviewApi;
  topStats: { label: string; value: string; hint: string }[];
  genreAllocation: PortfolioStructureApi[];
  statusAllocation: PortfolioStructureApi[];
  incomeByPeriod: { period: string; amount: string }[];
  valueHistory: { ts: string; value: string }[];
  performance: {
    pnl30dPct: string | null;
    portfolioValue: string;
    realizedIncome: string;
    unrealizedPnl: string;
    pendingPayouts: string;
    totalAccrued: string;
  };
  productPnl: { label: string; value: string }[];
  updatedAt?: string;
};

export type PortfolioActivityItemApi = {
  id: string;
  occurredAt: string;
  type: string;
  kind: string;
  release: string;
  releaseId: string | null;
  units: string;
  amount: string;
  status: string;
  txId: string;
  details: string;
};

export type PortfolioActivityApi = {
  items: PortfolioActivityItemApi[];
  total: number;
};

type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

function portfolioUrl(path: string): string {
  return `${getPublicApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchPortfolioOverview(
  authorizedFetch: AuthorizedFetch,
): Promise<PortfolioOverviewApi> {
  const res = await authorizedFetch(portfolioUrl(PORTFOLIO_API_PATHS.overview));
  return parseJson(res);
}

export async function fetchPortfolioPositions(
  authorizedFetch: AuthorizedFetch,
  query?: {
    page?: number;
    limit?: number;
    sort?: string;
    sortDir?: "asc" | "desc";
    q?: string;
    genre?: string;
    status?: string;
  },
): Promise<{ items: PortfolioPositionApi[]; total: number }> {
  const qs = query
    ? buildQueryString({
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        sortDir: query.sortDir,
        q: query.q,
        genre: query.genre,
        status: query.status,
      })
    : "";
  const res = await authorizedFetch(`${portfolioUrl(PORTFOLIO_API_PATHS.positions)}${qs}`);
  return parseJson(res);
}

export async function fetchPortfolioMetrics(
  authorizedFetch: AuthorizedFetch,
): Promise<PortfolioMetricsApi> {
  const res = await authorizedFetch(portfolioUrl(PORTFOLIO_API_PATHS.metrics));
  return parseJson(res);
}

export async function fetchPortfolioActivity(
  authorizedFetch: AuthorizedFetch,
  limit = 100,
): Promise<PortfolioActivityApi> {
  const res = await authorizedFetch(
    `${portfolioUrl(PORTFOLIO_API_PATHS.activity)}?limit=${limit}`,
  );
  return parseJson(res);
}

// -----------------------
// Payouts + portfolio charts (frontend live mode)
// -----------------------

export type PortfolioChartPointApi = { timestamp: string; value: number };

export type PortfolioChartResponseApi = {
  points: PortfolioChartPointApi[];
  lastUpdatedAt: string;
  summary: Record<string, string | number | null>;
};

export type PortfolioPayoutsOverviewLatestPayoutApi = {
  amountUsdt: string;
  paidAt: string;
  releaseTitle: string | null;
};

export type PortfolioPayoutsOverviewApi = {
  totalAccruedUsdt: string;
  totalPaidUsdt: string;
  pendingPayoutUsdt: string;
  availableBalance: string;
  lockedBalance: string;
  pendingBalance: string;
  withdrawnTotal: string;
  earnedTotal: string;
  pendingWithdrawalsCount: number;
  minWithdrawalUsdt: string;
  withdrawalFeeUsdt: string;
  withdrawalEnabled: boolean;
  asset: string;
  network: string;
  latestPayout: PortfolioPayoutsOverviewLatestPayoutApi | null;
  nextExpectedPayout: null;
  updatedAt: string;
};

export type PortfolioPayoutsCompareSideApi = {
  titleKey: string;
  from: string;
  to: string;
  accrualsUsdt: string;
  withdrawalsUsdt: string;
};

export type PortfolioPayoutsCompareApi = {
  window: "7d" | "30d" | "90d";
  asset: string;
  left: PortfolioPayoutsCompareSideApi | null;
  right: PortfolioPayoutsCompareSideApi | null;
  deltaAccrualsPct: number | null;
  emptyReason?: string;
  updatedAt: string;
};

export type PortfolioPayoutsHistoryQuery = {
  period?: string;
  type?: string;
  sort?: string;
  page?: number;
  limit?: number;
  q?: string;
};

export function portfolioErrorMessage(err: unknown): string {
  return formatApiError(err);
}

export type PortfolioChartPeriodApi = "7d" | "30d" | "90d" | "180d" | "1y" | "all" | "24h";

export const PORTFOLIO_PAYOUTS_API_PATHS = {
  payoutsOverview: "/api/v1/portfolio/payouts/overview",
  payoutsCompare: "/api/v1/portfolio/payouts/compare",
  payoutsHistory: "/api/v1/portfolio/payouts/history",
  chartsValue: "/api/v1/portfolio/charts/value",
  chartsPayouts: "/api/v1/portfolio/charts/payouts",
} as const;

function normalizePortfolioChartPeriod(period: string): string {
  // Portfolio endpoints validate allowed periods that differ from UI chart IDs.
  if (period === "24h") return "7d";
  return period;
}

function buildQueryString(params: Record<string, string | number | undefined | null>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchPayoutsOverview(
  authorizedFetch: AuthorizedFetch,
): Promise<PortfolioPayoutsOverviewApi> {
  const res = await authorizedFetch(portfolioUrl(PORTFOLIO_PAYOUTS_API_PATHS.payoutsOverview));
  return parseJson(res);
}

export async function fetchPortfolioValueChart(
  authorizedFetch: AuthorizedFetch,
  period: string,
): Promise<Pick<PortfolioChartResponseApi, "points" | "lastUpdatedAt">> {
  const periodApi = normalizePortfolioChartPeriod(period);
  const res = await authorizedFetch(
    portfolioUrl(`${PORTFOLIO_PAYOUTS_API_PATHS.chartsValue}?period=${encodeURIComponent(periodApi)}`),
  );
  const json = (await parseJson(res)) as PortfolioChartResponseApi;
  return { points: json.points, lastUpdatedAt: json.lastUpdatedAt };
}

export async function fetchPortfolioPayoutsChart(
  authorizedFetch: AuthorizedFetch,
  period: string,
): Promise<PortfolioChartResponseApi> {
  const periodApi = normalizePortfolioChartPeriod(period);
  const res = await authorizedFetch(
    portfolioUrl(`${PORTFOLIO_PAYOUTS_API_PATHS.chartsPayouts}?period=${encodeURIComponent(periodApi)}`),
  );
  return parseJson(res) as Promise<PortfolioChartResponseApi>;
}

export async function fetchPayoutsHistory(
  authorizedFetch: AuthorizedFetch,
  query: PortfolioPayoutsHistoryQuery = {},
): Promise<WalletActivityList> {
  const qs = buildQueryString({
    period: query.period,
    type: query.type,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
    q: query.q,
  });

  const res = await authorizedFetch(
    portfolioUrl(`${PORTFOLIO_PAYOUTS_API_PATHS.payoutsHistory}${qs}`),
  );
  return parseJson(res) as Promise<WalletActivityList>;
}

export async function fetchPayoutsCompare(
  authorizedFetch: AuthorizedFetch,
  window: "7d" | "30d" | "90d",
): Promise<PortfolioPayoutsCompareApi> {
  const res = await authorizedFetch(
    portfolioUrl(`${PORTFOLIO_PAYOUTS_API_PATHS.payoutsCompare}?window=${encodeURIComponent(window)}`),
  );
  return parseJson(res) as Promise<PortfolioPayoutsCompareApi>;
}
