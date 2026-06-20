import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type AdminRoleListItem = {
  code: string;
  label: string;
  userCount: number;
  mutable: boolean;
};

export async function listAdminRoles(client?: AdminApiClient): Promise<AdminRoleListItem[]> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const res = await client.get<{ items: AdminRoleListItem[] }>(ADMIN_API_PATHS.roles);
    return res.items;
  }
  await adminMockDelay();
  return [
    { code: "SUPER_ADMIN", label: "Главный администратор", userCount: 1, mutable: true },
    { code: "ACCOUNTANT", label: "Бухгалтерия", userCount: 2, mutable: true },
    { code: "CONTENT_MANAGER", label: "Контент-менеджер", userCount: 1, mutable: true },
    { code: "SUPPORT_MANAGER", label: "Поддержка", userCount: 1, mutable: true },
    { code: "COMPLIANCE", label: "Риски и контроль", userCount: 1, mutable: true },
  ];
}

export async function listAdminRoleUsers(code: string, client?: AdminApiClient) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const res = await client.get<{
      items: Array<{ userId: string; email: string; displayName: string | null; assignedAt: string }>;
    }>(ADMIN_API_PATHS.roleUsers(code));
    return res.items;
  }
  await adminMockDelay();
  return [];
}
