import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { paginateMock } from "@/features/admin/api/paginate-mock";
import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";
import {
  MOCK_ADMIN_HOLDINGS,
  MOCK_ADMIN_HOLDING_DETAIL,
  MOCK_ADMIN_HOLDINGS_SUMMARY,
  type AdminHoldingDetail,
  type AdminHoldingListItem,
  type AdminHoldingSummary,
} from "@/features/admin/mocks/admin-holdings.mock";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type AdminHoldingsQuery = AdminListQuery & {
  minUnits?: string;
  maxUnits?: string;
  minValue?: string;
  maxValue?: string;
  holdingFilter?: string;
  releaseStatus?: string;
};

function filterMockHoldings(items: AdminHoldingListItem[], query?: AdminHoldingsQuery): AdminHoldingListItem[] {
  let rows = [...items];
  if (query?.search?.trim()) {
    const q = query.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.userEmail.toLowerCase().includes(q) ||
        r.userId.toLowerCase().includes(q) ||
        r.trackTitle.toLowerCase().includes(q) ||
        (r.userDisplayName?.toLowerCase().includes(q) ?? false),
    );
  }
  if (query?.holdingFilter === "locked") {
    rows = rows.filter((r) => Number(r.lockedUnits) > 0);
  }
  if (query?.holdingFilter === "listing") {
    rows = rows.filter((r) => r.activeListingsCount > 0);
  }
  if (query?.holdingFilter === "earned") {
    rows = rows.filter((r) => Number(r.earnedTotalUsdt.replace(/\s/g, "")) > 0);
  }
  if (query?.holdingFilter === "risk") {
    rows = rows.filter((r) => r.hasRiskFlag);
  }
  if (query?.releaseStatus && query.releaseStatus !== "all") {
    rows = rows.filter((r) => r.trackStatus === query.releaseStatus);
  }
  return rows;
}

export async function getAdminHoldingsSummary(client?: AdminApiClient): Promise<AdminHoldingSummary> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminHoldingSummary>(`${ADMIN_API_PATHS.holdings}/summary`);
  }
  await adminMockDelay();
  return MOCK_ADMIN_HOLDINGS_SUMMARY;
}

export async function listAdminHoldingsPaginated(
  query?: AdminHoldingsQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminHoldingListItem>> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.getPaginated<AdminHoldingListItem>(ADMIN_API_PATHS.holdings, query);
  }
  await adminMockDelay();
  return paginateMock(filterMockHoldings(MOCK_ADMIN_HOLDINGS, query), query);
}

export async function getAdminHolding(
  id: string,
  client?: AdminApiClient,
  include = "history,distributions,market,wallet,risk",
): Promise<AdminHoldingDetail> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminHoldingDetail>(`${ADMIN_API_PATHS.holdings}/${id}?include=${include}`);
  }
  await adminMockDelay();
  const row = MOCK_ADMIN_HOLDINGS.find((x) => x.id === id);
  if (!row) return MOCK_ADMIN_HOLDING_DETAIL;
  return { ...MOCK_ADMIN_HOLDING_DETAIL, ...row };
}
