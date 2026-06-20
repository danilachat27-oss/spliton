import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import type { AnalyticsQuery } from "@/features/admin/analytics/types";
import {
  MOCK_TRACK_ANALYTICS_HOLDERS,
  MOCK_TRACK_ANALYTICS_READINESS,
  MOCK_TRACK_ANALYTICS_REVENUE,
  MOCK_TRACK_ANALYTICS_ROUND_PROGRESS,
  MOCK_TRACK_ANALYTICS_SECONDARY,
  MOCK_TRACK_ANALYTICS_SUMMARY,
  MOCK_TRACK_ANALYTICS_TOP,
  MOCK_TRACK_ANALYTICS_UNITS,
} from "@/features/admin/mocks/admin-analytics-tracks.mock";
import { fetchAnalytics } from "./adminAnalytics.service";

export async function getTrackAnalyticsSummary(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsTracksSummary, query, client, () => MOCK_TRACK_ANALYTICS_SUMMARY);
}

export async function getTrackAnalyticsRoundProgress(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsTracksRoundProgress, query, client, () => MOCK_TRACK_ANALYTICS_ROUND_PROGRESS);
}

export async function getTrackAnalyticsRevenue(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsTracksRevenue, query, client, () => MOCK_TRACK_ANALYTICS_REVENUE);
}

export async function getTrackAnalyticsHolders(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsTracksHolders, query, client, () => MOCK_TRACK_ANALYTICS_HOLDERS);
}

export async function getTrackAnalyticsSecondaryActivity(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsTracksSecondaryActivity, query, client, () => MOCK_TRACK_ANALYTICS_SECONDARY);
}

export async function getTrackAnalyticsUnits(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsTracksUnits, query, client, () => MOCK_TRACK_ANALYTICS_UNITS);
}

export async function getTrackAnalyticsReadiness(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsTracksReadiness, query, client, () => MOCK_TRACK_ANALYTICS_READINESS);
}

export async function getTrackAnalyticsTop(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsTracksTop, query, client, () => MOCK_TRACK_ANALYTICS_TOP);
}
