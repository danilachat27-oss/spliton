import { ReportJobStatus } from '@prisma/client';

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_RETENTION_DAYS = 7;

export function reportMaxAttempts(): number {
  const raw = Number(
    process.env.REPORT_WORKER_MAX_ATTEMPTS ?? DEFAULT_MAX_ATTEMPTS,
  );
  return Number.isFinite(raw) && raw >= 1
    ? Math.floor(raw)
    : DEFAULT_MAX_ATTEMPTS;
}

export function reportRunningTimeoutMs(): number {
  const raw = Number(
    process.env.REPORT_WORKER_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
  );
  return Number.isFinite(raw) && raw >= 60_000 ? raw : DEFAULT_TIMEOUT_MS;
}

export function reportRetentionDays(): number {
  const raw = Number(
    process.env.REPORT_RETENTION_DAYS ?? DEFAULT_RETENTION_DAYS,
  );
  return Number.isFinite(raw) && raw >= 1
    ? Math.floor(raw)
    : DEFAULT_RETENTION_DAYS;
}

export function reportExpiresAt(from = new Date()): Date {
  const days = reportRetentionDays();
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

/** API-facing status slug (queued/running/completed/failed/expired). */
export function mapReportJobStatus(status: ReportJobStatus): string {
  return status.toLowerCase();
}

export function isReportJobActive(status: ReportJobStatus): boolean {
  return (
    status === ReportJobStatus.QUEUED || status === ReportJobStatus.RUNNING
  );
}
