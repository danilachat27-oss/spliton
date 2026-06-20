"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { adminBtnOutline } from "@/features/admin/lib/admin-ui";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { canGenerateReportType } from "@/features/admin/config/admin-rbac";
import { resolveAnalyticsExportDateRange } from "@/features/admin/analytics/hooks/use-analytics-period";
import type { AnalyticsPeriodKey } from "@/features/admin/analytics/types";
import { useAuth } from "@/components/providers/auth-provider";
import {
  generateAdminReport,
  type AdminReportType,
} from "@/services/admin/adminReports.service";
import { ApiError } from "@/services/auth.service";

type AdminAnalyticsExportButtonProps = {
  reportType: AdminReportType;
  dateFrom?: string;
  dateTo?: string;
  period?: AnalyticsPeriodKey;
  customFrom?: string;
  customTo?: string;
  label?: string;
};

export function AdminAnalyticsExportButton({
  reportType,
  dateFrom,
  dateTo,
  period = "30d",
  customFrom,
  customTo,
  label,
}: AdminAnalyticsExportButtonProps) {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [jobId, setJobId] = React.useState<string | null>(null);

  const resolvedLabel = label ?? a.t("admin.analytics.export.defaultLabel");
  const canExport = canGenerateReportType(user?.roles, reportType);

  async function handleExport() {
    if (!canExport) return;
    setLoading(true);
    setMessage(null);
    setJobId(null);
    try {
      const range =
        dateFrom && dateTo
          ? { dateFrom, dateTo }
          : resolveAnalyticsExportDateRange(period, customFrom, customTo);
      const job = await generateAdminReport(
        reportType,
        range.dateFrom,
        range.dateTo,
        client,
        user?.roles,
      );
      setJobId(job.id);
      if (job.status === "completed") {
        setMessage(a.t("admin.analytics.export.ready"));
      } else {
        setMessage(a.t("admin.analytics.export.queued"));
      }
    } catch (error) {
      if (error instanceof ApiError && error.message) {
        setMessage(error.message);
      } else {
        setMessage(a.t("admin.analytics.export.failed"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={adminBtnOutline}
        disabled={!canExport || loading}
        onClick={() => void handleExport()}
        title={!canExport ? a.t("admin.analytics.export.noPermission") : undefined}
      >
        {loading ? a.t("admin.analytics.export.creating") : resolvedLabel}
      </Button>
      {message ? (
        <span className="max-w-[220px] text-right text-xs text-zinc-500">{message}</span>
      ) : null}
      {jobId ? (
        <Link href={ROUTES.adminReports} className="text-xs text-[#B7F500] hover:underline">
          {a.t("admin.analytics.export.openReports")}
        </Link>
      ) : null}
    </div>
  );
}
