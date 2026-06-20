import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { paginateMock } from "@/features/admin/api/paginate-mock";
import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";
import {
  MOCK_ADMIN_USERS,
  type AdminUserListItem,
} from "@/features/admin/mocks/admin-users.mock";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";
import { ApiError } from "@/services/auth.service";
import {
  canAssignUserRoles,
  canBlockUsers,
  canRemoveUserRoles,
} from "@/features/admin/config/admin-rbac";

function assertMockSuperAdmin(
  actorRoles: string[] | undefined,
  action: "block" | "assign" | "remove",
): void {
  if (action === "block" && !canBlockUsers(actorRoles)) {
    throw new ApiError(403, "Only SUPER_ADMIN can block users", "ADMIN_FORBIDDEN");
  }
  if (action === "assign" && !canAssignUserRoles(actorRoles)) {
    throw new ApiError(403, "Only SUPER_ADMIN can assign roles", "ADMIN_FORBIDDEN");
  }
  if (action === "remove" && !canRemoveUserRoles(actorRoles)) {
    throw new ApiError(403, "Only SUPER_ADMIN can remove roles", "ADMIN_FORBIDDEN");
  }
}

export async function listAdminUsersPaginated(
  query?: AdminListQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminUserListItem>> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.getPaginated<AdminUserListItem>(ADMIN_API_PATHS.users, query);
  }

  await adminMockDelay();
  let rows = [...MOCK_ADMIN_USERS];
  const q = query?.search?.toLowerCase();
  if (q) {
    rows = rows.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        (u.name?.toLowerCase().includes(q) ?? false),
    );
  }
  if (query?.role && query.role !== "all") {
    rows = rows.filter((u) => u.roles.includes(query.role!));
  }
  if (query?.status && query.status !== "all") {
    rows = rows.filter((u) => u.status === query.status);
  }
  return paginateMock(rows, query);
}

/** @deprecated use listAdminUsersPaginated */
export async function listAdminUsers(
  client?: AdminApiClient,
): Promise<AdminUserListItem[]> {
  const res = await listAdminUsersPaginated({ pageSize: 500 }, client);
  return res.items;
}

export type AdminUsersListStats = {
  total: number;
  active: number;
  blocked: number;
  staff: number;
};

export async function getAdminUsersListStats(
  client?: AdminApiClient,
): Promise<AdminUsersListStats> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminUsersListStats>(ADMIN_API_PATHS.usersStatsSummary);
  }
  await adminMockDelay(80);
  const rows = MOCK_ADMIN_USERS;
  const staffCodes = new Set([
    "SUPER_ADMIN",
    "ADMIN",
    "ACCOUNTANT",
    "CONTENT_MANAGER",
    "SUPPORT_MANAGER",
    "COMPLIANCE",
    "SUPPORT",
    "BUSINESS_ANALYST",
  ]);
  return {
    total: rows.length,
    active: rows.filter((u) => u.status === "ACTIVE").length,
    blocked: rows.filter((u) => u.status === "SUSPENDED" || u.status === "BANNED").length,
    staff: rows.filter((u) => u.roles.some((r) => staffCodes.has(r))).length,
  };
}

export type AdminUserDetail = AdminUserListItem & {
  phone?: string | null;
  kycStatus?: string | null;
};

export async function getAdminUser(
  id: string,
  client?: AdminApiClient,
): Promise<AdminUserDetail | null> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminUserDetail>(ADMIN_API_PATHS.user(id));
  }
  await adminMockDelay(120);
  const row = MOCK_ADMIN_USERS.find((u) => u.id === id);
  return row ? { ...row, phone: null, kycStatus: "verified" } : null;
}

export async function blockAdminUser(
  id: string,
  note: string | undefined,
  client?: AdminApiClient,
  actorRoles?: string[],
): Promise<AdminUserListItem> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const complianceOnly =
      actorRoles?.includes("COMPLIANCE") && !actorRoles.includes("SUPER_ADMIN");
    const path = complianceOnly
      ? `${ADMIN_API_PATHS.compliance}/users/${id}/block`
      : `${ADMIN_API_PATHS.user(id)}/block`;
    return client.post<AdminUserListItem>(path, { note });
  }
  assertMockSuperAdmin(actorRoles, "block");
  await adminMockDelay(200);
  const u = MOCK_ADMIN_USERS.find((x) => x.id === id);
  if (!u) throw new Error("User not found");
  return { ...u, status: "SUSPENDED" };
}

export async function unblockAdminUser(
  id: string,
  note: string | undefined,
  client?: AdminApiClient,
  actorRoles?: string[],
): Promise<AdminUserListItem> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const complianceOnly =
      actorRoles?.includes("COMPLIANCE") && !actorRoles.includes("SUPER_ADMIN");
    const path = complianceOnly
      ? `${ADMIN_API_PATHS.compliance}/users/${id}/unblock`
      : `${ADMIN_API_PATHS.user(id)}/unblock`;
    return client.post<AdminUserListItem>(path, { note });
  }
  await adminMockDelay(200);
  const u = MOCK_ADMIN_USERS.find((x) => x.id === id);
  if (!u) throw new Error("User not found");
  return { ...u, status: "ACTIVE" };
}

export async function assignAdminUserRole(
  id: string,
  role: string,
  note: string | undefined,
  client?: AdminApiClient,
  actorRoles?: string[],
  confirmSuperAdmin?: boolean,
): Promise<AdminUserListItem> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post<AdminUserListItem>(`${ADMIN_API_PATHS.user(id)}/roles`, {
      role,
      note,
      confirmSuperAdmin: confirmSuperAdmin ?? false,
    });
  }
  assertMockSuperAdmin(actorRoles, "assign");
  await adminMockDelay(200);
  const u = MOCK_ADMIN_USERS.find((x) => x.id === id);
  if (!u) throw new Error("User not found");
  return { ...u, roles: [...new Set([...u.roles, role])] };
}

export async function removeAdminUserRole(
  id: string,
  role: string,
  client?: AdminApiClient,
  actorRoles?: string[],
): Promise<AdminUserListItem> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.delete<AdminUserListItem>(`${ADMIN_API_PATHS.user(id)}/roles/${role}`);
  }
  assertMockSuperAdmin(actorRoles, "remove");
  await adminMockDelay(200);
  const u = MOCK_ADMIN_USERS.find((x) => x.id === id);
  if (!u) throw new Error("User not found");
  return { ...u, roles: u.roles.filter((r) => r !== role) };
}
