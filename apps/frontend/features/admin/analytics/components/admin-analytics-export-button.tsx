"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { canPerformAdminAction } from "@/features/admin/lib/admin-action-permissions";
import { useAuth } from "@/components/providers/auth-provider";
import {
  generateAdminReport,
  type AdminReportType,
} from "@/services/admin/adminReports.service";

type AdminAnalyticsExportButtonProps = {
  reportType: AdminReportType;
  dateFrom?: string;
  dateTo?: string;
  label?: string;
};

export function AdminAnalyticsExportButton({
  reportType,
  dateFrom,
  dateTo,
  label,
}: AdminAnalyticsExportButtonProps) {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const resolvedLabel = label ?? a.t("admin.analytics.export.defaultLabel");
  const canExport = canPerformAdminAction(user?.roles, "Reports", "export");

  async function handleExport() {
    if (!canExport) return;
    setLoading(true);
    setMessage(null);
    try {
      const job = await generateAdminReport(reportType, dateFrom ?? "", dateTo ?? "", client);
      if (job.status === "completed") {
        setMessage(a.t("admin.analytics.export.ready"));
      } else {
        setMessage(a.t("admin.analytics.export.queued"));
      }
    } catch {
      setMessage(a.t("admin.analytics.export.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="ghost" className={adminBtnOutline}
        disabled={!canExport || loading}
        onClick={() => void handleExport()}
        title={!canExport ? a.t("admin.analytics.export.noPermission") : undefined}
      >
        {loading ? a.t("admin.analytics.export.creating") : resolvedLabel}
      </Button>
      {message ? <span className="text-xs text-zinc-500">{message}</span> : null}
    </div>
  );
}
