import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import type { AnalyticsQuery } from "@/features/admin/analytics/types";
import {
  MOCK_REVENUE_ANALYTICS_BY_TRACK,
  MOCK_REVENUE_ANALYTICS_DISTRIBUTIONS,
  MOCK_REVENUE_ANALYTICS_EVENTS,
  MOCK_REVENUE_ANALYTICS_FAILED,
  MOCK_REVENUE_ANALYTICS_PAYOUTS,
  MOCK_REVENUE_ANALYTICS_PIPELINE,
  MOCK_REVENUE_ANALYTICS_RECONCILIATION,
  MOCK_REVENUE_ANALYTICS_SPLIT,
  MOCK_REVENUE_ANALYTICS_SUMMARY,
  MOCK_REVENUE_ANALYTICS_TOP_HOLDERS,
} from "@/features/admin/mocks/admin-analytics-revenue.mock";
import { fetchAnalytics } from "./adminAnalytics.service";

export async function getRevenueAnalyticsSummary(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRevenueSummary, query, client, () => MOCK_REVENUE_ANALYTICS_SUMMARY);
}

export async function getRevenueAnalyticsEvents(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRevenueEvents, query, client, () => MOCK_REVENUE_ANALYTICS_EVENTS);
}

export async function getRevenueAnalyticsDistributions(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRevenueDistributions, query, client, () => MOCK_REVENUE_ANALYTICS_DISTRIBUTIONS);
}

export async function getRevenueAnalyticsByTrack(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRevenueByTrack, query, client, () => MOCK_REVENUE_ANALYTICS_BY_TRACK);
}

export async function getRevenueAnalyticsPayouts(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRevenuePayouts, query, client, () => MOCK_REVENUE_ANALYTICS_PAYOUTS);
}

export async function getRevenueAnalyticsPipeline(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRevenuePipeline, query, client, () => MOCK_REVENUE_ANALYTICS_PIPELINE);
}

export async function getRevenueAnalyticsSplit(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRevenueSplit, query, client, () => MOCK_REVENUE_ANALYTICS_SPLIT);
}

export async function getRevenueAnalyticsTopHolders(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRevenueTopHolders, query, client, () => MOCK_REVENUE_ANALYTICS_TOP_HOLDERS);
}

export async function getRevenueAnalyticsFailed(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRevenueFailed, query, client, () => MOCK_REVENUE_ANALYTICS_FAILED);
}

export async function getRevenueAnalyticsReconciliation(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRevenueReconciliation, query, client, () => MOCK_REVENUE_ANALYTICS_RECONCILIATION);
}
