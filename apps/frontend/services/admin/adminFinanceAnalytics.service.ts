import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import type { AnalyticsQuery } from "@/features/admin/analytics/types";
import {
  MOCK_ANALYTICS_FINANCE_SUMMARY,
  MOCK_FINANCE_FEES,
} from "@/features/admin/mocks/admin-analytics-overview.mock";
import { fetchAnalytics } from "./adminAnalytics.service";

const EMPTY_CASHFLOW = { items: [] as Array<{ period: string; depositsUsdt: string; withdrawalsUsdt: string; netFlowUsdt: string }> };

export async function getFinanceAnalyticsSummary(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsFinanceSummary, query, client, () => ({
    ...MOCK_ANALYTICS_FINANCE_SUMMARY,
  }));
}

export async function getFinanceAnalyticsCashflow(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsFinanceCashflow, query, client, () => EMPTY_CASHFLOW);
}

export async function getFinanceAnalyticsFees(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsFinanceFees, query, client, () => ({
    ...MOCK_FINANCE_FEES,
  }));
}

export async function getFinanceAnalyticsWithdrawalProcessing(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsFinanceWithdrawalProcessing, query, client, () => ({
    averageHours: null as number | null,
    medianHours: null as number | null,
    samples: 0,
  }));
}

export async function getFinanceAnalyticsFailures(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsFinanceFailures, query, client, () => ({
    failedDeposits: 0,
    failedWithdrawals: 0,
    items: [] as Array<{ id: string; type: string; amountUsdt: string; createdAt: string }>,
  }));
}
