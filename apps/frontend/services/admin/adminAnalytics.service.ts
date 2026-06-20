import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import type { AnalyticsQuery } from "@/features/admin/analytics/types";
import { buildAnalyticsQueryString } from "./admin-analytics-query.util";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";
import { getAdminDashboardTrends } from "./adminDashboard.service";

export async function fetchAnalytics<T>(
  path: string,
  query: AnalyticsQuery | undefined,
  client: AdminApiClient | undefined,
  mock: () => T | Promise<T>,
): Promise<T> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<T>(`${path}${buildAnalyticsQueryString(query)}`);
  }
  await adminMockDelay(180);
  return mock();
}
export async function getAdminAnalyticsOverview(
  query: AnalyticsQuery | undefined,
  client?: AdminApiClient,
) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsOverview, query, client, () => ({
    finance: null,
    users: null,
    market: null,
    risk: null,
    support: null,
    tracks: null,
    revenue: null,
  }));
}

export { getAdminDashboardTrends };
