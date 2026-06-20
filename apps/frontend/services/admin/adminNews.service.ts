import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";
import { adminMockDelay } from "./admin-api.util";
import { assertLiveAdminClient } from "./admin-service.util";

export type AdminNewsPost = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  content: string;
  coverUrl: string | null;
  category: string;
  status: string;
  publishAt: string | null;
  pinned: boolean;
  showOnHomepage: boolean;
  showInDashboard: boolean;
  audience: string;
  updatedAt: string;
  createdAt: string;
};

const MOCK_NEWS: AdminNewsPost[] = [
  {
    id: "news-mock-1",
    title: "Spliton запускает вторичный рынок",
    slug: "spliton-secondary-market",
    shortDescription: "Торговля юнитами между держателями.",
    content: "Полный текст демо-новости для mock-режима.",
    coverUrl: null,
    category: "platform",
    status: "published",
    publishAt: new Date().toISOString(),
    pinned: false,
    showOnHomepage: true,
    showInDashboard: true,
    audience: "all",
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export async function listAdminNewsPaginated(
  query?: AdminListQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminNewsPost>> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.getPaginated<AdminNewsPost>(ADMIN_API_PATHS.news, query);
  }
  await adminMockDelay();
  const page = query?.page ?? 1;
  const pageSize = query?.pageSize ?? 20;
  return {
    items: MOCK_NEWS,
    total: MOCK_NEWS.length,
    page,
    pageSize,
    hasMore: false,
  };
}

export async function getAdminNewsPost(
  id: string,
  client?: AdminApiClient,
): Promise<AdminNewsPost> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.get<AdminNewsPost>(ADMIN_API_PATHS.newsPost(id));
  }
  await adminMockDelay();
  const row = MOCK_NEWS.find((n) => n.id === id);
  if (!row) throw new Error("News post not found");
  return row;
}

export async function createAdminNewsPost(
  body: Record<string, unknown>,
  client?: AdminApiClient,
): Promise<AdminNewsPost> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.post<AdminNewsPost>(ADMIN_API_PATHS.news, body);
  }
  await adminMockDelay(200);
  return {
    ...MOCK_NEWS[0],
    ...body,
    id: `news-${Date.now()}`,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as AdminNewsPost;
}

export async function updateAdminNewsPost(
  id: string,
  body: Record<string, unknown>,
  client?: AdminApiClient,
): Promise<AdminNewsPost> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.patch<AdminNewsPost>(ADMIN_API_PATHS.newsPost(id), body);
  }
  await adminMockDelay(200);
  const row = MOCK_NEWS.find((n) => n.id === id) ?? MOCK_NEWS[0];
  return { ...row, ...body, updatedAt: new Date().toISOString() } as AdminNewsPost;
}

export async function publishAdminNewsPost(
  id: string,
  client?: AdminApiClient,
): Promise<AdminNewsPost> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.post<AdminNewsPost>(ADMIN_API_PATHS.newsPublish(id), {});
  }
  await adminMockDelay(200);
  const row = MOCK_NEWS.find((n) => n.id === id) ?? MOCK_NEWS[0];
  return { ...row, status: "published", publishAt: new Date().toISOString() };
}

export async function unpublishAdminNewsPost(
  id: string,
  client?: AdminApiClient,
): Promise<AdminNewsPost> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.post<AdminNewsPost>(ADMIN_API_PATHS.newsUnpublish(id), {});
  }
  await adminMockDelay(200);
  const row = MOCK_NEWS.find((n) => n.id === id) ?? MOCK_NEWS[0];
  return { ...row, status: "draft" };
}

export async function archiveAdminNewsPost(
  id: string,
  client?: AdminApiClient,
): Promise<AdminNewsPost> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    return client.post<AdminNewsPost>(ADMIN_API_PATHS.newsArchive(id), {});
  }
  await adminMockDelay(200);
  const row = MOCK_NEWS.find((n) => n.id === id) ?? MOCK_NEWS[0];
  return { ...row, status: "archived" };
}

export async function uploadAdminNewsCover(
  id: string,
  file: File,
  client?: AdminApiClient,
): Promise<AdminNewsPost> {
  if (getAdminDataSource() === "live") {
    assertLiveAdminClient(client);
    const formData = new FormData();
    formData.append("file", file);
    return client.postForm<AdminNewsPost>(ADMIN_API_PATHS.newsCover(id), formData);
  }
  await adminMockDelay(300);
  const row = MOCK_NEWS.find((n) => n.id === id) ?? MOCK_NEWS[0];
  return { ...row, coverUrl: URL.createObjectURL(file) };
}
