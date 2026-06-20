import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";

import type { AdminApiClient } from "@/features/admin/api/admin-api-client";

import { paginateMock } from "@/features/admin/api/paginate-mock";

import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";

import {

  MOCK_REPORT_JOBS,

  MOCK_REPORTS_SUMMARY,

  MOCK_WORKER_STATUS,

  mockReportDetail,

  type AdminReportsSummary,

} from "@/features/admin/mocks/admin-reports.mock";

import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

import { ApiError } from "@/services/auth.service";

import { canGenerateReportType } from "@/features/admin/config/admin-rbac";



export type AdminReportType =

  | "withdrawals"

  | "deposits"

  | "platform_revenue"

  | "platform_revenue_transactions"

  | "finance_cashflow"

  | "finance_fees"

  | "users_funnel"

  | "users"

  | "wallet_transactions"

  | "tracks_round_progress"

  | "market_volume"

  | "trades"

  | "revenue_distributions"

  | "risk_flags"

  | "support_tickets"

  | "audit_logs"

  | "analytics_summary";



export type AdminReportJob = {

  id: string;

  type: string;

  title?: string;

  category?: string;

  format?: string;

  status: string;

  dateFrom: string | null;

  dateTo: string | null;

  requestedBy: string;

  createdAt: string;

  completedAt: string | null;

  errorMessage: string | null;

  fileSizeBytes: number | null;

  fileUrl: string | null;

  storageKey?: string | null;

  storageMode?: string;

  durationMs?: number | null;

  sensitive?: boolean;

};



export type AdminReportJobDetail = AdminReportJob & {

  audit?: Array<{

    id: string;

    action: string;

    actorEmail: string | null;

    before?: unknown;

    after?: unknown;

    createdAt: string;

  }>;

};



export type ReportWorkerStatus = {

  workerEnabled: boolean;

  storageMode: string;

  bucketName?: string;

  queued: number;

  processing: number;

  stuckProcessing: number;

  failedLast24h: number;

  healthy: boolean;

  lastProcessedJobId?: string | null;

  lastProcessedAt?: string | null;

  avgProcessingMs?: number | null;

};



export async function getAdminReportsSummary(

  query?: AdminListQuery,

  client?: AdminApiClient,

): Promise<AdminReportsSummary> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminReportsSummary>(ADMIN_API_PATHS.reportsSummary, query);

  }

  await adminMockDelay();

  return MOCK_REPORTS_SUMMARY;

}



export async function listAdminReportJobsPaginated(

  query?: AdminListQuery,

  client?: AdminApiClient,

): Promise<PaginatedResponse<AdminReportJob>> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.getPaginated<AdminReportJob>(ADMIN_API_PATHS.reports, query);

  }

  await adminMockDelay();

  return paginateMock([...MOCK_REPORT_JOBS], query);

}



export async function getAdminReportJob(

  id: string,

  client?: AdminApiClient,

  include = "audit",

): Promise<AdminReportJobDetail | null> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    try {

      return await client.get<AdminReportJobDetail>(

        `${ADMIN_API_PATHS.reports}/${id}?include=${encodeURIComponent(include)}`,

      );

    } catch {

      return null;

    }

  }

  await adminMockDelay();

  return mockReportDetail(id);

}



export async function generateAdminReport(
  type: AdminReportType,
  dateFrom: string,
  dateTo: string,
  client?: AdminApiClient,
  actorRoles?: string[],
  format: "csv" | "xlsx" | "pdf" | "docx" = "csv",
): Promise<AdminReportJob> {
  if (!canGenerateReportType(actorRoles, type)) {
    throw new ApiError(403, "Report type not allowed for this role", "ADMIN_FORBIDDEN");
  }

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const params = new URLSearchParams({ type, format });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return client.post<AdminReportJob>(`${ADMIN_API_PATHS.reports}/generate?${params.toString()}`);
  }



  await adminMockDelay(400);

  const job: AdminReportJob = {

    id: `rpt-${Date.now()}`,

    type,

    title: type,

    category: "finance",

    format: "csv",

    status: "completed",

    dateFrom: dateFrom || null,

    dateTo: dateTo || null,

    requestedBy: "operator@spliton.demo",

    createdAt: new Date().toISOString(),

    completedAt: new Date().toISOString(),

    errorMessage: null,

    fileSizeBytes: 2048,

    fileUrl: null,

    storageMode: "db",

    durationMs: 1200,

  };

  MOCK_REPORT_JOBS.unshift(job);

  return job;

}



export async function downloadAdminReport(
  id: string,
  client?: AdminApiClient,
): Promise<{ filename: string; content: string; mimeType?: string }> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const res = await client.get<{
      filename: string;
      content?: string;
      contentBase64?: string;
      mimeType?: string;
    }>(`${ADMIN_API_PATHS.reports}/${id}/download`);
    if (res.contentBase64) {
      const binary = atob(res.contentBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const blobPart = bytes.buffer as ArrayBuffer;
      return {
        filename: res.filename,
        content: res.content ?? "",
        mimeType: res.mimeType,
        _bytes: blobPart,
      } as { filename: string; content: string; mimeType?: string; _bytes?: ArrayBuffer };
    }
    return { filename: res.filename, content: res.content ?? "", mimeType: res.mimeType };
  }

  await adminMockDelay(200);

  return { filename: `${id}.csv`, content: "id,status\n1,mock" };
}



export async function fetchReportWorkerStatus(

  client?: AdminApiClient,

): Promise<ReportWorkerStatus> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<ReportWorkerStatus>(`${ADMIN_API_PATHS.reports}/worker/status`);

  }

  return MOCK_WORKER_STATUS;

}



export async function retryAdminReport(id: string, client?: AdminApiClient): Promise<AdminReportJob> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.post<AdminReportJob>(`${ADMIN_API_PATHS.reports}/${id}/retry`, {});

  }

  await adminMockDelay(200);

  const job = MOCK_REPORT_JOBS.find((j) => j.id === id);

  if (!job) throw new Error("Report not found");

  return { ...job, status: "queued", errorMessage: null };

}

