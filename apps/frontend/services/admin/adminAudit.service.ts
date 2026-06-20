import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { paginateMock } from "@/features/admin/api/paginate-mock";
import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";
import {
  MOCK_ADMIN_AUDIT,
  type AdminAuditListItem,
} from "@/features/admin/mocks/admin-audit.mock";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

type LiveAuditRow = {
  id: string;
  actorEmail: string | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

function mapLiveAudit(row: LiveAuditRow): AdminAuditListItem {
  return {
    id: row.id,
    adminEmail: row.actorEmail ?? "—",
    role: row.actorRole,
    action: row.action,
    entity: row.entityType,
    entityId: row.entityId ?? "—",
    before: row.before != null ? JSON.stringify(row.before) : null,
    after: row.after != null ? JSON.stringify(row.after) : null,
    ip: row.ip ?? "—",
    userAgent: row.userAgent ?? "—",
    createdAt: row.createdAt,
  };
}

export async function listAdminAuditPaginated(
  query?: AdminListQuery,
  client?: AdminApiClient,
): Promise<PaginatedResponse<AdminAuditListItem>> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const res = await client.getPaginated<LiveAuditRow>(ADMIN_API_PATHS.auditLogs, query);
    return { ...res, items: res.items.map(mapLiveAudit) };
  }
  await adminMockDelay();
  return paginateMock([...MOCK_ADMIN_AUDIT], query);
}

export async function listAdminAudit(
  client?: AdminApiClient,
): Promise<AdminAuditListItem[]> {
  const res = await listAdminAuditPaginated({ pageSize: 500 }, client);
  return res.items;
}
