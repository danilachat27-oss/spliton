import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";

import type { AdminApiClient } from "@/features/admin/api/admin-api-client";

import { paginateMock } from "@/features/admin/api/paginate-mock";

import type { PaginatedResponse } from "@/features/admin/api/types";

import {

  MOCK_ADMIN_WITHDRAWAL_DETAIL,

  MOCK_ADMIN_WITHDRAWALS,

  MOCK_ADMIN_WITHDRAWALS_SUMMARY,

  type AdminWithdrawalDetail,

  type AdminWithdrawalListItem,

  type AdminWithdrawalSummary,

} from "@/features/admin/mocks/admin-withdrawals.mock";

import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";



export type AdminWithdrawalsQuery = {

  page?: number;

  pageSize?: number;

  search?: string;

  status?: string;

  dateFrom?: string;

  dateTo?: string;

  sortBy?: string;

  sortDir?: "asc" | "desc";

  minAmount?: string;

  maxAmount?: string;

  withdrawalFilter?: string;

};



function withdrawalsQueryParams(query?: AdminWithdrawalsQuery): Record<string, string> {

  if (!query) return {};

  const out: Record<string, string> = {};

  const keys: Array<keyof AdminWithdrawalsQuery> = [

    "page",

    "pageSize",

    "search",

    "status",

    "dateFrom",

    "dateTo",

    "sortBy",

    "sortDir",

    "minAmount",

    "maxAmount",

    "withdrawalFilter",

  ];

  for (const key of keys) {

    const v = query[key];

    if (v != null && v !== "") out[key] = String(v);

  }

  return out;

}



function normalizeStatusFilter(status?: string): string | undefined {

  if (!status || status === "all") return undefined;

  if (status === "requested") return "pending";

  return status;

}



function filterMockWithdrawals(

  items: AdminWithdrawalListItem[],

  query?: AdminWithdrawalsQuery,

): AdminWithdrawalListItem[] {

  let rows = [...items];

  const status = normalizeStatusFilter(query?.status);

  if (status) {

    rows = rows.filter((w) => w.status === status);

  }

  if (query?.search?.trim()) {

    const q = query.search.trim().toLowerCase();

    rows = rows.filter(

      (r) =>

        r.userEmail.toLowerCase().includes(q) ||

        r.id.toLowerCase().includes(q) ||

        r.trc20Address.toLowerCase().includes(q) ||

        (r.txHash?.toLowerCase().includes(q) ?? false),

    );

  }

  if (query?.withdrawalFilter === "high_value") {

    rows = rows.filter((d) => d.isHighValue);

  }

  if (query?.withdrawalFilter === "on_hold") {

    rows = rows.filter((d) => d.status === "on_hold");

  }

  if (query?.withdrawalFilter === "failed") {

    rows = rows.filter((d) => d.status === "failed" || d.status === "rejected");

  }

  if (query?.withdrawalFilter === "no_tx_hash") {

    rows = rows.filter((d) => !d.hasTxHash);

  }

  if (query?.withdrawalFilter === "pending_queue") {

    rows = rows.filter((d) => d.status === "pending" || d.status === "approved");

  }

  return rows;

}



export async function getAdminWithdrawalsSummary(

  client?: AdminApiClient,

  query?: AdminWithdrawalsQuery,

): Promise<AdminWithdrawalSummary> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const params = withdrawalsQueryParams(query);

    const qs = new URLSearchParams(params).toString();

    const path = qs

      ? `${ADMIN_API_PATHS.withdrawals}/summary?${qs}`

      : `${ADMIN_API_PATHS.withdrawals}/summary`;

    return client.get<AdminWithdrawalSummary>(path);

  }

  await adminMockDelay();

  return MOCK_ADMIN_WITHDRAWALS_SUMMARY;

}



export async function listAdminWithdrawalsPaginated(

  query?: AdminWithdrawalsQuery,

  client?: AdminApiClient,

): Promise<PaginatedResponse<AdminWithdrawalListItem>> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const q = { ...query, status: normalizeStatusFilter(query?.status) };

    const params = withdrawalsQueryParams(q);

    const qs = new URLSearchParams(params).toString();

    const path = qs ? `${ADMIN_API_PATHS.withdrawals}?${qs}` : ADMIN_API_PATHS.withdrawals;

    return client.get<PaginatedResponse<AdminWithdrawalListItem>>(path);

  }

  await adminMockDelay();

  return paginateMock(filterMockWithdrawals(MOCK_ADMIN_WITHDRAWALS, query), query);

}



export async function getAdminWithdrawal(

  id: string,

  client?: AdminApiClient,

  include = "ledger,audit,user,approvals",

): Promise<AdminWithdrawalDetail | null> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminWithdrawalDetail>(`${ADMIN_API_PATHS.withdrawal(id)}?include=${include}`);

  }

  await adminMockDelay(120);

  if (id === MOCK_ADMIN_WITHDRAWAL_DETAIL.id) return { ...MOCK_ADMIN_WITHDRAWAL_DETAIL };

  const row = MOCK_ADMIN_WITHDRAWALS.find((d) => d.id === id);

  if (!row) return null;

  return { ...MOCK_ADMIN_WITHDRAWAL_DETAIL, ...row };

}



export async function patchAdminWithdrawal(

  id: string,

  action: "approve" | "reject" | "hold" | "complete",

  note: string | undefined,

  client?: AdminApiClient,

  blockchainTxid?: string,

): Promise<AdminWithdrawalListItem> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const body =

      action === "complete"

        ? { note, blockchainTxid: blockchainTxid || undefined }

        : { note };

    return client.post<AdminWithdrawalListItem>(

      `${ADMIN_API_PATHS.withdrawal(id)}/${action}`,

      body,

    );

  }

  await adminMockDelay(300);

  const row = MOCK_ADMIN_WITHDRAWALS.find((w) => w.id === id);

  if (!row) throw new Error("Withdrawal not found");

  const statusMap: Record<string, AdminWithdrawalListItem["status"]> = {

    approve: "approved",

    reject: "rejected",

    hold: "on_hold",

    complete: "completed",

  };

  return {

    ...row,

    status: statusMap[action] ?? row.status,

    txHash: blockchainTxid ?? row.txHash,

    hasTxHash: Boolean(blockchainTxid ?? row.txHash),

  };

}



export async function listAdminWithdrawals(client?: AdminApiClient): Promise<AdminWithdrawalListItem[]> {

  const res = await listAdminWithdrawalsPaginated({ pageSize: 500 }, client);

  return res.items;

}


