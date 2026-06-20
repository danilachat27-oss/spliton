import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import type { AnalyticsQuery } from "@/features/admin/analytics/types";
import {
  MOCK_RISK_ANALYTICS_BY_SEVERITY,
  MOCK_RISK_ANALYTICS_BY_TYPE,
  MOCK_RISK_ANALYTICS_FREEZE,
  MOCK_RISK_ANALYTICS_HIGH_VALUE,
  MOCK_RISK_ANALYTICS_QUEUE,
  MOCK_RISK_ANALYTICS_QUEUE_AGING,
  MOCK_RISK_ANALYTICS_REPEAT,
  MOCK_RISK_ANALYTICS_RESOLUTION,
  MOCK_RISK_ANALYTICS_RULES,
  MOCK_RISK_ANALYTICS_SUMMARY,
} from "@/features/admin/mocks/admin-analytics-risk.mock";
import { fetchAnalytics } from "./adminAnalytics.service";

export async function getRiskAnalyticsSummary(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRiskSummary, query, client, () => MOCK_RISK_ANALYTICS_SUMMARY);
}

export async function getRiskAnalyticsBySeverity(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRiskBySeverity, query, client, () => MOCK_RISK_ANALYTICS_BY_SEVERITY);
}

export async function getRiskAnalyticsByType(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRiskByType, query, client, () => MOCK_RISK_ANALYTICS_BY_TYPE);
}

export async function getRiskAnalyticsQueueAging(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRiskQueueAging, query, client, () => MOCK_RISK_ANALYTICS_QUEUE_AGING);
}

export async function getRiskAnalyticsHighValueOperations(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRiskHighValueOperations, query, client, () => MOCK_RISK_ANALYTICS_HIGH_VALUE);
}

export async function getRiskAnalyticsQueue(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRiskQueue, query, client, () => MOCK_RISK_ANALYTICS_QUEUE);
}

export async function getRiskAnalyticsRulesPerformance(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRiskRulesPerformance, query, client, () => MOCK_RISK_ANALYTICS_RULES);
}

export async function getRiskAnalyticsRepeatOffenders(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRiskRepeatOffenders, query, client, () => MOCK_RISK_ANALYTICS_REPEAT);
}

export async function getRiskAnalyticsFreezeImpact(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRiskFreezeImpact, query, client, () => MOCK_RISK_ANALYTICS_FREEZE);
}

export async function getRiskAnalyticsResolutionQuality(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsRiskResolutionQuality, query, client, () => MOCK_RISK_ANALYTICS_RESOLUTION);
}
