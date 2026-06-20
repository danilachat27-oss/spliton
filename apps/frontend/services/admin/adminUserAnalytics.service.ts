import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";

import type { AdminApiClient } from "@/features/admin/api/admin-api-client";

import type { AnalyticsQuery } from "@/features/admin/analytics/types";

import {

  MOCK_USER_ANALYTICS_FUNNEL,

  MOCK_USER_ANALYTICS_GROWTH,

  MOCK_USER_ANALYTICS_SEGMENTS,

  MOCK_USER_ANALYTICS_SUMMARY,

  MOCK_USER_DORMANT,

  MOCK_USER_FINANCIAL_SEGMENTS,

  MOCK_USER_RISK_USERS,

  MOCK_USER_TOP_HOLDERS,

} from "@/features/admin/mocks/admin-analytics-users.mock";

import { fetchAnalytics } from "./adminAnalytics.service";



export async function getUserAnalyticsSummary(query?: AnalyticsQuery, client?: AdminApiClient) {

  return fetchAnalytics(ADMIN_API_PATHS.analyticsUsersSummary, query, client, () => ({

    ...MOCK_USER_ANALYTICS_SUMMARY,

  }));

}



export async function getUserAnalyticsGrowth(query?: AnalyticsQuery, client?: AdminApiClient) {

  return fetchAnalytics(ADMIN_API_PATHS.analyticsUsersGrowth, query, client, () => ({

    ...MOCK_USER_ANALYTICS_GROWTH,

  }));

}



export async function getUserAnalyticsFunnel(query?: AnalyticsQuery, client?: AdminApiClient) {

  return fetchAnalytics(ADMIN_API_PATHS.analyticsUsersFunnel, query, client, () => ({

    ...MOCK_USER_ANALYTICS_FUNNEL,

  }));

}



export async function getUserAnalyticsSegments(query?: AnalyticsQuery, client?: AdminApiClient) {

  return fetchAnalytics(ADMIN_API_PATHS.analyticsUsersSegments, query, client, () => ({

    ...MOCK_USER_ANALYTICS_SEGMENTS,

  }));

}



export async function getUserAnalyticsFinancialSegments(

  query?: AnalyticsQuery,

  client?: AdminApiClient,

) {

  return fetchAnalytics(ADMIN_API_PATHS.analyticsUsersFinancialSegments, query, client, () => ({

    ...MOCK_USER_FINANCIAL_SEGMENTS,

  }));

}



export async function getUserAnalyticsDormant(query?: AnalyticsQuery, client?: AdminApiClient) {

  return fetchAnalytics(ADMIN_API_PATHS.analyticsUsersDormant, query, client, () => ({

    ...MOCK_USER_DORMANT,

  }));

}



export async function getUserAnalyticsRiskUsers(query?: AnalyticsQuery, client?: AdminApiClient) {

  return fetchAnalytics(ADMIN_API_PATHS.analyticsUsersRiskUsers, query, client, () => ({

    ...MOCK_USER_RISK_USERS,

  }));

}



export async function getUserAnalyticsTopHolders(query?: AnalyticsQuery, client?: AdminApiClient) {

  return fetchAnalytics(ADMIN_API_PATHS.analyticsUsersTopHolders, query, client, () => ({

    ...MOCK_USER_TOP_HOLDERS,

  }));

}

