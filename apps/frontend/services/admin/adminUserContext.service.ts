import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";
import { listAdminAuditPaginated } from "@/services/admin/adminAudit.service";
import { listAdminCompliancePaginated } from "@/services/admin/adminCompliance.service";
import { listAdminTicketsPaginated } from "@/services/admin/adminSupport.service";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type AdminUserWalletDetail = {
  id: string;
  userId: string;
  userEmail: string;
  availableBalanceUsdt: string;
  lockedBalanceUsdt: string;
  currency: string;
  network: string;
  transactions?: Array<{
    id: string;
    txType: string;
    direction: string;
    amountUsdt: string;
    status: string;
    createdAt: string;
  }>;
};

export async function getAdminUserWallet(
  userId: string,
  client?: AdminApiClient,
): Promise<AdminUserWalletDetail | null> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    try {
      return await client.get<AdminUserWalletDetail>(ADMIN_API_PATHS.userWallet(userId));
    } catch {
      return null;
    }
  }
  await adminMockDelay(100);
  return {
    id: `w-${userId}`,
    userId,
    userEmail: "mock@spliton.local",
    availableBalanceUsdt: "0.00",
    lockedBalanceUsdt: "0.00",
    currency: "USDT",
    network: "TRC20",
  };
}

export async function listAdminUserWalletTransactions(
  userId: string,
  query?: AdminListQuery,
  client?: AdminApiClient,
) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.getPaginated(
      ADMIN_API_PATHS.userWalletTransactions(userId),
      query,
    );
  }
  await adminMockDelay(80);
  return { items: [], total: 0, page: 1, pageSize: 20, hasMore: false };
}

export function listAdminUserAuditLogs(
  userId: string,
  query?: AdminListQuery,
  client?: AdminApiClient,
) {
  return listAdminAuditPaginated({ ...query, userId }, client);
}

export function listAdminUserComplianceFlags(
  userId: string,
  query?: AdminListQuery,
  client?: AdminApiClient,
) {
  return listAdminCompliancePaginated({ ...query, userId, pageSize: query?.pageSize ?? 20 }, client);
}

export type AdminUserOperatorContext = {
  user: { id: string; email: string; status: string; emailVerified: boolean };
  kyc: Record<string, unknown>;
  legal: {
    acceptedConsentsCount: number;
    missingRegisterConsents: Array<{ type: string; version: string; title: string }>;
  };
  sessions: { activeCount: number };
  securityEvents: Array<{
    id: string;
    action: string;
    ip: string | null;
    userAgent: string | null;
    createdAt: string;
  }>;
  support: { openCount: number; recent: Array<{ id: string; subject: string; status: string }> };
  disputes: { openCount: number; recent: Array<{ id: string; subject: string; status: string }> };
  eligibility: Record<string, { allowed: boolean; blockingCode?: string; userMessage: string }>;
  risk: {
    amlRiskLevel: string | null;
    complianceOpenFlagsCount: number;
    accountFrozen: boolean;
  };
};

export async function getAdminUserOperatorContext(
  userId: string,
  client?: AdminApiClient,
): Promise<AdminUserOperatorContext | null> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    try {
      return await client.get<AdminUserOperatorContext>(ADMIN_API_PATHS.userOperatorContext(userId));
    } catch {
      return null;
    }
  }
  await adminMockDelay(100);
  return null;
}

export function listAdminUserSupportTickets(
  userId: string,
  query?: AdminListQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<unknown>> {
  return listAdminTicketsPaginated({ ...query, userId }, client);
}
