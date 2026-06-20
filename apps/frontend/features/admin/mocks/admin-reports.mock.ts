/** Mock report jobs — mock mode only (Spliton). */

import type { AdminReportJob, ReportWorkerStatus } from "@/services/admin/adminReports.service";

export type AdminReportsSummary = {
  total: number;
  completed: number;
  queued: number;
  processing: number;
  failed24h: number;
  avgGenerationMs: number | null;
  totalFileSizeBytes: number;
  lastCompleted: AdminReportJob | null;
  workerHealthy: boolean;
  workerEnabled: boolean;
  storageMode: string;
};

export const MOCK_REPORTS_SUMMARY: AdminReportsSummary = {
  total: 3,
  completed: 2,
  queued: 0,
  processing: 0,
  failed24h: 1,
  avgGenerationMs: 4200,
  totalFileSizeBytes: 245760,
  lastCompleted: null,
  workerHealthy: true,
  workerEnabled: true,
  storageMode: "db",
};

export const MOCK_REPORT_JOBS: AdminReportJob[] = [
  {
    id: "rpt-demo-001",
    type: "withdrawals",
    title: "Выводы",
    category: "finance",
    format: "csv",
    status: "completed",
    dateFrom: "2026-05-01T00:00:00Z",
    dateTo: "2026-05-31T00:00:00Z",
    requestedBy: "accountant@spliton.demo",
    createdAt: "2026-05-30T10:00:00Z",
    completedAt: "2026-05-30T10:00:05Z",
    errorMessage: null,
    fileSizeBytes: 128400,
    fileUrl: null,
    storageKey: "reports/withdrawals/rpt-demo-001.csv",
    storageMode: "db",
    durationMs: 5200,
    sensitive: true,
  },
  {
    id: "rpt-demo-002",
    type: "risk_flags",
    title: "Флаги риска",
    category: "compliance",
    format: "csv",
    status: "failed",
    dateFrom: "2026-05-01T00:00:00Z",
    dateTo: "2026-05-31T00:00:00Z",
    requestedBy: "compliance@spliton.demo",
    createdAt: "2026-05-29T14:00:00Z",
    completedAt: "2026-05-29T14:00:02Z",
    errorMessage: "Timeout generating report",
    fileSizeBytes: null,
    fileUrl: null,
    storageKey: null,
    storageMode: "db",
    durationMs: null,
    sensitive: true,
  },
  {
    id: "rpt-demo-003",
    type: "support_tickets",
    title: "Тикеты поддержки",
    category: "operations",
    format: "csv",
    status: "completed",
    dateFrom: "2026-05-15T00:00:00Z",
    dateTo: "2026-05-31T00:00:00Z",
    requestedBy: "support@spliton.demo",
    createdAt: "2026-05-28T09:00:00Z",
    completedAt: "2026-05-28T09:00:03Z",
    errorMessage: null,
    fileSizeBytes: 117360,
    fileUrl: null,
    storageKey: null,
    storageMode: "db",
    durationMs: 3100,
    sensitive: false,
  },
];

MOCK_REPORTS_SUMMARY.lastCompleted = MOCK_REPORT_JOBS[0];

export const MOCK_WORKER_STATUS: ReportWorkerStatus = {
  workerEnabled: true,
  storageMode: "db",
  bucketName: "reports",
  queued: 0,
  processing: 0,
  stuckProcessing: 0,
  failedLast24h: 1,
  healthy: true,
  lastProcessedJobId: "rpt-demo-001",
  lastProcessedAt: "2026-05-30T10:00:05Z",
  avgProcessingMs: 4200,
};

export function mockReportDetail(id: string): AdminReportJob | null {
  return MOCK_REPORT_JOBS.find((j) => j.id === id) ?? null;
}
