import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { paginateMock } from "@/features/admin/api/paginate-mock";
import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";
import {
  MOCK_ADMIN_LISTINGS,
  MOCK_ADMIN_SECONDARY_FEES,
  MOCK_ADMIN_SECONDARY_LIQUIDITY,
  MOCK_ADMIN_SECONDARY_SUMMARY,
  MOCK_ADMIN_TRADES,
  mockListingDetail,
  mockTradeDetail,
  type AdminListingDetail,
  type AdminListingListItem,
  type AdminListingStatus,
  type AdminSecondaryMarketFees,
  type AdminSecondaryMarketLiquidity,
  type AdminSecondaryMarketSummary,
  type AdminTradeDetail,
  type AdminTradeListItem,
  type AdminTradeStatus,
} from "@/features/admin/mocks/admin-secondary-market.mock";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type SecondaryMarketQuery = AdminListQuery & {
  period?: string;
  releaseId?: string;
  sellerId?: string;
  buyerId?: string;
  minAmount?: string;
  maxAmount?: string;
  minUnits?: string;
  maxUnits?: string;
  marketFilter?: string;
  include?: string;
};

function mapListing(row: Record<string, unknown>): AdminListingListItem {
  const statusRaw = String(row.status ?? "active");
  const status = (statusRaw === "paused" ? "frozen" : statusRaw) as AdminListingStatus;
  return {
    id: String(row.id),
    sellerId: String(row.sellerId ?? ""),
    sellerEmail: String(row.sellerEmail ?? ""),
    sellerStatus: String(row.sellerStatus ?? "active"),
    releaseId: String(row.releaseId ?? ""),
    trackTitle: String(row.trackTitle ?? ""),
    artistName: row.artistName != null ? String(row.artistName) : null,
    coverUrl: row.coverUrl != null ? String(row.coverUrl) : null,
    releaseStatus: String(row.releaseStatus ?? "active"),
    units: String(row.units ?? row.unitsAvailable ?? "0"),
    unitsTotal: String(row.unitsTotal ?? row.units ?? "0"),
    lockedUnits: String(row.lockedUnits ?? "0"),
    pricePerUnitUsdt: String(row.pricePerUnitUsdt ?? row.pricePerUnit ?? "0").replace(",", "."),
    totalPriceUsdt: String(row.totalPriceUsdt ?? "0").replace(",", "."),
    platformFeeEstimateUsdt: String(row.platformFeeEstimateUsdt ?? "0").replace(",", "."),
    status,
    hasRisk: Boolean(row.hasRisk),
    isLocked: Boolean(row.isLocked),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt ?? row.createdAt),
    expiresAt: row.expiresAt != null ? String(row.expiresAt) : null,
  };
}

function mapTrade(row: Record<string, unknown>): AdminTradeListItem {
  const suspicious = Boolean(row.suspicious);
  const statusRaw = suspicious ? "suspicious" : String(row.status ?? "pending");
  return {
    id: String(row.id),
    listingId: row.listingId != null ? String(row.listingId) : null,
    sellerId: String(row.sellerId ?? ""),
    sellerEmail: String(row.sellerEmail ?? ""),
    buyerId: String(row.buyerId ?? ""),
    buyerEmail: String(row.buyerEmail ?? ""),
    releaseId: String(row.releaseId ?? ""),
    trackTitle: String(row.trackTitle ?? ""),
    artistName: row.artistName != null ? String(row.artistName) : null,
    coverUrl: row.coverUrl != null ? String(row.coverUrl) : null,
    units: String(row.units ?? "0"),
    pricePerUnitUsdt: String(row.pricePerUnitUsdt ?? "0").replace(",", "."),
    priceUsdt: String(row.priceUsdt ?? row.grossAmount ?? "0").replace(",", "."),
    feeUsdt: String(row.feeUsdt ?? "0").replace(",", "."),
    status: statusRaw as AdminTradeStatus,
    settlementStatus: String(row.settlementStatus ?? row.status ?? "pending"),
    suspicious,
    completedAt: String(row.completedAt ?? row.executedAt ?? row.createdAt),
    createdAt: String(row.createdAt ?? row.executedAt ?? ""),
  };
}

function filterMockListings(query?: SecondaryMarketQuery): AdminListingListItem[] {
  let items = [...MOCK_ADMIN_LISTINGS];
  if (query?.marketFilter === "frozen") items = items.filter((i) => i.status === "frozen");
  else if (query?.marketFilter === "frozen_cancelled")
    items = items.filter((i) => i.status === "frozen" || i.status === "cancelled");
  else if (query?.marketFilter === "cancelled") items = items.filter((i) => i.status === "cancelled");
  else if (query?.marketFilter === "active") items = items.filter((i) => i.status === "active");
  if (query?.search) {
    const q = query.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.sellerEmail.toLowerCase().includes(q) ||
        i.trackTitle.toLowerCase().includes(q),
    );
  }
  return items;
}

function filterMockTrades(query?: SecondaryMarketQuery): AdminTradeListItem[] {
  let items = [...MOCK_ADMIN_TRADES];
  if (query?.marketFilter === "suspicious" || query?.status === "suspicious") {
    items = items.filter((i) => i.suspicious);
  }
  if (query?.marketFilter === "high_value") {
    items = items.filter((i) => Number(i.priceUsdt) >= 500);
  }
  if (query?.search) {
    const q = query.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.buyerEmail.toLowerCase().includes(q) ||
        i.sellerEmail.toLowerCase().includes(q) ||
        i.trackTitle.toLowerCase().includes(q),
    );
  }
  return items;
}

export async function getAdminSecondaryMarketSummary(
  query?: SecondaryMarketQuery,
  client?: AdminApiClient,
): Promise<AdminSecondaryMarketSummary> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminSecondaryMarketSummary>(ADMIN_API_PATHS.secondaryMarketSummary, query);
  }
  await adminMockDelay();
  return MOCK_ADMIN_SECONDARY_SUMMARY;
}

export async function getAdminSecondaryMarketLiquidity(
  query?: SecondaryMarketQuery,
  client?: AdminApiClient,
): Promise<AdminSecondaryMarketLiquidity> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminSecondaryMarketLiquidity>(ADMIN_API_PATHS.secondaryMarketLiquidity, query);
  }
  await adminMockDelay();
  return MOCK_ADMIN_SECONDARY_LIQUIDITY;
}

export async function getAdminSecondaryMarketFees(
  query?: SecondaryMarketQuery,
  client?: AdminApiClient,
): Promise<AdminSecondaryMarketFees> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminSecondaryMarketFees>(ADMIN_API_PATHS.secondaryMarketFees, query);
  }
  await adminMockDelay();
  return MOCK_ADMIN_SECONDARY_FEES;
}

export async function listAdminListingsPaginated(
  query?: SecondaryMarketQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminListingListItem>> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const res = await client.getPaginated<Record<string, unknown>>(ADMIN_API_PATHS.listings, query);
    return { ...res, items: res.items.map(mapListing) };
  }
  await adminMockDelay();
  return paginateMock(filterMockListings(query), query);
}

export async function getAdminListing(
  id: string,
  include?: string,
  client?: AdminApiClient,
): Promise<AdminListingDetail | null> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const q = (include ? { include } : { include: "trades,ledger,risk,audit" }) as SecondaryMarketQuery;
    const row = await client.get<Record<string, unknown>>(ADMIN_API_PATHS.listing(id), q);
    return {
      ...mapListing(row),
      trades: row.trades as AdminListingDetail["trades"],
      ledger: row.ledger as AdminListingDetail["ledger"],
      risk: row.risk as AdminListingDetail["risk"],
      audit: row.audit as AdminListingDetail["audit"],
      unitsDetail: row.unitsDetail as AdminListingDetail["unitsDetail"],
    };
  }
  await adminMockDelay();
  return mockListingDetail(id);
}

export async function listAdminTradesPaginated(
  query?: SecondaryMarketQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminTradeListItem>> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const res = await client.getPaginated<Record<string, unknown>>(ADMIN_API_PATHS.trades, query);
    return { ...res, items: res.items.map(mapTrade) };
  }
  await adminMockDelay();
  return paginateMock(filterMockTrades(query), query);
}

export async function getAdminTrade(
  id: string,
  include?: string,
  client?: AdminApiClient,
): Promise<AdminTradeDetail | null> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const q: SecondaryMarketQuery = include
      ? { include }
      : { include: "settlement,ledger,risk,audit" };
    const row = await client.get<Record<string, unknown>>(ADMIN_API_PATHS.trade(id), q);
    return {
      ...mapTrade(row),
      settlement: row.settlement as AdminTradeDetail["settlement"],
      ledger: row.ledger as AdminTradeDetail["ledger"],
      risk: row.risk as AdminTradeDetail["risk"],
      audit: row.audit as AdminTradeDetail["audit"],
    };
  }
  await adminMockDelay();
  return mockTradeDetail(id);
}

export async function freezeAdminListing(
  id: string,
  note: string | undefined,
  client?: AdminApiClient,
): Promise<void> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    await client.post(ADMIN_API_PATHS.listing(id) + "/freeze", { note });
    return;
  }
  await adminMockDelay(200);
}

export async function releaseAdminListing(
  id: string,
  note: string | undefined,
  client?: AdminApiClient,
): Promise<void> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    await client.post(ADMIN_API_PATHS.listing(id) + "/release", { note });
    return;
  }
  await adminMockDelay(200);
}

export async function cancelAdminListing(
  id: string,
  note: string | undefined,
  client?: AdminApiClient,
): Promise<void> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    await client.post(ADMIN_API_PATHS.listing(id) + "/cancel", { note });
    return;
  }
  await adminMockDelay(200);
}

export async function markAdminTradeSuspicious(
  id: string,
  note: string | undefined,
  client?: AdminApiClient,
): Promise<void> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    await client.post(ADMIN_API_PATHS.trade(id) + "/mark-suspicious", { note });
    return;
  }
  await adminMockDelay(200);
}
