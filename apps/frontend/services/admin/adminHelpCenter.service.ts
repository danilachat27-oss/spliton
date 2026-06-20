import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { requireAdminLiveClient } from "./admin-service.util";
import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";

export type HelpTranslationMap = Record<string, string>;

export type AdminHelpCategory = {
  id: string;
  slug: string;
  parentId: string | null;
  titleTranslations: HelpTranslationMap;
  descriptionTranslations: HelpTranslationMap;
  titlePreview: string;
  icon: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminHelpArticle = {
  id: string;
  slug: string;
  categoryId: string;
  categorySlug: string | null;
  titleTranslations: HelpTranslationMap;
  excerptTranslations: HelpTranslationMap;
  contentTranslations: HelpTranslationMap;
  titlePreview: string;
  status: "draft" | "published" | "archived";
  sortOrder: number;
  isFeatured: boolean;
  isPopular: boolean;
  isGettingStarted: boolean;
  viewCount: number;
  publishedAt: string | null;
  authorUserId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HelpCategoryListResponse = { items: AdminHelpCategory[] };

export type HelpReorderPayload = {
  items: Array<{ id: string; sortOrder: number; parentId?: string | null; categoryId?: string | null }>;
};

function requireLiveClient(client?: AdminApiClient): AdminApiClient {
  requireAdminLiveClient(client);
  return client;
}

export async function listAdminHelpCategories(
  client?: AdminApiClient,
): Promise<AdminHelpCategory[]> {
  const c = requireLiveClient(client);
  const res = await c.get<HelpCategoryListResponse>(ADMIN_API_PATHS.helpCategories);
  return res.items;
}

export async function createAdminHelpCategory(
  body: Record<string, unknown>,
  client?: AdminApiClient,
): Promise<AdminHelpCategory> {
  const c = requireLiveClient(client);
  return c.post<AdminHelpCategory>(ADMIN_API_PATHS.helpCategories, body);
}

export async function updateAdminHelpCategory(
  id: string,
  body: Record<string, unknown>,
  client?: AdminApiClient,
): Promise<AdminHelpCategory> {
  const c = requireLiveClient(client);
  return c.patch<AdminHelpCategory>(ADMIN_API_PATHS.helpCategory(id), body);
}

export async function deleteAdminHelpCategory(
  id: string,
  client?: AdminApiClient,
): Promise<void> {
  const c = requireLiveClient(client);
  await c.delete(ADMIN_API_PATHS.helpCategory(id));
}

export async function reorderAdminHelpCategories(
  body: HelpReorderPayload,
  client?: AdminApiClient,
): Promise<void> {
  const c = requireLiveClient(client);
  await c.patch(ADMIN_API_PATHS.helpCategoriesReorder, body);
}

export async function listAdminHelpArticlesPaginated(
  query?: AdminListQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminHelpArticle>> {
  const c = requireLiveClient(client);
  return c.getPaginated<AdminHelpArticle>(ADMIN_API_PATHS.helpArticles, query);
}

export async function createAdminHelpArticle(
  body: Record<string, unknown>,
  client?: AdminApiClient,
): Promise<AdminHelpArticle> {
  const c = requireLiveClient(client);
  return c.post<AdminHelpArticle>(ADMIN_API_PATHS.helpArticles, body);
}

export async function updateAdminHelpArticle(
  id: string,
  body: Record<string, unknown>,
  client?: AdminApiClient,
): Promise<AdminHelpArticle> {
  const c = requireLiveClient(client);
  return c.patch<AdminHelpArticle>(ADMIN_API_PATHS.helpArticle(id), body);
}

export async function deleteAdminHelpArticle(
  id: string,
  client?: AdminApiClient,
): Promise<void> {
  const c = requireLiveClient(client);
  await c.delete(ADMIN_API_PATHS.helpArticle(id));
}

export async function publishAdminHelpArticle(
  id: string,
  client?: AdminApiClient,
): Promise<AdminHelpArticle> {
  const c = requireLiveClient(client);
  return c.patch<AdminHelpArticle>(ADMIN_API_PATHS.helpArticlePublish(id), {});
}

export async function archiveAdminHelpArticle(
  id: string,
  client?: AdminApiClient,
): Promise<AdminHelpArticle> {
  const c = requireLiveClient(client);
  return c.patch<AdminHelpArticle>(ADMIN_API_PATHS.helpArticleArchive(id), {});
}

export async function reorderAdminHelpArticles(
  body: HelpReorderPayload,
  client?: AdminApiClient,
): Promise<void> {
  const c = requireLiveClient(client);
  await c.patch(ADMIN_API_PATHS.helpArticlesReorder, body);
}
