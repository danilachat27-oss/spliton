import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";

import type { AdminApiClient } from "@/features/admin/api/admin-api-client";

import { paginateMock } from "@/features/admin/api/paginate-mock";

import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";

import {

  MOCK_ADMIN_TRACKS,

  type AdminTrackListItem,

} from "@/features/admin/mocks/admin-tracks.mock";

import { adminMockDelay, fetchAllAdminPaginatedItems } from "./admin-api.util";
import { assertLiveAdminClient } from "./admin-service.util";



function filterMockTracks(items: AdminTrackListItem[], query?: AdminListQuery): AdminTrackListItem[] {

  let rows = [...items];

  if (query?.search?.trim()) {

    const q = query.search.trim().toLowerCase();

    rows = rows.filter(

      (t) =>

        t.title.toLowerCase().includes(q) ||

        t.artist.toLowerCase().includes(q) ||

        t.id.toLowerCase().includes(q),

    );

  }

  if (query?.status && query.status !== "all") {

    rows = rows.filter((t) => t.status === query.status);

  }

  if (query?.genre && query.genre !== "all") {

    rows = rows.filter((t) => t.genre === query.genre);

  }

  return rows;

}



export async function listAdminTracksPaginated(

  query?: AdminListQuery,

  client?: AdminApiClient,

): Promise<PaginatedResponse<AdminTrackListItem>> {

  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);

    return client.getPaginated<AdminTrackListItem>(ADMIN_API_PATHS.tracks, query);

  }

  await adminMockDelay();

  return paginateMock(filterMockTracks(MOCK_ADMIN_TRACKS, query), query);

}



export async function listAdminTracks(client?: AdminApiClient): Promise<AdminTrackListItem[]> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return fetchAllAdminPaginatedItems((query) =>
      client.getPaginated<AdminTrackListItem>(ADMIN_API_PATHS.tracks, query),
    );
  }
  await adminMockDelay();
  return MOCK_ADMIN_TRACKS;
}



export async function getAdminTrack(id: string, client?: AdminApiClient): Promise<AdminTrackListItem> {

  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);

    return client.get<AdminTrackListItem>(ADMIN_API_PATHS.track(id));

  }

  await adminMockDelay();

  const t = MOCK_ADMIN_TRACKS.find((x) => x.id === id);

  if (!t) throw new Error("Track not found");

  return t;

}



export async function createAdminTrack(

  body: Record<string, unknown>,

  client?: AdminApiClient,

): Promise<AdminTrackListItem> {

  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);

    return client.post<AdminTrackListItem>(ADMIN_API_PATHS.tracks, body);

  }

  await adminMockDelay(200);

  return {

    ...MOCK_ADMIN_TRACKS[0],

    ...body,

    id: `trk-${Date.now()}`,

    soldUnits: "0",

    revenueSharePoolPct: String(body.holderSharePct ?? "70"),

    distributionSharePct: String(body.platformSharePct ?? "5"),

    createdAt: new Date().toISOString(),

  } as AdminTrackListItem;

}



export async function updateAdminTrack(

  id: string,

  body: Record<string, unknown>,

  client?: AdminApiClient,

): Promise<AdminTrackListItem> {

  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);

    return client.patch<AdminTrackListItem>(ADMIN_API_PATHS.track(id), body);

  }

  await adminMockDelay(200);

  const t = MOCK_ADMIN_TRACKS.find((x) => x.id === id) ?? MOCK_ADMIN_TRACKS[0];

  return { ...t, ...body, updatedAt: new Date().toISOString() } as AdminTrackListItem;

}



async function postTrackAction(

  id: string,

  action: "publish" | "pause" | "archive" | "submit-review",

  client?: AdminApiClient,

): Promise<AdminTrackListItem> {

  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);

    return client.post<AdminTrackListItem>(`${ADMIN_API_PATHS.track(id)}/${action}`, {});

  }

  await adminMockDelay(200);

  const t = MOCK_ADMIN_TRACKS.find((x) => x.id === id);

  if (!t) throw new Error("Track not found");

  const statusMap = {

    publish: "active" as const,

    pause: "paused" as const,

    archive: "archived" as const,

    "submit-review": "review" as const,

  };

  return { ...t, status: statusMap[action] };

}



export const publishAdminTrack = (id: string, client?: AdminApiClient) =>

  postTrackAction(id, "publish", client);



export const pauseAdminTrack = (id: string, client?: AdminApiClient) =>

  postTrackAction(id, "pause", client);



export const archiveAdminTrack = (id: string, client?: AdminApiClient) =>

  postTrackAction(id, "archive", client);



export const submitAdminTrackReview = (id: string, client?: AdminApiClient) =>

  postTrackAction(id, "submit-review", client);



export async function uploadTrackCover(
  id: string,
  file: File,
  client?: AdminApiClient,
): Promise<AdminTrackListItem> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    const formData = new FormData();
    formData.append("file", file);
    return client.postForm<AdminTrackListItem>(`${ADMIN_API_PATHS.track(id)}/cover`, formData);
  }
  await adminMockDelay(300);
  const t = MOCK_ADMIN_TRACKS.find((x) => x.id === id) ?? MOCK_ADMIN_TRACKS[0];
  return { ...t, coverUrl: URL.createObjectURL(file) };
}

export async function uploadTrackAudioPreview(
  id: string,
  file: File,
  client?: AdminApiClient,
): Promise<AdminTrackListItem> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    const formData = new FormData();
    formData.append("file", file);
    return client.postForm<AdminTrackListItem>(`${ADMIN_API_PATHS.track(id)}/audio-preview`, formData);
  }
  await adminMockDelay(300);
  const t = MOCK_ADMIN_TRACKS.find((x) => x.id === id) ?? MOCK_ADMIN_TRACKS[0];
  return { ...t, audioPreviewUrl: URL.createObjectURL(file) };
}
