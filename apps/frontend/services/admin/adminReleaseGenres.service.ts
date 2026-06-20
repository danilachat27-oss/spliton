import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { assertLiveAdminClient } from "./admin-service.util";

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
  search: string | undefined,
  client: AdminApiClient | undefined,
  options?: { activeOnly?: boolean },
): Promise<AdminReleaseGenreListItem[]> {
  assertLiveAdminClient(client);
  const params = new URLSearchParams();
  if (search?.trim()) params.set("search", search.trim());
  if (options?.activeOnly) params.set("activeOnly", "true");
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await client.get<{ items: AdminReleaseGenreListItem[] }>(
    `${ADMIN_API_PATHS.releaseGenres}${qs}`,
  );
  return res.items;
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
