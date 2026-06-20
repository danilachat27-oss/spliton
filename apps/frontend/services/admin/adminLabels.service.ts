import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import {
  applyAdminLabelsListFilters,
  type AdminLabelsListQuery,
} from "@/features/admin/lib/admin-labels-list";
import { assertLiveAdminClient } from "./admin-service.util";

export type { AdminLabelsListQuery };

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
  query: AdminLabelsListQuery | string | undefined,
  client: AdminApiClient | undefined,
): Promise<AdminLabelListItem[]> {
  assertLiveAdminClient(client);
  const params = typeof query === "string" ? { search: query } : query ?? {};
  const qsParams = new URLSearchParams();
  if (params.search?.trim()) qsParams.set("search", params.search.trim());
  if (params.status === "active") qsParams.set("activeOnly", "true");
  const qs = qsParams.toString() ? `?${qsParams.toString()}` : "";
  const res = await client.get<{ items: AdminLabelListItem[] }>(`${ADMIN_API_PATHS.labels}${qs}`);
  return applyAdminLabelsListFilters(res.items, params);
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
