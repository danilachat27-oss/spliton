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

export async function listAdminArtists(
  search: string | undefined,
  client: AdminApiClient | undefined,
): Promise<AdminArtistListItem[]> {
  assertLiveAdminClient(client);
  const qs = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
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
  body: Partial<AdminArtistBody>,
  client: AdminApiClient | undefined,
): Promise<AdminArtistListItem> {
  assertLiveAdminClient(client);
  return client.patch<AdminArtistListItem>(ADMIN_API_PATHS.artist(id), body);
}

export async function deleteAdminArtist(id: string, client: AdminApiClient | undefined): Promise<void> {
  assertLiveAdminClient(client);
  await client.delete(ADMIN_API_PATHS.artist(id));
}
