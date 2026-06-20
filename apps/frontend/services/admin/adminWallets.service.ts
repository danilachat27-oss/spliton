import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { paginateMock } from "@/features/admin/api/paginate-mock";
import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";
import {
  MOCK_ADMIN_WALLET_DETAIL,
  MOCK_ADMIN_WALLETS,
  MOCK_ADMIN_WALLETS_SUMMARY,
  type AdminWalletDetail,
  type AdminWalletListItem,
  type AdminWalletSummary,
} from "@/features/admin/mocks/admin-wallets.mock";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type AdminWalletsQuery = AdminListQuery & {
  asset?: string;
  network?: string;
  userStatus?: string;
  walletFilter?: string;
  minAvailable?: string;
  maxAvailable?: string;
  minLocked?: string;
  maxLocked?: string;
};

function filterMockWallets(items: AdminWalletListItem[], query?: AdminWalletsQuery): AdminWalletListItem[] {
  let rows = [...items];
  if (query?.search?.trim()) {
    const q = query.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.userEmail.toLowerCase().includes(q) ||
        r.userId.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.userDisplayName?.toLowerCase().includes(q) ?? false),
    );
  }
  if (query?.walletFilter === "locked") {
    rows = rows.filter((r) => Number(r.lockedUsdt.replace(/\s/g, "")) > 0);
  }
  if (query?.walletFilter === "pending_withdrawal") {
    rows = rows.filter((r) => r.hasPendingWithdrawal);
  }
  if (query?.walletFilter === "pending_deposit") {
    rows = rows.filter((r) => r.hasPendingDeposit);
  }
  if (query?.walletFilter === "risk") {
    rows = rows.filter((r) => r.hasRiskFlag);
  }
  if (query?.userStatus === "active") {
    rows = rows.filter((r) => r.userStatus === "active");
  }
  if (query?.userStatus === "risk") {
    rows = rows.filter((r) => r.hasRiskFlag);
  }
  return rows;
}

export async function getAdminWalletsSummary(client?: AdminApiClient): Promise<AdminWalletSummary> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminWalletSummary>(`${ADMIN_API_PATHS.wallets}/summary`);
  }
  await adminMockDelay();
  return MOCK_ADMIN_WALLETS_SUMMARY;
}

export async function listAdminWalletsPaginated(
  query?: AdminWalletsQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminWalletListItem>> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.getPaginated<AdminWalletListItem>(ADMIN_API_PATHS.wallets, query);
  }
  await adminMockDelay();
  return paginateMock(filterMockWallets(MOCK_ADMIN_WALLETS, query), query);
}

export async function listAdminWallets(client?: AdminApiClient): Promise<AdminWalletListItem[]> {
  const res = await listAdminWalletsPaginated({ pageSize: 500 }, client);
  return res.items;
}

export async function getAdminWallet(
  id: string,
  client?: AdminApiClient,
  include = "transactions,deposits,withdrawals,market,risk,audit",
): Promise<AdminWalletDetail | null> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminWalletDetail>(`${ADMIN_API_PATHS.wallet(id)}?include=${include}`);
  }
  await adminMockDelay(200);
  if (id === MOCK_ADMIN_WALLET_DETAIL.id) return { ...MOCK_ADMIN_WALLET_DETAIL };
  const row = MOCK_ADMIN_WALLETS.find((w) => w.id === id);
  if (!row) return null;
  return {
    ...MOCK_ADMIN_WALLET_DETAIL,
    ...row,
    ledger: MOCK_ADMIN_WALLET_DETAIL.ledger?.map((e) => ({ ...e, walletId: id })),
  };
}

/** @deprecated use getAdminWallet */
export async function getAdminWalletDetail(
  id: string,
  client?: AdminApiClient,
): Promise<AdminWalletDetail | null> {
  return getAdminWallet(id, client, "transactions");
}

export async function listAdminWalletTransactions(
  walletId: string,
  query?: AdminWalletsQuery,
  client?: AdminApiClient,
) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.getPaginated(`${ADMIN_API_PATHS.walletTransactions(walletId)}`, query);
  }
  await adminMockDelay(120);
  const detail = await getAdminWallet(walletId, client);
  return paginateMock(detail?.ledger ?? [], query);
}
