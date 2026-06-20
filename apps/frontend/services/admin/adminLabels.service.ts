import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { assertLiveAdminClient } from "./admin-service.util";

export type AdminLabelListItem = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  releaseCount: number;
};

export type AdminLabelBody = {
  name: string;
  slug?: string;
};

export async function listAdminLabels(
  search: string | undefined,
  client: AdminApiClient | undefined,
  options?: { activeOnly?: boolean },
): Promise<AdminLabelListItem[]> {
  assertLiveAdminClient(client);
  const params = new URLSearchParams();
  if (search?.trim()) params.set("search", search.trim());
  if (options?.activeOnly) params.set("activeOnly", "true");
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await client.get<{ items: AdminLabelListItem[] }>(`${ADMIN_API_PATHS.labels}${qs}`);
  return res.items;
}

export async function createAdminLabel(
  body: AdminLabelBody,
  client: AdminApiClient | undefined,
): Promise<AdminLabelListItem> {
  assertLiveAdminClient(client);
  return client.post<AdminLabelListItem>(ADMIN_API_PATHS.labels, body);
}

export async function updateAdminLabel(
  id: string,
  body: Partial<AdminLabelBody & { isActive: boolean }>,
  client: AdminApiClient | undefined,
): Promise<AdminLabelListItem> {
  assertLiveAdminClient(client);
  return client.patch<AdminLabelListItem>(ADMIN_API_PATHS.label(id), body);
}
