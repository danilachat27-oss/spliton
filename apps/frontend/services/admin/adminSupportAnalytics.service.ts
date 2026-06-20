import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import type { AnalyticsQuery } from "@/features/admin/analytics/types";
import {
  MOCK_SUPPORT_ANALYTICS_SUMMARY,
  MOCK_SUPPORT_BY_CATEGORY,
  MOCK_SUPPORT_BY_STATUS,
  MOCK_SUPPORT_ESCALATIONS,
  MOCK_SUPPORT_FINANCE,
  MOCK_SUPPORT_PAIN_POINTS,
  MOCK_SUPPORT_QUEUE,
  MOCK_SUPPORT_RESOLUTION,
  MOCK_SUPPORT_RESPONSE_TIME,
  MOCK_SUPPORT_SLA,
  MOCK_SUPPORT_WORKLOAD,
} from "@/features/admin/mocks/admin-analytics-support.mock";
import { fetchAnalytics } from "./adminAnalytics.service";

export async function getSupportAnalyticsSummary(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsSupportSummary, query, client, () => MOCK_SUPPORT_ANALYTICS_SUMMARY);
}

export async function getSupportAnalyticsByStatus(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsSupportByStatus, query, client, () => MOCK_SUPPORT_BY_STATUS);
}

export async function getSupportAnalyticsByCategory(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsSupportByCategory, query, client, () => MOCK_SUPPORT_BY_CATEGORY);
}

export async function getSupportAnalyticsResponseTime(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsSupportResponseTime, query, client, () => MOCK_SUPPORT_RESPONSE_TIME);
}

export async function getSupportAnalyticsByManager(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsSupportWorkload, query, client, () => MOCK_SUPPORT_WORKLOAD);
}

export async function getSupportAnalyticsQueue(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsSupportQueue, query, client, () => MOCK_SUPPORT_QUEUE);
}

export async function getSupportAnalyticsSla(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsSupportSla, query, client, () => MOCK_SUPPORT_SLA);
}

export async function getSupportAnalyticsFinanceRelated(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsSupportFinanceRelated, query, client, () => MOCK_SUPPORT_FINANCE);
}

export async function getSupportAnalyticsEscalations(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsSupportEscalations, query, client, () => MOCK_SUPPORT_ESCALATIONS);
}

export async function getSupportAnalyticsWorkload(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsSupportWorkload, query, client, () => MOCK_SUPPORT_WORKLOAD);
}

export async function getSupportAnalyticsResolutionQuality(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(
    ADMIN_API_PATHS.analyticsSupportResolutionQuality,
    query,
    client,
    () => MOCK_SUPPORT_RESOLUTION,
  );
}

export async function getSupportAnalyticsProductPainPoints(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(
    ADMIN_API_PATHS.analyticsSupportProductPainPoints,
    query,
    client,
    () => MOCK_SUPPORT_PAIN_POINTS,
  );
}
