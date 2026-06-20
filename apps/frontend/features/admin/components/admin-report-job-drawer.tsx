"use client";

import * as React from "react";

import {
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { getReportCatalogEntry } from "@/features/admin/config/admin-reports-catalog";
import {
  formatDurationMs,
  formatFileSize,
  REPORT_STATUS_LABELS,
  reportStatusTone,
} from "@/features/admin/lib/admin-reports-i18n";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { ADMIN_METRIC_NA_LABEL, formatAdminDate } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_NOTICE, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import {
  AdminDetailDrawer,
  AdminFormFooter,
  AdminLoadingState,
  AdminStatusBadge,
} from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import type { AdminReportJobDetail } from "@/services/admin/adminReports.service";
import { cn } from "@/lib/utils";

type TabId = "overview" | "params" | "file" | "error" | "audit";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: AdminReportJobDetail | null;
  loading?: boolean;
  canRetry?: boolean;
  canDownload?: boolean;
  onDownload?: (id: string) => void;
  onRetry?: (id: string) => void;
};

export function AdminReportJobDrawer({
  open,
  onOpenChange,
  job,
  loading,
  canRetry,
  canDownload,
  onDownload,
  onRetry,
}: Props) {
  const a = useAdminI18n();
  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: a.t("admin.drawer.common.overview") },
    { id: "params", label: a.t("admin.drawer.reportJob.tab.params") },
    { id: "file", label: a.t("admin.drawer.reportJob.tab.file") },
    { id: "error", label: a.t("admin.drawer.reportJob.tab.error") },
    { id: "audit", label: a.t("admin.drawer.common.audit") },
  ];
  const [tab, setTab] = React.useState<TabId>("overview");

  React.useEffect(() => {
    if (open) setTab(job?.status === "failed" ? "error" : "overview");
  }, [open, job?.id, job?.status]);

  const catalog = job ? getReportCatalogEntry(job.type) : undefined;

  return (
    <AdminDetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      wide
      borderless
      widthClassName="w-[min(720px,100vw)]"
      title={job?.title ?? catalog?.label ?? "Report job"}
      subtitle={job?.requestedBy}
      footer={
        job ? (
          <AdminFormFooter
            left={
              <>
                {job.status === "completed" && canDownload && onDownload ? (
                  <AdminDrawerPrimaryButton onClick={() => onDownload(job.id)}>
                    Скачать CSV
                  </AdminDrawerPrimaryButton>
                ) : null}
                {job.status === "failed" && canRetry && onRetry ? (
                  <AdminDrawerSecondaryButton onClick={() => onRetry(job.id)}>
                    Повторить
                  </AdminDrawerSecondaryButton>
                ) : null}
              </>
            }
            right={
              <AdminDrawerGhostButton onClick={() => onOpenChange(false)}>{a.t("admin.drawer.common.close")}</AdminDrawerGhostButton>
            }
          />
        ) : null
      }
    >
      {loading ? <AdminLoadingState label={a.t("admin.drawer.reportJob.loading")} /> : null}
      {job && !loading ? (
        <div className="space-y-4 pb-4">
          <p className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
            {job.id}
            <AdminCopyButton value={job.id} />
          </p>
          <div className="flex flex-wrap gap-1 pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === t.id
                    ? "bg-zinc-800 text-zinc-100 ring-1 ring-[#B7F500]/30"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
                )}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Статус</dt>
                <dd>
                  <AdminStatusBadge
                    label={REPORT_STATUS_LABELS[job.status] ?? job.status}
                    tone={reportStatusTone(job.status)}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Категория</dt>
                <dd>{job.category ?? catalog?.domain ?? ADMIN_METRIC_NA_LABEL}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Формат</dt>
                <dd className="uppercase">{job.format ?? "csv"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">{a.t("admin.table.duration")}</dt>
                <dd>{formatDurationMs(job.durationMs)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Создано</dt>
                <dd>{formatAdminDate(job.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Завершено</dt>
                <dd>{job.completedAt ? formatAdminDate(job.completedAt) : ADMIN_METRIC_NA_LABEL}</dd>
              </div>
              {job.sensitive || catalog?.sensitive ? (
                <div className="sm:col-span-2">
                  <AdminStatusBadge label={a.t("admin.common.sensitiveReport")} tone="warning" />
                </div>
              ) : null}
            </dl>
          ) : null}

          {tab === "params" ? (
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-zinc-500">Период с</dt>
                <dd>{job.dateFrom ? formatAdminDate(job.dateFrom) : ADMIN_METRIC_NA_LABEL}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Период по</dt>
                <dd>{job.dateTo ? formatAdminDate(job.dateTo) : ADMIN_METRIC_NA_LABEL}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Type</dt>
                <dd>
                  {a.adminReportTypeLabel(job.type)}
                  <span className="ml-2 font-mono text-xs text-zinc-400">{job.type}</span>
                </dd>
              </div>
            </dl>
          ) : null}

          {tab === "file" ? (
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-zinc-500">Размер</dt>
                <dd>{formatFileSize(job.fileSizeBytes)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">{a.t("admin.table.storageMode")}</dt>
                <dd>{job.storageMode ?? ADMIN_METRIC_NA_LABEL}</dd>
              </div>
              {job.storageKey ? (
                <div>
                  <dt className="text-zinc-500">Storage key</dt>
                  <dd className="flex items-center gap-2 font-mono text-xs">
                    {job.storageKey}
                    <AdminCopyButton value={job.storageKey} />
                  </dd>
                </div>
              ) : null}
              {job.fileUrl ? (
                <div>
                  <dt className="text-zinc-500">File URL</dt>
                  <dd className="truncate text-xs">{job.fileUrl}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {tab === "error" ? (
            job.status === "failed" ? (
              <div className={cn(ADMIN_SECTION_NOTICE, "text-sm text-rose-200")}>
                {job.errorMessage ?? a.t("admin.common.unknownError")}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Ошибок нет.</p>
            )
          ) : null}

          {tab === "audit" ? (
            job.audit?.length ? (
              <ul className="space-y-2 text-sm">
                {job.audit.map((entry) => (
                  <li key={entry.id} className={cn(ADMIN_SECTION_TILE, "text-xs")}>
                    <p className="font-mono text-zinc-300">{a.formatAuditAction(entry.action)}</p>
                    <p className="mt-1 text-zinc-500">
                      {entry.actorEmail ?? ADMIN_METRIC_NA_LABEL} · {formatAdminDate(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">
                Audit: report.generate, report.download, report.retry, report.failed
              </p>
            )
          ) : null}
        </div>
      ) : null}
    </AdminDetailDrawer>
  );
}
