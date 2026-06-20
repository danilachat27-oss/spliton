import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { paginateMock } from "@/features/admin/api/paginate-mock";
import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";
import {
  MOCK_ADMIN_TICKETS,
  type AdminTicketListItem,
} from "@/features/admin/mocks/admin-support.mock";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type AdminTicketDetail = AdminTicketListItem & {
  userId?: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  escalationTarget?: string | null;
  isFinanceRelated?: boolean;
  slaDueAt?: string | null;
  slaOverdue?: boolean;
  messages?: Array<{
    id: string;
    authorEmail: string;
    body: string;
    isStaff: boolean;
    createdAt: string;
  }>;
  notes?: Array<{
    id: string;
    authorEmail: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
  }>;
};

export async function listAdminTicketsPaginated(
  query?: AdminListQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminTicketListItem>> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.getPaginated<AdminTicketListItem>(ADMIN_API_PATHS.supportTickets, query);
  }
  await adminMockDelay();
  return paginateMock(MOCK_ADMIN_TICKETS, query);
}

export async function listAdminTickets(client?: AdminApiClient): Promise<AdminTicketListItem[]> {
  const res = await listAdminTicketsPaginated({ pageSize: 500 }, client);
  return res.items;
}

export async function getAdminTicket(id: string, client?: AdminApiClient): Promise<AdminTicketDetail> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminTicketDetail>(ADMIN_API_PATHS.supportTicket(id));
  }
  await adminMockDelay();
  const t = MOCK_ADMIN_TICKETS.find((x) => x.id === id);
  if (!t) throw new Error("Ticket not found");
  return { ...t, messages: [], notes: [] };
}

export async function getAdminSupportSummary(client?: AdminApiClient) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<{
      open: number;
      inProgress: number;
      waiting: number;
      escalated: number;
      closed: number;
      highPriorityOpen: number;
    }>(ADMIN_API_PATHS.supportTicketsSummary);
  }
  return { open: 2, inProgress: 1, waiting: 0, escalated: 0, closed: 5, highPriorityOpen: 1 };
}

export async function patchAdminTicketStatus(
  id: string,
  status: string,
  note: string | undefined,
  client?: AdminApiClient,
) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.patch(ADMIN_API_PATHS.supportTicket(id) + "/status", { status, note });
  }
  await adminMockDelay(200);
  const t = MOCK_ADMIN_TICKETS.find((x) => x.id === id);
  if (!t) throw new Error("Ticket not found");
  return { ...t, status: status as AdminTicketListItem["status"] };
}

export async function assignAdminTicket(
  id: string,
  assigneeUserId: string | null,
  client?: AdminApiClient,
) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.patch(ADMIN_API_PATHS.supportTicket(id) + "/assign", { assigneeUserId });
  }
  await adminMockDelay(200);
  return getAdminTicket(id, client);
}

export async function replyAdminTicket(id: string, body: string, client?: AdminApiClient) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(ADMIN_API_PATHS.supportTicket(id) + "/reply", { body });
  }
  await adminMockDelay(200);
  return getAdminTicket(id, client);
}

export async function addAdminTicketNote(
  id: string,
  body: string,
  isInternal: boolean,
  client?: AdminApiClient,
) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(ADMIN_API_PATHS.supportTicket(id) + "/notes", { body, isInternal });
  }
  await adminMockDelay(200);
  return getAdminTicket(id, client);
}

export async function escalateAdminTicket(
  id: string,
  target: string,
  note: string | undefined,
  client?: AdminApiClient,
) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(ADMIN_API_PATHS.supportTicket(id) + "/escalate", { target, note });
  }
  await adminMockDelay(200);
  return getAdminTicket(id, client);
}

export async function patchAdminTicketPriority(
  id: string,
  priority: string,
  client?: AdminApiClient,
) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.patch(ADMIN_API_PATHS.supportTicket(id) + "/priority", { priority });
  }
  await adminMockDelay(200);
  return getAdminTicket(id, client);
}

export async function takeAdminTicket(id: string, client?: AdminApiClient) {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(ADMIN_API_PATHS.supportTicket(id) + "/take", {});
  }
  await adminMockDelay(200);
  return getAdminTicket(id, client);
}
