import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type AdminSearchGroup = {
  type: string;
  title: string;
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    href: string;
    status?: string;
    meta?: string;
  }>;
};

export async function searchAdmin(
  q: string,
  client?: AdminApiClient,
): Promise<{ groups: AdminSearchGroup[] }> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<{ groups: AdminSearchGroup[] }>(ADMIN_API_PATHS.search, { q });
  }
  await adminMockDelay(80);
  return { groups: [] };
}
