import { ReportFormat } from '@prisma/client';

const FINANCE_TYPES = new Set([
  'withdrawals',
  'deposits',
  'platform_revenue',
  'platform_revenue_transactions',
  'finance_cashflow',
  'finance_fees',
  'revenue_distributions',
  'wallet_transactions',
]);

const COMPLIANCE_DOCX_TYPES = new Set([
  'risk_flags',
  'audit_logs',
  'revenue_distributions',
]);

export function parseReportFormat(raw?: string): ReportFormat {
  const value = (raw ?? 'csv').toUpperCase();
  if (value === 'XLSX') return ReportFormat.XLSX;
  if (value === 'PDF') return ReportFormat.PDF;
  if (value === 'DOCX') return ReportFormat.DOCX;
  return ReportFormat.CSV;
}

export function formatToExt(format: ReportFormat): string {
  switch (format) {
    case ReportFormat.XLSX:
      return 'xlsx';
    case ReportFormat.PDF:
      return 'pdf';
    case ReportFormat.DOCX:
      return 'docx';
    default:
      return 'csv';
  }
}

export function formatToMime(format: ReportFormat): string {
  switch (format) {
    case ReportFormat.XLSX:
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case ReportFormat.PDF:
      return 'application/pdf';
    case ReportFormat.DOCX:
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'text/csv; charset=utf-8';
  }
}

export function allowedFormatsForReportType(type: string): ReportFormat[] {
  const base = [ReportFormat.CSV, ReportFormat.XLSX];
  if (FINANCE_TYPES.has(type)) {
    return [...base, ReportFormat.PDF];
  }
  if (COMPLIANCE_DOCX_TYPES.has(type)) {
    return [...base, ReportFormat.PDF, ReportFormat.DOCX];
  }
  if (type === 'support_tickets' || type === 'analytics_summary') {
    return [...base, ReportFormat.PDF];
  }
  return base;
}

export function assertFormatAllowed(type: string, format: ReportFormat): void {
  const allowed = allowedFormatsForReportType(type);
  if (!allowed.includes(format)) {
    throw new Error(
      `Format ${format} is not supported for report type ${type}`,
    );
  }
}
