import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type AdminDisputeListItem = {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName?: string | null;
  type: string;
  status: string;
  priority: string;
  subject: string;
  assignedToEmail?: string | null;
  assignedToUserId?: string | null;
  dueAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminDisputeDetail = AdminDisputeListItem & {
  description: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  escalationTarget?: string | null;
  resolutionReason?: string | null;
  resolvedAt?: string | null;
  messages?: Array<{
    id: string;
    authorEmail: string;
    body: string;
    isStaff: boolean;
    isInternal: boolean;
    createdAt: string;
  }>;
};

export async function listAdminDisputesPaginated(
  query?: AdminListQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminDisputeListItem>> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.getPaginated<AdminDisputeListItem>(ADMIN_API_PATHS.disputes, query);
  }
  await adminMockDelay();
  return { items: [], total: 0, page: 1, pageSize: 20, hasMore: false };
}

export async function getAdminDisputesSummary(client?: AdminApiClient) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<{
      open: number;
      waitingAdmin: number;
      waitingUser: number;
      escalated: number;
      highPriority: number;
      overdue: number;
    }>(ADMIN_API_PATHS.disputesSummary);
  }
  return { open: 0, waitingAdmin: 0, waitingUser: 0, escalated: 0, highPriority: 0, overdue: 0 };
}

export async function getAdminDispute(id: string, client?: AdminApiClient): Promise<AdminDisputeDetail> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminDisputeDetail>(ADMIN_API_PATHS.dispute(id));
  }
  await adminMockDelay();
  throw new Error("DISPUTE_NOT_FOUND");
}

export async function patchAdminDisputeStatus(
  id: string,
  status: string,
  note: string | undefined,
  client?: AdminApiClient,
) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.patch(ADMIN_API_PATHS.dispute(id) + "/status", { status, note });
  }
  await adminMockDelay(200);
  return getAdminDispute(id, client);
}

export async function patchAdminDisputePriority(
  id: string,
  priority: string,
  client?: AdminApiClient,
) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.patch(ADMIN_API_PATHS.dispute(id) + "/priority", { priority });
  }
  await adminMockDelay(200);
  return getAdminDispute(id, client);
}

export async function assignAdminDispute(
  id: string,
  assigneeUserId: string | null,
  client?: AdminApiClient,
) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.patch(ADMIN_API_PATHS.dispute(id) + "/assign", { assigneeUserId });
  }
  await adminMockDelay(200);
  return getAdminDispute(id, client);
}

export async function replyAdminDispute(id: string, body: string, client?: AdminApiClient) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(ADMIN_API_PATHS.dispute(id) + "/reply", { body });
  }
  await adminMockDelay(200);
  return getAdminDispute(id, client);
}

export async function addAdminDisputeNote(id: string, body: string, client?: AdminApiClient) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(ADMIN_API_PATHS.dispute(id) + "/notes", { body });
  }
  await adminMockDelay(200);
  return getAdminDispute(id, client);
}
