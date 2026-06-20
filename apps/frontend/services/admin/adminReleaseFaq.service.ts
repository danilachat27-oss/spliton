import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { assertLiveAdminClient } from "./admin-service.util";

export type AdminReleaseFaqItem = {
  id: string;
  releaseId: string;
  question: string;
  answer: string;
  locale: string;
  category: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminReleaseFaqBody = {
  question: string;
  answer: string;
  locale?: string;
  category?: string;
  sortOrder?: number;
  isPublished?: boolean;
};

export async function listAdminReleaseFaq(
  releaseId: string,
  client: AdminApiClient | undefined,
): Promise<AdminReleaseFaqItem[]> {
  assertLiveAdminClient(client);
  const res = await client.get<{ items: AdminReleaseFaqItem[] }>(ADMIN_API_PATHS.releaseFaq(releaseId));
  return res.items;
}

export async function createAdminReleaseFaq(
  releaseId: string,
  body: AdminReleaseFaqBody,
  client: AdminApiClient | undefined,
): Promise<AdminReleaseFaqItem> {
  assertLiveAdminClient(client);
  return client.post<AdminReleaseFaqItem>(ADMIN_API_PATHS.releaseFaq(releaseId), body);
}

export async function updateAdminReleaseFaq(
  releaseId: string,
  faqId: string,
  body: Partial<AdminReleaseFaqBody>,
  client: AdminApiClient | undefined,
): Promise<AdminReleaseFaqItem> {
  assertLiveAdminClient(client);
  return client.patch<AdminReleaseFaqItem>(ADMIN_API_PATHS.releaseFaqItem(releaseId, faqId), body);
}

export async function deleteAdminReleaseFaq(
  releaseId: string,
  faqId: string,
  client: AdminApiClient | undefined,
): Promise<void> {
  assertLiveAdminClient(client);
  await client.delete(ADMIN_API_PATHS.releaseFaqItem(releaseId, faqId));
}
