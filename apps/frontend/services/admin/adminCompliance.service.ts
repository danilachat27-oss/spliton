import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";

import type { AdminApiClient } from "@/features/admin/api/admin-api-client";

import { paginateMock } from "@/features/admin/api/paginate-mock";

import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";

import {

  MOCK_ADMIN_COMPLIANCE,

  MOCK_ADMIN_COMPLIANCE_SUMMARY,

  MOCK_COMPLIANCE_HISTORY,

  MOCK_RISK_RULES,

  mockComplianceDetail,

  type AdminComplianceDetail,

  type AdminComplianceHistoryItem,

  type AdminComplianceItem,

  type AdminComplianceSummary,

  type AdminRiskRule,

} from "@/features/admin/mocks/admin-compliance.mock";

import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";



export type AdminComplianceQuery = AdminListQuery & {

  severity?: string;

  minRiskScore?: string;

  maxRiskScore?: string;

  queueFilter?: string;

};



function filterMockCompliance(items: AdminComplianceItem[], query?: AdminComplianceQuery) {

  let rows = [...items];

  const q = query?.search?.trim().toLowerCase();

  if (q) {

    rows = rows.filter(

      (r) =>

        r.reference.toLowerCase().includes(q) ||

        r.note.toLowerCase().includes(q) ||

        r.userEmail?.toLowerCase().includes(q) ||

        r.flagCode?.toLowerCase().includes(q) ||

        r.id.toLowerCase().includes(q),

    );

  }

  if (query?.entityType) {

    rows = rows.filter((r) => r.kind === query.entityType);

  }

  if (query?.severity && query.severity !== "all") {

    rows = rows.filter((r) => r.severity === query.severity);

  }

  if (query?.minRiskScore) {

    rows = rows.filter((r) => r.riskScore >= Number(query.minRiskScore));

  }

  if (query?.maxRiskScore) {

    rows = rows.filter((r) => r.riskScore <= Number(query.maxRiskScore));

  }

  if (query?.queueFilter === "queue" || query?.status === "open") {

    rows = rows.filter((r) => r.status === "open");

  } else if (query?.queueFilter === "critical") {

    rows = rows.filter((r) => r.severity === "critical" && r.status === "open");

  } else if (query?.queueFilter === "high") {

    rows = rows.filter((r) => r.severity === "high");

  } else if (query?.queueFilter === "overdue") {

    rows = rows.filter((r) => r.slaOverdue);

  } else if (query?.queueFilter === "frozen") {

    rows = rows.filter((r) => r.status === "on_hold");

  } else if (query?.queueFilter === "blocked") {

    rows = rows.filter((r) => r.status === "blocked" || r.userStatus === "suspended");

  } else if (query?.status && query.status !== "all") {

    if (query.status === "frozen") {

      rows = rows.filter((r) => r.status === "on_hold" || r.status === "blocked");

    } else if (query.status === "blocked_users") {

      rows = rows.filter((r) => r.userStatus === "suspended" || r.status === "blocked");

    } else {

      rows = rows.filter((r) => r.status === query.status);

    }

  }



  switch (query?.sortBy) {

    case "oldest":

      rows.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

      break;

    case "highest_risk":

      rows.sort((a, b) => b.riskScore - a.riskScore);

      break;

    case "sla_first":

      rows.sort((a, b) => (a.slaOverdue === b.slaOverdue ? 0 : a.slaOverdue ? -1 : 1));

      break;

    case "recently_updated":

      rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

      break;

    default:

      rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  }

  return rows;

}



export async function getAdminComplianceSummary(

  client?: AdminApiClient,

): Promise<AdminComplianceSummary> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminComplianceSummary>(ADMIN_API_PATHS.complianceSummary);

  }

  await adminMockDelay();

  return MOCK_ADMIN_COMPLIANCE_SUMMARY;

}



export async function listAdminCompliancePaginated(

  query?: AdminComplianceQuery,

  client?: AdminApiClient,

): Promise<PaginatedResponse<AdminComplianceItem>> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.getPaginated<AdminComplianceItem>(ADMIN_API_PATHS.complianceRiskFlags, query);

  }

  await adminMockDelay();

  return paginateMock(filterMockCompliance(MOCK_ADMIN_COMPLIANCE, query), query);

}



export async function getAdminComplianceFlag(

  id: string,

  client?: AdminApiClient,

  include = "evidence,timeline,activity,audit,object",

): Promise<AdminComplianceDetail | null> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    try {

      return await client.get<AdminComplianceDetail>(

        `${ADMIN_API_PATHS.complianceRiskFlag(id)}?include=${encodeURIComponent(include)}`,

      );

    } catch {

      return null;

    }

  }

  await adminMockDelay();

  return mockComplianceDetail(id, include);

}



export async function getAdminRiskRules(client?: AdminApiClient): Promise<{ items: AdminRiskRule[] }> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get(ADMIN_API_PATHS.complianceRiskRules);

  }

  await adminMockDelay();

  return { items: MOCK_RISK_RULES };

}



export async function listAdminComplianceHistory(

  query?: AdminListQuery,

  client?: AdminApiClient,

): Promise<PaginatedResponse<AdminComplianceHistoryItem>> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.getPaginated<AdminComplianceHistoryItem>(ADMIN_API_PATHS.complianceHistory, query);

  }

  await adminMockDelay();

  return paginateMock(MOCK_COMPLIANCE_HISTORY, query);

}



export async function patchAdminComplianceStatus(

  id: string,

  status: string,

  note: string | undefined,

  client?: AdminApiClient,

) {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.patch(`${ADMIN_API_PATHS.complianceRiskFlag(id)}/status`, { status, note });

  }

  await adminMockDelay(200);

  const item = MOCK_ADMIN_COMPLIANCE.find((x) => x.id === id);

  if (!item) throw new Error("Compliance item not found");

  return { ...item, status: status as AdminComplianceItem["status"] };

}



export async function resolveAdminComplianceFlag(

  id: string,

  note: string | undefined,

  client?: AdminApiClient,

) {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(`${ADMIN_API_PATHS.complianceRiskFlag(id)}/resolve`, { note });

  }

  return patchAdminComplianceStatus(id, "reviewed", note, client);

}



export async function dismissAdminComplianceFlag(

  id: string,

  note: string | undefined,

  client?: AdminApiClient,

) {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(`${ADMIN_API_PATHS.complianceRiskFlag(id)}/dismiss`, { note });

  }

  return patchAdminComplianceStatus(id, "reviewed", `[false_positive] ${note}`, client);

}



export async function addAdminComplianceNote(

  id: string,

  note: string,

  client?: AdminApiClient,

) {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(`${ADMIN_API_PATHS.complianceRiskFlag(id)}/notes`, { note });

  }

  await adminMockDelay(200);

  return { ok: true as const };

}



export async function assignAdminComplianceFlag(

  id: string,

  assigneeEmail: string,

  client?: AdminApiClient,

) {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.patch(`${ADMIN_API_PATHS.complianceRiskFlag(id)}/assign`, { assigneeEmail });

  }

  await adminMockDelay(200);

  return { ok: true as const, assignedToEmail: assigneeEmail };

}



export async function escalateAdminComplianceFlag(

  id: string,

  note: string | undefined,

  client?: AdminApiClient,

) {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(`${ADMIN_API_PATHS.complianceRiskFlag(id)}/escalate`, { note });

  }

  await adminMockDelay(200);

  return { ok: true as const };

}



export async function freezeAdminComplianceOperation(

  operationId: string,

  operationType: string,

  note: string | undefined,

  client?: AdminApiClient,

) {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(`${ADMIN_API_PATHS.compliance}/operations/${operationId}/freeze`, {

      operationType,

      note,

    });

  }

  await adminMockDelay(200);

  return { ok: true as const };

}



export async function releaseAdminComplianceOperation(

  operationId: string,

  operationType: string,

  note: string | undefined,

  client?: AdminApiClient,

) {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(`${ADMIN_API_PATHS.compliance}/operations/${operationId}/release`, {

      operationType,

      note,

    });

  }

  await adminMockDelay(200);

  return { ok: true as const };

}



export async function blockAdminComplianceUser(

  userId: string,

  note: string | undefined,

  client?: AdminApiClient,

) {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(`${ADMIN_API_PATHS.compliance}/users/${userId}/block`, { note });

  }

  await adminMockDelay(200);

  return { ok: true as const };

}



export async function unblockAdminComplianceUser(

  userId: string,

  note: string | undefined,

  client?: AdminApiClient,

) {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post(`${ADMIN_API_PATHS.compliance}/users/${userId}/unblock`, { note });

  }

  await adminMockDelay(200);

  return { ok: true as const };

}

