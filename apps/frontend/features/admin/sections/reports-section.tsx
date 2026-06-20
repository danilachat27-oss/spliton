"use client";

import * as React from "react";
import { Info, Plus, Server } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnPrimary } from "@/features/admin/lib/admin-ui";
import { AdminReportCreateDrawer } from "@/features/admin/components/admin-report-create-drawer";
import { AdminReportJobDrawer } from "@/features/admin/components/admin-report-job-drawer";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
  AdminSectionTabBar,
} from "@/features/admin/components/admin-section-layout";
import {
  getReportsForRole,
  groupReportsByDomain,
  REPORT_CATALOG,
  REPORT_DOMAIN_LABELS,
  type ReportCatalogEntry,
  type ReportDomainId,
} from "@/features/admin/config/admin-reports-catalog";
import { canGenerateReportType } from "@/features/admin/config/admin-rbac";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminPaginatedList } from "@/features/admin/hooks/use-admin-paginated-list";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import { useAdminSectionTab } from "@/features/admin/hooks/use-admin-section-tab";
import { ADMIN_METRIC_NA_LABEL, formatAdminDate, isAdminMetricEmpty } from "@/features/admin/lib/admin-format";
import {
  DB_STORAGE_WARNING,
  formatDurationMs,
  formatFileSize,
  REPORT_STATUS_LABELS,
  reportStatusTone,
  SCHEDULED_REPORTS_PLACEHOLDER,
  WORKER_DISABLED_MESSAGE,
} from "@/features/admin/lib/admin-reports-i18n";
import { ADMIN_SECTION_KPI_GRID, ADMIN_SECTION_NOTICE, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import type { AdminReportsSummary } from "@/features/admin/mocks/admin-reports.mock";
import {
  AdminDataTable,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminLocalizedStatusBadge,
  AdminPagination,
  AdminReadOnlyBanner,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { useAuth } from "@/components/providers/auth-provider";
import type { AdminListQuery } from "@/features/admin/api/types";
import { cn } from "@/lib/utils";
import {
  downloadAdminReport,
  fetchReportWorkerStatus,
  generateAdminReport,
  getAdminReportJob,
  getAdminReportsSummary,
  listAdminReportJobsPaginated,
  retryAdminReport,
  type AdminReportJob,
  type AdminReportJobDetail,
  type AdminReportType,
  type ReportWorkerStatus,
} from "@/services/admin/adminReports.service";

const TABS = [
  { id: "overview", label: "Обзор" },
  { id: "catalog", label: "Каталог отчётов" },
  { id: "jobs", label: "История задач" },
  { id: "schedule", label: "Расписание" },
  { id: "worker", label: "Воркер и хранилище" },
  { id: "access", label: "Экспорт и доступы" },
] as const;

type ReportsTab = (typeof TABS)[number]["id"];

function formatReportPeriod(from?: string | null, to?: string | null): string {
  const f = from?.slice(0, 10) || ADMIN_METRIC_NA_LABEL;
  const t = to?.slice(0, 10) || ADMIN_METRIC_NA_LABEL;
  return `${f} · ${t}`;
}

function StatTile({
  label,
  value,
  tone = "neutral",
  onClick,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  onClick?: () => void;
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400"
        : tone === "danger"
          ? "text-rose-400"
          : tone === "info"
            ? "text-sky-400"
            : "text-zinc-100";
  const empty = isAdminMetricEmpty(value);

  const body = (
    <div
      className={cn(
        ADMIN_SECTION_TILE,
        "flex min-h-22 flex-col justify-between gap-2",
        onClick && "cursor-pointer transition-colors hover:bg-zinc-900/70",
      )}
    >
      <p className="text-[11px] font-semibold uppercase leading-snug tracking-wide text-zinc-500">{label}</p>
      <p
        className={cn(
          "tabular-nums tracking-tight",
          empty ? "text-base font-medium text-zinc-500" : cn("text-2xl font-semibold", valueClass),
        )}
      >
        {empty ? ADMIN_METRIC_NA_LABEL : value}
      </p>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" className="block w-full text-left" onClick={onClick}>
        {body}
      </button>
    );
  }

  return body;
}

function ReportsNotice({
  children,
  tone = "warning",
}: {
  children: React.ReactNode;
  tone?: "warning" | "info";
}) {
  return (
    <div
      className={cn(
        ADMIN_SECTION_NOTICE,
        "flex items-start gap-3 text-sm",
        tone === "warning" ? "text-amber-300" : "text-sky-300",
      )}
    >
      {children}
    </div>
  );
}

export function ReportsSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { user } = useAuth();
  const perms = useAdminPermissions();
  const readOnly = !perms.can("Reports", "update");
  const canMutate = !readOnly;

  const allowedReports = getReportsForRole(user?.roles);
  const reportsByDomain = groupReportsByDomain(allowedReports);
  const domainOrder = Object.keys(REPORT_DOMAIN_LABELS) as ReportDomainId[];

  const [tab, setTab] = useAdminSectionTab<ReportsTab>(TABS.map((t) => t.id), "overview");
  const [summary, setSummary] = React.useState<AdminReportsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [workerStatus, setWorkerStatus] = React.useState<ReportWorkerStatus | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createTemplate, setCreateTemplate] = React.useState<AdminReportType | undefined>();

  const [jobDrawerOpen, setJobDrawerOpen] = React.useState(false);
  const [jobDetail, setJobDetail] = React.useState<AdminReportJobDetail | null>(null);
  const [jobDetailLoading, setJobDetailLoading] = React.useState(false);

  const loader = React.useCallback(
    (q: AdminListQuery) => listAdminReportJobsPaginated(q, client),
    [client],
  );
  const jobs = useAdminPaginatedList(loader);

  const hasPending = jobs.data.items.some(
    (j) =>
      j.status === "queued" ||
      j.status === "running" ||
      j.status === "processing" ||
      j.status === "pending",
  );

  const loadMeta = React.useCallback(async () => {
    setSummaryLoading(true);
    try {
      const [s, w] = await Promise.all([
        getAdminReportsSummary(undefined, client),
        fetchReportWorkerStatus(client),
      ]);
      setSummary(s);
      setWorkerStatus(w);
    } finally {
      setSummaryLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  React.useEffect(() => {
    if (!hasPending) return;
    const timer = window.setInterval(() => {
      jobs.reload();
      void fetchReportWorkerStatus(client).then(setWorkerStatus);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [hasPending, jobs, client]);

  const refreshAll = React.useCallback(() => {
    void loadMeta();
    jobs.reload();
  }, [loadMeta, jobs]);

  async function openJob(row: AdminReportJob) {
    setJobDrawerOpen(true);
    setJobDetailLoading(true);
    setJobDetail(null);
    try {
      setJobDetail((await getAdminReportJob(row.id, client)) ?? row);
    } finally {
      setJobDetailLoading(false);
    }
  }

  async function handleGenerate(payload: {
    type: AdminReportType;
    dateFrom: string;
    dateTo: string;
    format: "csv" | "xlsx" | "pdf" | "docx";
  }) {
    await generateAdminReport(
      payload.type,
      payload.dateFrom,
      payload.dateTo,
      client,
      user?.roles,
      payload.format,
    );
    setTab("jobs");
    refreshAll();
  }

  async function handleDownload(id: string) {
    const file = await downloadAdminReport(id, client);
    const typed = file as {
      filename: string;
      content: string;
      mimeType?: string;
      _bytes?: ArrayBuffer;
    };
    const blob = typed._bytes
      ? new Blob([typed._bytes], { type: typed.mimeType ?? "application/octet-stream" })
      : new Blob([typed.content], {
          type: typed.mimeType ?? "text/csv;charset=utf-8",
        });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = typed.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRetry(id: string) {
    await retryAdminReport(id, client);
    refreshAll();
    setJobDrawerOpen(false);
  }

  function openCreate(template?: AdminReportType) {
    setCreateTemplate(template);
    setCreateOpen(true);
  }

  const columns: AdminColumn<AdminReportJob>[] = [
    {
      key: "id",
      header: a.t("admin.table.id"),
      render: (r) => (
        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
          {r.id.slice(0, 10)}…
          <AdminCopyButton value={r.id} />
        </span>
      ),
    },
    {
      key: "type",
      header: "Тип",
      render: (r) => r.title ?? r.type,
    },
    {
      key: "cat",
      header: "Категория",
      render: (r) => r.category ?? ADMIN_METRIC_NA_LABEL,
    },
    {
      key: "period",
      header: "Период",
      render: (r) => (
        <span className="text-xs tabular-nums text-zinc-400">{formatReportPeriod(r.dateFrom, r.dateTo)}</span>
      ),
    },
    {
      key: "format",
      header: "Формат",
      render: (r) => <span className="uppercase text-xs">{r.format ?? "csv"}</span>,
    },
    {
      key: "status",
      header: a.table.status,
      render: (r) => (
        <AdminLocalizedStatusBadge
          status={REPORT_STATUS_LABELS[r.status] ?? r.status}
          tone={reportStatusTone(r.status)}
        />
      ),
    },
    {
      key: "by",
      header: "Создал",
      render: (r) => <span className="max-w-[140px] truncate text-xs">{r.requestedBy}</span>,
    },
    {
      key: "size",
      header: "Размер",
      render: (r) => formatFileSize(r.fileSizeBytes),
    },
    {
      key: "storage",
      header: a.t("admin.table.storage"),
      render: (r) => <span className="text-xs">{r.storageMode ?? ADMIN_METRIC_NA_LABEL}</span>,
    },
    {
      key: "created",
      header: a.table.created,
      render: (r) => <span className="text-xs">{formatAdminDate(r.createdAt)}</span>,
    },
    {
      key: "done",
      header: "Завершено",
      render: (r) => (
        <span className="text-xs">{r.completedAt ? formatAdminDate(r.completedAt) : ADMIN_METRIC_NA_LABEL}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex flex-col gap-1">
          {r.status === "completed" &&
          canMutate &&
          canGenerateReportType(user?.roles, r.type) ? (
            <Button
              type="button"
              size="sm"
              className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
              onClick={(e) => {
                e.stopPropagation();
                void handleDownload(r.id);
              }}
            >
              CSV
            </Button>
          ) : null}
          {r.status === "failed" && canMutate ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={adminBtnOutline}
              onClick={(e) => {
                e.stopPropagation();
                void handleRetry(r.id);
              }}
            >
              Повторить
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  function ReportTemplateCard({ entry }: { entry: ReportCatalogEntry }) {
    const allowed = canGenerateReportType(user?.roles, entry.value);
    return (
      <article
        className={cn(
          ADMIN_SECTION_TILE,
          "flex flex-col gap-3 p-4",
          !allowed && "opacity-60",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-zinc-100">{entry.label}</h3>
            <p className="mt-1 text-xs text-zinc-500">{REPORT_DOMAIN_LABELS[entry.domain]}</p>
          </div>
          {entry.sensitive ? (
            <AdminStatusBadge label={a.t("admin.reports.sensitive")} tone="warning" />
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-zinc-400">{entry.description}</p>
        <p className="text-xs text-zinc-400">{entry.estimatedVolume}</p>
        <div className="flex flex-wrap gap-1">
          {entry.formats.map((f) => (
            <span
              key={f}
              className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-300"
            >
              {f}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            size="sm"
            className={adminBtnPrimary}
            disabled={!allowed || !canMutate}
            onClick={() => openCreate(entry.value)}
          >
            Сформировать
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={adminBtnOutline}
            onClick={() => openCreate(entry.value)}
          >
            Подробнее
          </Button>
        </div>
        {!allowed ? (
          <p className="text-[11px] text-amber-300">Недоступно для вашей роли</p>
        ) : null}
      </article>
    );
  }

  const kpi = summary
    ? [
        {
          key: "total",
          label: "Всего отчётов",
          value: String(summary.total),
          tone: "neutral" as const,
          tab: "jobs" as const,
        },
        {
          key: "done",
          label: "Завершено",
          value: String(summary.completed),
          tone: "success" as const,
          tab: "jobs" as const,
        },
        {
          key: "queue",
          label: "В очереди",
          value: String(summary.queued),
          tone: summary.queued > 0 ? ("warning" as const) : ("neutral" as const),
          tab: "worker" as const,
        },
        {
          key: "proc",
          label: "В обработке",
          value: String(summary.processing),
          tone: summary.processing > 0 ? ("info" as const) : ("neutral" as const),
          tab: "worker" as const,
        },
        {
          key: "fail",
          label: "Ошибки 24ч",
          value: String(summary.failed24h),
          tone: summary.failed24h > 0 ? ("danger" as const) : ("neutral" as const),
          tab: "jobs" as const,
        },
        {
          key: "avg",
          label: "Среднее время",
          value: formatDurationMs(summary.avgGenerationMs),
          tone: "neutral" as const,
          tab: "overview" as const,
        },
        {
          key: "size",
          label: "Общий размер",
          value: formatFileSize(summary.totalFileSizeBytes),
          tone: "neutral" as const,
          tab: "overview" as const,
        },
        {
          key: "worker",
          label: "Worker",
          value: workerStatus?.healthy ? a.t("admin.systemStatus.ok") : a.t("admin.systemStatus.degraded"),
          tone: workerStatus?.healthy ? ("success" as const) : ("warning" as const),
          tab: "worker" as const,
        },
      ]
    : [];

  const accessColumns: AdminColumn<ReportCatalogEntry>[] = [
    {
      key: "label",
      header: "Отчёт",
      render: (r) => <span className="font-medium text-zinc-200">{r.label}</span>,
    },
    {
      key: "sensitive",
      header: "Sensitive",
      render: (r) =>
        r.sensitive ? (
          <AdminStatusBadge label={a.t("admin.reports.sensitive")} tone="warning" />
        ) : (
          <span className="text-zinc-500">Нет</span>
        ),
    },
    {
      key: "roles",
      header: "Роли",
      render: (r) => <span className="text-xs text-zinc-400">{r.roles.join(", ")}</span>,
    },
  ];

  const refreshing = summaryLoading || jobs.loading;

  return (
    <AdminSectionShell
      sectionId="reports"
      title={a.adminSectionLabel("reports")}
      infoHint="Spliton Reports & Export Center: формирование CSV-отчётов, очередь задач, worker и контроль доступа по ролям."
      actions={
        <>
          <Button
            type="button"
            size="sm"
            className={adminBtnPrimary}
            onClick={() => openCreate()}
            disabled={!canMutate}
          >
            <Plus className="mr-1 size-4" />
            Новый отчёт
          </Button>
          <AdminSectionRefreshButton onClick={refreshAll} loading={refreshing} />
        </>
      }
    >
      {readOnly ? <AdminReadOnlyBanner area="Отчёты" /> : null}

      <AdminSectionPanel className="min-w-0 space-y-5">
        {summary && !summaryLoading ? (
          <div className={ADMIN_SECTION_KPI_GRID}>
            {kpi.map((k) => (
              <StatTile
                key={k.key}
                label={k.label}
                value={k.value}
                tone={k.tone}
                onClick={() => setTab(k.tab)}
              />
            ))}
          </div>
        ) : summaryLoading ? (
          <div className={ADMIN_SECTION_KPI_GRID}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn(ADMIN_SECTION_TILE, "h-24 animate-pulse bg-zinc-800/50")} />
            ))}
          </div>
        ) : null}

        <AdminSectionTabBar
          tabs={TABS.map((t) => ({
            id: t.id,
            label: t.label,
            count: t.id === "jobs" ? jobs.data.total : undefined,
          }))}
          activeId={tab}
          onChange={(id) => setTab(id as ReportsTab)}
        />

        {tab === "overview" ? (
          <div className="space-y-4 pt-4">
            {summary?.lastCompleted ? (
              <div className={cn(ADMIN_SECTION_TILE, "text-sm")}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Последний успешный отчёт
                </p>
                <p className="mt-2 font-medium text-zinc-200">
                  {summary.lastCompleted.title ?? summary.lastCompleted.type}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatAdminDate(summary.lastCompleted.completedAt ?? summary.lastCompleted.createdAt)}
                </p>
              </div>
            ) : (
              <AdminEmptyState
                title="Отчётов пока нет"
                description="Сформируйте первый отчёт из каталога или нажмите «Новый отчёт»."
                className="bg-zinc-900/40 shadow-none"
              />
            )}
            {workerStatus && !workerStatus.workerEnabled ? (
              <ReportsNotice>
                <Info className="size-4 shrink-0" />
                {WORKER_DISABLED_MESSAGE}
              </ReportsNotice>
            ) : null}
          </div>
        ) : null}

        {tab === "catalog" ? (
          <div className="space-y-8 pt-4">
            {domainOrder.map((domain) => {
              const entries = reportsByDomain[domain];
              if (!entries.length) return null;
              return (
                <section key={domain}>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                    {REPORT_DOMAIN_LABELS[domain]}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {entries.map((e) => (
                      <ReportTemplateCard key={e.value} entry={e} />
                    ))}
                  </div>
                </section>
              );
            })}
            {allowedReports.length === 0 ? (
              <p className="text-sm text-zinc-500">Нет доступных шаблонов для вашей роли.</p>
            ) : null}
          </div>
        ) : null}

        {tab === "jobs" ? (
          <>
            {jobs.loading ? <AdminLoadingState label={a.t("admin.loading.jobs")} /> : null}
            {jobs.error ? <AdminErrorState onRetry={jobs.reload} /> : null}
            {!jobs.loading && !jobs.error ? (
              <>
                <AdminDataTable
                  flat
                  borderless
                  className="[&_table]:min-w-[1100px]"
                  columns={columns}
                  rows={jobs.data.items}
                  rowKey={(r) => r.id}
                  onRowClick={openJob}
                  emptyMessage="Отчётов пока нет. Сформируйте первый отчёт из каталога."
                />
                <AdminPagination
                  page={jobs.data.page}
                  pageSize={jobs.data.pageSize}
                  total={jobs.data.total}
                  onPageChange={(page) => jobs.setQuery((q) => ({ ...q, page }))}
                />
              </>
            ) : null}
          </>
        ) : null}

        {tab === "schedule" ? (
          <div className={cn(ADMIN_SECTION_TILE, "mt-4 text-sm text-zinc-400")}>
            <p>{SCHEDULED_REPORTS_PLACEHOLDER}</p>
          </div>
        ) : null}

        {tab === "worker" && workerStatus ? (
          <div className="mt-4 space-y-4">
            <div className={ADMIN_SECTION_KPI_GRID}>
              <StatTile
                label="Worker"
                value={workerStatus.workerEnabled ? "enabled" : "disabled"}
                tone={workerStatus.workerEnabled ? "success" : "danger"}
              />
              <StatTile
                label="Health"
                value={workerStatus.healthy ? "healthy" : "degraded"}
                tone={workerStatus.healthy ? "success" : "warning"}
              />
              <StatTile label="Queued" value={String(workerStatus.queued)} tone={workerStatus.queued > 0 ? "warning" : "neutral"} />
              <StatTile
                label="Processing"
                value={String(workerStatus.processing)}
                tone={workerStatus.processing > 0 ? "info" : "neutral"}
              />
              <StatTile
                label="Stuck"
                value={String(workerStatus.stuckProcessing)}
                tone={workerStatus.stuckProcessing > 0 ? "danger" : "neutral"}
              />
              <StatTile
                label="Failed 24h"
                value={String(workerStatus.failedLast24h)}
                tone={workerStatus.failedLast24h > 0 ? "danger" : "neutral"}
              />
              <StatTile label="Storage" value={workerStatus.storageMode} tone="neutral" />
              <StatTile label="Bucket" value={workerStatus.bucketName ?? ADMIN_METRIC_NA_LABEL} tone="neutral" />
            </div>
            <div className={cn(ADMIN_SECTION_TILE, "grid gap-2 text-sm sm:grid-cols-2")}>
              <p className="text-zinc-400">
                Avg time:{" "}
                <span className="font-medium tabular-nums text-zinc-200">
                  {formatDurationMs(workerStatus.avgProcessingMs)}
                </span>
              </p>
              {workerStatus.lastProcessedJobId ? (
                <p className="font-mono text-xs text-zinc-500 sm:col-span-2">
                  Last job: {workerStatus.lastProcessedJobId}
                  {workerStatus.lastProcessedAt
                    ? ` · ${formatAdminDate(workerStatus.lastProcessedAt)}`
                    : ""}
                </p>
              ) : null}
            </div>
            {!workerStatus.workerEnabled ? (
              <ReportsNotice>
                <Server className="size-4 shrink-0" />
                {WORKER_DISABLED_MESSAGE}
              </ReportsNotice>
            ) : null}
            {workerStatus.storageMode === "db" ? (
              <ReportsNotice tone="info">
                <Info className="size-4 shrink-0" />
                {DB_STORAGE_WARNING}
              </ReportsNotice>
            ) : null}
          </div>
        ) : null}

        {tab === "access" ? (
          <div className="mt-4 space-y-4">
            <AdminDataTable
              flat
              borderless
              className="[&_table]:min-w-[640px]"
              columns={accessColumns}
              rows={REPORT_CATALOG}
              rowKey={(r) => r.value}
            />
            <p className="text-xs text-zinc-500">
              Retry и download доступны COMPLIANCE, ACCOUNTANT и Super Admin согласно RBAC. Retention policy будет
              настраиваемой в следующих версиях.
            </p>
          </div>
        ) : null}
      </AdminSectionPanel>

      <AdminReportCreateDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        allowedReports={allowedReports}
        actorRoles={user?.roles}
        actorEmail={user?.email}
        storageMode={workerStatus?.storageMode}
        initialTemplate={createTemplate}
        onGenerate={handleGenerate}
      />

      <AdminReportJobDrawer
        open={jobDrawerOpen}
        onOpenChange={setJobDrawerOpen}
        job={jobDetail}
        loading={jobDetailLoading}
        canRetry={canMutate}
        canDownload={canMutate && jobDetail ? canGenerateReportType(user?.roles, jobDetail.type) : false}
        onDownload={handleDownload}
        onRetry={handleRetry}
      />
    </AdminSectionShell>
  );
}
