import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { paginateMock } from "@/features/admin/api/paginate-mock";
import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";
import {
  MOCK_ADMIN_ROUNDS,
  type AdminRoundListItem,
} from "@/features/admin/mocks/admin-rounds.mock";
import { adminMockDelay, fetchAllAdminPaginatedItems } from "./admin-api.util";
import { assertLiveAdminClient } from "./admin-service.util";

function filterMockRounds(items: AdminRoundListItem[], query?: AdminListQuery): AdminRoundListItem[] {
  let rows = [...items];
  if (query?.search?.trim()) {
    const q = query.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.trackTitle.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.trackId.toLowerCase().includes(q),
    );
  }
  if (query?.status && query.status !== "all") {
    rows = rows.filter((r) => r.status === query.status);
  }
  return rows;
}

export async function listAdminRoundsPaginated(
  query?: AdminListQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminRoundListItem>> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.getPaginated<AdminRoundListItem>(ADMIN_API_PATHS.rounds, query);
  }
  await adminMockDelay();
  return paginateMock(filterMockRounds(MOCK_ADMIN_ROUNDS, query), query);
}

export async function listAdminRounds(client?: AdminApiClient): Promise<AdminRoundListItem[]> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return fetchAllAdminPaginatedItems((query) =>
      client.getPaginated<AdminRoundListItem>(ADMIN_API_PATHS.rounds, query),
    );
  }
  await adminMockDelay();
  return MOCK_ADMIN_ROUNDS;
}

export async function getAdminRound(
  id: string,
  client?: AdminApiClient,
): Promise<AdminRoundListItem> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.get<AdminRoundListItem>(`${ADMIN_API_PATHS.rounds}/${id}`);
  }
  await adminMockDelay();
  const r = MOCK_ADMIN_ROUNDS.find((x) => x.id === id);
  if (!r) throw new Error("Round not found");
  return r;
}

export async function createAdminRound(
  body: Record<string, unknown>,
  client?: AdminApiClient,
): Promise<AdminRoundListItem> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.post<AdminRoundListItem>(ADMIN_API_PATHS.rounds, body);
  }
  await adminMockDelay(200);
  return { ...MOCK_ADMIN_ROUNDS[0], ...body, id: `rnd-${Date.now()}` } as AdminRoundListItem;
}

export async function updateAdminRound(
  id: string,
  body: Record<string, unknown>,
  client?: AdminApiClient,
): Promise<AdminRoundListItem> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.patch<AdminRoundListItem>(`${ADMIN_API_PATHS.rounds}/${id}`, body);
  }
  await adminMockDelay(200);
  const r = MOCK_ADMIN_ROUNDS.find((x) => x.id === id) ?? MOCK_ADMIN_ROUNDS[0];
  return { ...r, ...body } as AdminRoundListItem;
}

export async function publishAdminRound(id: string, client?: AdminApiClient) {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.post<AdminRoundListItem>(`${ADMIN_API_PATHS.rounds}/${id}/publish`, {});
  }
  await adminMockDelay(200);
  const r = MOCK_ADMIN_ROUNDS.find((x) => x.id === id) ?? MOCK_ADMIN_ROUNDS[0];
  return { ...r, status: "live" as const };
}

export async function pauseAdminRound(id: string, client?: AdminApiClient) {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.post<AdminRoundListItem>(`${ADMIN_API_PATHS.rounds}/${id}/pause`, {});
  }
  await adminMockDelay(200);
  const r = MOCK_ADMIN_ROUNDS.find((x) => x.id === id) ?? MOCK_ADMIN_ROUNDS[0];
  return { ...r, status: "paused" as const };
}

export async function closeAdminRound(id: string, client?: AdminApiClient) {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.post<AdminRoundListItem>(`${ADMIN_API_PATHS.rounds}/${id}/close`, {});
  }
  await adminMockDelay(200);
  const r = MOCK_ADMIN_ROUNDS.find((x) => x.id === id) ?? MOCK_ADMIN_ROUNDS[0];
  return { ...r, status: "completed" as const };
}
