import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { paginateMock } from "@/features/admin/api/paginate-mock";
import type { PaginatedResponse } from "@/features/admin/api/types";
import type { AnalyticsPeriodKey } from "@/features/admin/analytics/types";
import {
  MOCK_PLATFORM_FEE_HISTORY,
  MOCK_PLATFORM_FEE_SETTINGS,
  MOCK_PLATFORM_REVENUE_PERIODS,
  MOCK_PLATFORM_REVENUE_RELEASES,
  MOCK_PLATFORM_REVENUE_SUMMARY,
  MOCK_PLATFORM_REVENUE_TRANSACTIONS,
  MOCK_PLATFORM_REVENUE_TX_DETAIL,
  type AdminPlatformRevenueTransaction,
  type AdminPlatformRevenueTransactionDetail,
  type PlatformFeeHistoryRow,
  type PlatformFeeSettings,
  type PlatformRevenuePeriodPoint,
  type PlatformRevenueReleaseRow,
  type PlatformRevenueSourceRow,
  type PlatformRevenueSummary,
} from "@/features/admin/mocks/admin-platform-revenue.mock";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type PlatformRevenueQuery = {
  page?: number;
  pageSize?: number;
  period?: AnalyticsPeriodKey | string;
  dateFrom?: string;
  dateTo?: string;
  source?: string;
  groupBy?: "day" | "week" | "month";
  minAmount?: string;
  maxAmount?: string;
  subjectType?: string;
  search?: string;
};

function platformRevenueQueryParams(query?: PlatformRevenueQuery): Record<string, string> {
  if (!query) return {};
  const out: Record<string, string> = {};
  const keys: Array<keyof PlatformRevenueQuery> = [
    "page",
    "pageSize",
    "period",
    "dateFrom",
    "dateTo",
    "source",
    "groupBy",
    "minAmount",
    "maxAmount",
    "subjectType",
    "search",
  ];
  for (const key of keys) {
    const v = query[key];
    if (v != null && v !== "" && v !== "all") out[key] = String(v);
  }
  return out;
}

function qs(path: string, query?: PlatformRevenueQuery): string {
  const params = platformRevenueQueryParams(query);
  const s = new URLSearchParams(params).toString();
  return s ? `${path}?${s}` : path;
}

function filterMockTransactions(
  items: AdminPlatformRevenueTransaction[],
  query?: PlatformRevenueQuery,
): AdminPlatformRevenueTransaction[] {
  let rows = [...items];
  if (query?.source && query.source !== "all") {
    rows = rows.filter((r) => r.source === query.source);
  }
  if (query?.search?.trim()) {
    const q = query.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        (r.userEmail?.toLowerCase().includes(q) ?? false) ||
        (r.releaseTitle?.toLowerCase().includes(q) ?? false),
    );
  }
  return rows;
}

export async function getAdminPlatformRevenueSummary(
  query?: PlatformRevenueQuery,
  client?: AdminApiClient,
): Promise<PlatformRevenueSummary> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<PlatformRevenueSummary>(qs(ADMIN_API_PATHS.platformRevenueSummary, query));
  }
  await adminMockDelay();
  return { ...MOCK_PLATFORM_REVENUE_SUMMARY };
}

export async function getAdminPlatformRevenueBySource(
  query?: PlatformRevenueQuery,
  client?: AdminApiClient,
): Promise<{ items: PlatformRevenueSourceRow[] }> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<{ items: PlatformRevenueSourceRow[] }>(
      qs(ADMIN_API_PATHS.platformRevenueBySource, query),
    );
  }
  const summary = await getAdminPlatformRevenueSummary(query, client);
  return { items: summary.bySource };
}

export async function getAdminPlatformRevenueByPeriod(
  query?: PlatformRevenueQuery,
  client?: AdminApiClient,
): Promise<{ items: PlatformRevenuePeriodPoint[]; groupBy?: string }> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<{ items: PlatformRevenuePeriodPoint[]; groupBy?: string }>(
      qs(ADMIN_API_PATHS.platformRevenueByPeriod, query),
    );
  }
  await adminMockDelay();
  return { items: MOCK_PLATFORM_REVENUE_PERIODS, groupBy: query?.groupBy ?? "day" };
}

export async function getAdminPlatformRevenueByRelease(
  query?: PlatformRevenueQuery,
  client?: AdminApiClient,
): Promise<{ items: PlatformRevenueReleaseRow[] }> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<{ items: PlatformRevenueReleaseRow[] }>(
      qs(ADMIN_API_PATHS.platformRevenueByRelease, query),
    );
  }
  await adminMockDelay();
  return { items: MOCK_PLATFORM_REVENUE_RELEASES };
}

export async function listAdminPlatformRevenueTransactions(
  query?: PlatformRevenueQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminPlatformRevenueTransaction>> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<PaginatedResponse<AdminPlatformRevenueTransaction>>(
      qs(ADMIN_API_PATHS.platformRevenueTransactions, query),
    );
  }
  await adminMockDelay();
  return paginateMock(filterMockTransactions(MOCK_PLATFORM_REVENUE_TRANSACTIONS, query), query);
}

export async function getAdminPlatformRevenueTransaction(
  id: string,
  client?: AdminApiClient,
): Promise<AdminPlatformRevenueTransactionDetail | null> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminPlatformRevenueTransactionDetail>(
      ADMIN_API_PATHS.platformRevenueTransaction(id),
    );
  }
  await adminMockDelay(120);
  if (id === MOCK_PLATFORM_REVENUE_TX_DETAIL.id) return { ...MOCK_PLATFORM_REVENUE_TX_DETAIL };
  const row = MOCK_PLATFORM_REVENUE_TRANSACTIONS.find((r) => r.id === id);
  if (!row) return null;
  return { ...row, rate: null, fixedAmount: null };
}

export async function getAdminPlatformFeeSettings(
  client?: AdminApiClient,
): Promise<PlatformFeeSettings> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<PlatformFeeSettings>(ADMIN_API_PATHS.platformFees);
  }
  await adminMockDelay();
  return { ...MOCK_PLATFORM_FEE_SETTINGS };
}

export async function getAdminPlatformFeeSettingsHistory(
  client?: AdminApiClient,
): Promise<{ items: PlatformFeeHistoryRow[] }> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<{ items: PlatformFeeHistoryRow[] }>(
      ADMIN_API_PATHS.platformRevenueFeeSettingsHistory,
    );
  }
  await adminMockDelay();
  return { items: MOCK_PLATFORM_FEE_HISTORY };
}

export async function patchAdminPlatformFees(
  body: {
    primaryPurchaseFeePct?: string;
    withdrawalFeeUsdt?: string;
    secondaryMarketFeePct?: string;
    premiumMonthlyUsdt?: string;
  },
  client?: AdminApiClient,
) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.patch(ADMIN_API_PATHS.platformFees, body);
  }
  await adminMockDelay(300);
  return { ok: true, ...body };
}

export type {
  AdminPlatformRevenueTransaction,
  AdminPlatformRevenueTransactionDetail,
  PlatformRevenueSummary,
  PlatformRevenueSourceRow,
  PlatformRevenuePeriodPoint,
  PlatformRevenueReleaseRow,
  PlatformFeeSettings,
  PlatformFeeHistoryRow,
};
