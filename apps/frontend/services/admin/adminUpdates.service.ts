import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";

export type AdminUpdateType =
  | "FEATURE"
  | "LEGAL"
  | "BILLING"
  | "SECURITY"
  | "MAINTENANCE"
  | "UX"
  | "SYSTEM";

export type AdminUpdateStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type AdminUpdateRow = {
  id: string;
  title: string;
  summary: string;
  content: string;
  type: AdminUpdateType;
  status: AdminUpdateStatus;
  audienceRoles: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  readAt?: string | null;
  dismissedAt?: string | null;
  isRead?: boolean;
  isDismissed?: boolean;
};

export type AdminUpdateActiveResponse = {
  primary: AdminUpdateRow | null;
  remainingCount: number;
  items: AdminUpdateRow[];
};

export type AdminUpdateManageRow = AdminUpdateRow & {
  createdBy?: { id: string; email: string } | null;
  updatedBy?: { id: string; email: string } | null;
};

export async function fetchAdminUpdatesActive(
  client: AdminApiClient,
): Promise<AdminUpdateActiveResponse> {
  return client.get<AdminUpdateActiveResponse>(ADMIN_API_PATHS.adminUpdatesActive);
}

export async function fetchAdminUpdatesHistory(
  client: AdminApiClient,
  type?: AdminUpdateType,
): Promise<AdminUpdateRow[]> {
  const qs = type ? `?type=${encodeURIComponent(type)}` : "";
  const items = await client.get<AdminUpdateRow[]>(
    `${ADMIN_API_PATHS.adminUpdatesHistory}${qs}`,
  );
  return Array.isArray(items) ? items : [];
}

export async function markAdminUpdateRead(client: AdminApiClient, id: string) {
  return client.post(ADMIN_API_PATHS.adminUpdateRead(id), {});
}

export async function dismissAdminUpdate(client: AdminApiClient, id: string) {
  return client.post(ADMIN_API_PATHS.adminUpdateDismiss(id), {});
}

export async function listAdminUpdatesManage(client: AdminApiClient) {
  const items = await client.get<AdminUpdateManageRow[]>(ADMIN_API_PATHS.adminUpdatesManage);
  return Array.isArray(items) ? items : [];
}

export async function createAdminUpdate(
  client: AdminApiClient,
  body: {
    title: string;
    summary: string;
    content: string;
    type: AdminUpdateType;
    audienceRoles: string[];
  },
) {
  return client.post<AdminUpdateManageRow>(ADMIN_API_PATHS.adminUpdates, body);
}

export async function updateAdminUpdate(
  client: AdminApiClient,
  id: string,
  body: Partial<{
    title: string;
    summary: string;
    content: string;
    type: AdminUpdateType;
    audienceRoles: string[];
  }>,
) {
  return client.patch<AdminUpdateManageRow>(ADMIN_API_PATHS.adminUpdate(id), body);
}

export async function publishAdminUpdate(client: AdminApiClient, id: string) {
  return client.post(ADMIN_API_PATHS.adminUpdatePublish(id), {});
}

export async function archiveAdminUpdate(client: AdminApiClient, id: string) {
  return client.post(ADMIN_API_PATHS.adminUpdateArchive(id), {});
}
