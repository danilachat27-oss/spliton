import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { paginateMock } from "@/features/admin/api/paginate-mock";
import type { PaginatedResponse } from "@/features/admin/api/types";
import {
  MOCK_ADMIN_DEPOSIT_DETAIL,
  MOCK_ADMIN_DEPOSITS,
  MOCK_ADMIN_DEPOSITS_SUMMARY,
  type AdminDepositDetail,
  type AdminDepositListItem,
  type AdminDepositSummary,
} from "@/features/admin/mocks/admin-deposits.mock";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type AdminDepositsQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  asset?: string;
  network?: string;
  minAmount?: string;
  maxAmount?: string;
  minConfirmations?: string;
  depositFilter?: string;
};

function depositsQueryParams(query?: AdminDepositsQuery): Record<string, string> {
  if (!query) return {};
  const out: Record<string, string> = {};
  const entries: Array<[keyof AdminDepositsQuery, string]> = [
    ["page", "page"],
    ["pageSize", "pageSize"],
    ["search", "search"],
    ["status", "status"],
    ["dateFrom", "dateFrom"],
    ["dateTo", "dateTo"],
    ["sortBy", "sortBy"],
    ["sortDir", "sortDir"],
    ["asset", "asset"],
    ["network", "network"],
    ["minAmount", "minAmount"],
    ["maxAmount", "maxAmount"],
    ["minConfirmations", "minConfirmations"],
    ["depositFilter", "depositFilter"],
  ];
  for (const [key] of entries) {
    const v = query[key];
    if (v != null && v !== "") out[key] = String(v);
  }
  return out;
}

function filterMockDeposits(items: AdminDepositListItem[], query?: AdminDepositsQuery): AdminDepositListItem[] {
  let rows = [...items];
  if (query?.search?.trim()) {
    const q = query.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.userEmail.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.txHash?.toLowerCase().includes(q) ?? false) ||
        r.depositAddress.toLowerCase().includes(q),
    );
  }
  if (query?.status && query.status !== "all") {
    rows = rows.filter((d) => d.status === query.status);
  }
  if (query?.depositFilter === "manual_review") {
    rows = rows.filter((d) => d.status === "manual_review");
  }
  if (query?.depositFilter === "high_value") {
    rows = rows.filter((d) => d.isHighValue);
  }
  if (query?.depositFilter === "failed") {
    rows = rows.filter((d) => d.status === "failed" || d.status === "rejected");
  }
  if (query?.depositFilter === "no_tx_hash") {
    rows = rows.filter((d) => !d.hasTxHash);
  }
  return rows;
}

async function getDepositsPaginatedLive(
  client: AdminApiClient,
  query?: AdminDepositsQuery,
): Promise<PaginatedResponse<AdminDepositListItem>> {
  const params = depositsQueryParams(query);
  const qs = new URLSearchParams(params).toString();
  const path = qs ? `${ADMIN_API_PATHS.deposits}?${qs}` : ADMIN_API_PATHS.deposits;
  return client.get<PaginatedResponse<AdminDepositListItem>>(path);
}

export async function getAdminDepositsSummary(
  client?: AdminApiClient,
  query?: AdminDepositsQuery,
): Promise<AdminDepositSummary> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const params = depositsQueryParams(query);
    const qs = new URLSearchParams(params).toString();
    const path = qs ? `${ADMIN_API_PATHS.deposits}/summary?${qs}` : `${ADMIN_API_PATHS.deposits}/summary`;
    return client.get<AdminDepositSummary>(path);
  }
  await adminMockDelay();
  return MOCK_ADMIN_DEPOSITS_SUMMARY;
}

export async function listAdminDepositsPaginated(
  query?: AdminDepositsQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminDepositListItem>> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return getDepositsPaginatedLive(client, query);
  }
  await adminMockDelay();
  return paginateMock(filterMockDeposits(MOCK_ADMIN_DEPOSITS, query), query);
}

export async function getAdminDeposit(
  id: string,
  client?: AdminApiClient,
  include = "ledger,audit,user",
): Promise<AdminDepositDetail | null> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminDepositDetail>(`${ADMIN_API_PATHS.deposit(id)}?include=${include}`);
  }
  await adminMockDelay(120);
  if (id === MOCK_ADMIN_DEPOSIT_DETAIL.id) return { ...MOCK_ADMIN_DEPOSIT_DETAIL };
  const row = MOCK_ADMIN_DEPOSITS.find((d) => d.id === id);
  if (!row) return null;
  return {
    ...MOCK_ADMIN_DEPOSIT_DETAIL,
    ...row,
    fromAddress: "TSenderDemo",
    receivedAt: row.completedAt,
  };
}

export async function patchAdminDepositStatus(
  id: string,
  status: string,
  note: string | undefined,
  client?: AdminApiClient,
): Promise<AdminDepositListItem> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.patch<AdminDepositListItem>(`${ADMIN_API_PATHS.deposit(id)}/status`, { status, note });
  }
  await adminMockDelay(200);
  const d = MOCK_ADMIN_DEPOSITS.find((x) => x.id === id);
  if (!d) throw new Error("Deposit not found");
  return { ...d, status: status as AdminDepositListItem["status"] };
}

export async function reviewAdminDeposit(
  id: string,
  note: string | undefined,
  client?: AdminApiClient,
): Promise<AdminDepositListItem> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post<AdminDepositListItem>(`${ADMIN_API_PATHS.deposit(id)}/review`, { note });
  }
  return patchAdminDepositStatus(id, "manual_review", note, client);
}

export async function reconcileAdminDeposit(
  id: string,
  note: string | undefined,
  client?: AdminApiClient,
): Promise<AdminDepositListItem> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post<AdminDepositListItem>(`${ADMIN_API_PATHS.deposit(id)}/reconcile`, { note });
  }
  return patchAdminDepositStatus(id, "completed", note, client);
}
