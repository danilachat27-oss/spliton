import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import {
  applyAdminGenresListFilters,
  type AdminGenresListQuery,
} from "@/features/admin/lib/admin-genres-list";
import { assertLiveAdminClient } from "./admin-service.util";

export type { AdminGenresListQuery };

export type AdminReleaseGenreListItem = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  releaseCount: number;
};

export type AdminReleaseGenreBody = {
  name: string;
  slug?: string;
};

export async function listAdminReleaseGenres(
  query: AdminGenresListQuery | string | undefined,
  client: AdminApiClient | undefined,
): Promise<AdminReleaseGenreListItem[]> {
  assertLiveAdminClient(client);
  const params =
    typeof query === "string" ? { search: query } : query ?? {};
  const qsParams = new URLSearchParams();
  if (params.search?.trim()) qsParams.set("search", params.search.trim());
  if (params.status === "active") qsParams.set("activeOnly", "true");
  const qs = qsParams.toString() ? `?${qsParams.toString()}` : "";
  const res = await client.get<{ items: AdminReleaseGenreListItem[] }>(
    `${ADMIN_API_PATHS.releaseGenres}${qs}`,
  );
  return applyAdminGenresListFilters(res.items, params);
}

export async function getAdminReleaseGenre(
  id: string,
  client: AdminApiClient | undefined,
): Promise<AdminReleaseGenreListItem> {
  assertLiveAdminClient(client);
  return client.get<AdminReleaseGenreListItem>(ADMIN_API_PATHS.releaseGenre(id));
}

export async function createAdminReleaseGenre(
  body: AdminReleaseGenreBody,
  client: AdminApiClient | undefined,
): Promise<AdminReleaseGenreListItem> {
  assertLiveAdminClient(client);
  return client.post<AdminReleaseGenreListItem>(ADMIN_API_PATHS.releaseGenres, body);
}

export async function updateAdminReleaseGenre(
  id: string,
  body: Partial<AdminReleaseGenreBody & { isActive: boolean }>,
  client: AdminApiClient | undefined,
): Promise<AdminReleaseGenreListItem> {
  assertLiveAdminClient(client);
  return client.patch<AdminReleaseGenreListItem>(ADMIN_API_PATHS.releaseGenre(id), body);
}
