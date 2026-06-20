import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { paginateMock } from "@/features/admin/api/paginate-mock";
import type { PaginatedResponse } from "@/features/admin/api/types";
import {
  MOCK_ADMIN_REVENUE_DETAIL,
  MOCK_ADMIN_REVENUE_EVENTS,
  MOCK_ADMIN_REVENUE_SUMMARY,
  type AdminRevenueDetail,
  type AdminRevenueListItem,
  type AdminRevenuePreview,
  type AdminRevenueSummary,
} from "@/features/admin/mocks/admin-revenue.mock";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type AdminRevenueQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  minAmount?: string;
  maxAmount?: string;
  revenueFilter?: string;
};

function revenueQueryParams(query?: AdminRevenueQuery): Record<string, string> {
  if (!query) return {};
  const out: Record<string, string> = {};
  const keys: Array<keyof AdminRevenueQuery> = [
    "page",
    "pageSize",
    "search",
    "status",
    "source",
    "dateFrom",
    "dateTo",
    "sortBy",
    "sortDir",
    "minAmount",
    "maxAmount",
    "revenueFilter",
  ];
  for (const key of keys) {
    const v = query[key];
    if (v != null && v !== "") out[key] = String(v);
  }
  return out;
}

function filterMockRevenue(items: AdminRevenueListItem[], query?: AdminRevenueQuery): AdminRevenueListItem[] {
  let rows = [...items];
  if (query?.status && query.status !== "all") {
    rows = rows.filter((r) => r.status === query.status);
  }
  if (query?.source && query.source !== "all") {
    rows = rows.filter((r) => r.source === query.source);
  }
  if (query?.search?.trim()) {
    const q = query.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.trackTitle.toLowerCase().includes(q) ||
        (r.artistName?.toLowerCase().includes(q) ?? false) ||
        (r.createdBy?.toLowerCase().includes(q) ?? false),
    );
  }
  if (query?.revenueFilter === "pending") {
    rows = rows.filter((r) => r.status === "draft" || r.status === "pending");
  }
  if (query?.revenueFilter === "failed") {
    rows = rows.filter((r) => r.status === "failed");
  }
  if (query?.revenueFilter === "completed") {
    rows = rows.filter((r) => r.status === "completed" || r.status === "paid");
  }
  if (query?.revenueFilter === "manual_review") {
    rows = rows.filter((r) => r.status === "manual_review");
  }
  if (query?.sortBy === "amount") {
    rows.sort((a, b) => Number(b.grossRevenueUsdt) - Number(a.grossRevenueUsdt));
  } else if (query?.sortBy === "track") {
    rows.sort((a, b) => a.trackTitle.localeCompare(b.trackTitle, "ru"));
  } else if (query?.sortBy === "failed_first") {
    rows.sort((a, b) => (a.status === "failed" ? -1 : 1) - (b.status === "failed" ? -1 : 1));
  } else if (query?.sortBy === "pending_first") {
    rows.sort((a, b) => (a.status === "draft" ? -1 : 1) - (b.status === "draft" ? -1 : 1));
  }
  return rows;
}

async function getRevenuePaginatedLive(
  client: AdminApiClient,
  query?: AdminRevenueQuery,
): Promise<PaginatedResponse<AdminRevenueListItem>> {
  const params = revenueQueryParams(query);
  const qs = new URLSearchParams(params).toString();
  const path = qs ? `${ADMIN_API_PATHS.revenueEvents}?${qs}` : ADMIN_API_PATHS.revenueEvents;
  return client.get<PaginatedResponse<AdminRevenueListItem>>(path);
}

export async function getAdminRevenueSummary(
  client?: AdminApiClient,
  query?: AdminRevenueQuery,
): Promise<AdminRevenueSummary> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const params = revenueQueryParams(query);
    const qs = new URLSearchParams(params).toString();
    const path = qs
      ? `${ADMIN_API_PATHS.revenueEventsSummary}?${qs}`
      : ADMIN_API_PATHS.revenueEventsSummary;
    return client.get<AdminRevenueSummary>(path);
  }
  await adminMockDelay();
  return { ...MOCK_ADMIN_REVENUE_SUMMARY };
}

export async function listAdminRevenueEventsPaginated(
  query?: AdminRevenueQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminRevenueListItem>> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return getRevenuePaginatedLive(client, query);
  }
  await adminMockDelay();
  const filtered = filterMockRevenue(MOCK_ADMIN_REVENUE_EVENTS, query);
  return paginateMock(filtered, query);
}

export async function getAdminRevenueEvent(
  id: string,
  client?: AdminApiClient,
  include = "preview,payouts,ledger,audit",
): Promise<AdminRevenueDetail | null> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminRevenueDetail>(`${ADMIN_API_PATHS.revenueEvent(id)}?include=${include}`);
  }
  await adminMockDelay(200);
  const row = MOCK_ADMIN_REVENUE_EVENTS.find((r) => r.id === id);
  if (!row) return null;
  if (id === MOCK_ADMIN_REVENUE_DETAIL.id) return { ...MOCK_ADMIN_REVENUE_DETAIL };
  return {
    ...row,
    asset: "USDT",
    note: null,
    preview: row.status === "preview" || row.status === "draft" ? MOCK_ADMIN_REVENUE_DETAIL.preview : undefined,
    payouts: row.status === "completed" ? MOCK_ADMIN_REVENUE_DETAIL.payouts : undefined,
    ledger: row.status === "completed" ? MOCK_ADMIN_REVENUE_DETAIL.ledger : undefined,
    audit: MOCK_ADMIN_REVENUE_DETAIL.audit,
  };
}

export async function createAdminRevenueEvent(
  body: {
    trackId: string;
    grossRevenue: string;
    source?: string;
    periodFrom: string;
    periodTo: string;
    note?: string;
  },
  client?: AdminApiClient,
): Promise<AdminRevenueListItem> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post<AdminRevenueListItem>(ADMIN_API_PATHS.revenueEvents, body);
  }
  await adminMockDelay(300);
  return {
    id: `rev-${Date.now()}`,
    trackId: body.trackId,
    trackTitle: body.trackId,
    artistName: null,
    coverUrl: null,
    releaseStatus: "active",
    periodFrom: body.periodFrom,
    periodTo: body.periodTo,
    source: body.source ?? "manual",
    grossRevenueUsdt: body.grossRevenue,
    platformShareUsdt: "0",
    artistShareUsdt: "0",
    holdersShareUsdt: "0",
    distributedAmountUsdt: "0",
    holdersCount: 0,
    status: "draft",
    distributionId: null,
    errorMessage: null,
    createdBy: "ops@spliton.demo",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

export async function previewAdminDistribution(
  revenueEventId: string,
  client?: AdminApiClient,
): Promise<AdminRevenuePreview> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post<AdminRevenuePreview>(ADMIN_API_PATHS.distributionsPreview, { revenueEventId });
  }
  await adminMockDelay(200);
  return MOCK_ADMIN_REVENUE_DETAIL.preview!;
}

export async function saveAdminDistributionPreview(
  revenueEventId: string,
  client?: AdminApiClient,
): Promise<{ ok: boolean; status: string }> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(ADMIN_API_PATHS.distributionsPreviewSave, { revenueEventId });
  }
  await adminMockDelay(200);
  return { ok: true, status: "calculated" };
}

export async function submitAdminRevenueForReview(
  revenueEventId: string,
  client?: AdminApiClient,
): Promise<{ ok: boolean; status: string }> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(ADMIN_API_PATHS.revenueEventSubmitReview(revenueEventId));
  }
  await adminMockDelay(200);
  return { ok: true, status: "review" };
}

export async function approveAdminRevenueDistribution(
  revenueEventId: string,
  client?: AdminApiClient,
): Promise<{ ok: boolean; status: string }> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(ADMIN_API_PATHS.revenueEventApprove(revenueEventId));
  }
  await adminMockDelay(200);
  return { ok: true, status: "approved" };
}

export async function cancelAdminRevenueEvent(
  revenueEventId: string,
  note: string | undefined,
  client?: AdminApiClient,
): Promise<{ ok: boolean; status: string }> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(ADMIN_API_PATHS.revenueEventCancel(revenueEventId), { note });
  }
  await adminMockDelay(200);
  return { ok: true, status: "cancelled" };
}

export async function retryAdminRevenueDistribution(
  revenueEventId: string,
  client?: AdminApiClient,
): Promise<{ ok: boolean; status: string }> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(ADMIN_API_PATHS.revenueEventRetry(revenueEventId));
  }
  await adminMockDelay(200);
  return { ok: true, status: "approved" };
}

function distributionRunIdempotencyKey(revenueEventId: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `dist-${revenueEventId}-${crypto.randomUUID()}`;
  }
  return `dist-${revenueEventId}-${Date.now()}`;
}

export async function runAdminDistribution(
  revenueEventId: string,
  note: string | undefined,
  client?: AdminApiClient,
  idempotencyKey?: string,
) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const key = idempotencyKey ?? distributionRunIdempotencyKey(revenueEventId);
    return client.post(
      ADMIN_API_PATHS.distributionsRun,
      { revenueEventId, note, idempotencyKey: key },
      { "Idempotency-Key": key },
    );
  }
  await adminMockDelay(300);
  return { ok: true, revenueEventId, status: "paid" };
}

export type { AdminRevenuePreview, AdminRevenueDetail, AdminRevenueListItem, AdminRevenueSummary };
