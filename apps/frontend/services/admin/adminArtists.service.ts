import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { assertLiveAdminClient } from "./admin-service.util";

export type AdminArtistListItem = {
  id: string;
  slug: string;
  name: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  releaseCount: number;
};

export type AdminArtistBody = {
  name: string;
  slug?: string;
};

export type AdminArtistsListQuery = {
  search?: string;
  status?: string;
  releases?: string;
  sort?: string;
};

function buildArtistsQueryString(query?: AdminArtistsListQuery | string): string {
  const params = typeof query === "string" ? { search: query } : query;
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.releases && params.releases !== "all") qs.set("releases", params.releases);
  if (params.sort && params.sort !== "name_asc") qs.set("sort", params.sort);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function listAdminArtists(
  query: AdminArtistsListQuery | string | undefined,
  client: AdminApiClient | undefined,
): Promise<AdminArtistListItem[]> {
  assertLiveAdminClient(client);
  const qs = buildArtistsQueryString(query);
  const res = await client.get<{ items: AdminArtistListItem[] }>(`${ADMIN_API_PATHS.artists}${qs}`);
  return res.items;
}

export async function getAdminArtist(id: string, client: AdminApiClient | undefined): Promise<AdminArtistListItem> {
  assertLiveAdminClient(client);
  return client.get<AdminArtistListItem>(ADMIN_API_PATHS.artist(id));
}

export async function createAdminArtist(
  body: AdminArtistBody,
  client: AdminApiClient | undefined,
): Promise<AdminArtistListItem> {
  assertLiveAdminClient(client);
  return client.post<AdminArtistListItem>(ADMIN_API_PATHS.artists, body);
}

export async function updateAdminArtist(
  id: string,
  body: Partial<AdminArtistBody & { isActive?: boolean }>,
  client: AdminApiClient | undefined,
): Promise<AdminArtistListItem> {
  assertLiveAdminClient(client);
  return client.patch<AdminArtistListItem>(ADMIN_API_PATHS.artist(id), body);
}

export async function deleteAdminArtist(id: string, client: AdminApiClient | undefined): Promise<void> {
  assertLiveAdminClient(client);
  await client.delete(ADMIN_API_PATHS.artist(id));
}
