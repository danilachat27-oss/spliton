"use client";

import * as React from "react";
import { FileSpreadsheet, Info, Plus, Server } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { AdminMetricTrendCard } from "@/features/admin/analytics/components/admin-metric-trend-card";
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
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import {
  DB_STORAGE_WARNING,
  formatDurationMs,
  formatFileSize,
  REPORTS_FIELD_TOOLTIPS,
  REPORT_STATUS_LABELS,
  reportStatusTone,
  SCHEDULED_REPORTS_PLACEHOLDER,
  WORKER_DISABLED_MESSAGE,
} from "@/features/admin/lib/admin-reports-i18n";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import type { AdminReportsSummary } from "@/features/admin/mocks/admin-reports.mock";
import {
  AdminDataTable,
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
      render: (r) => r.category ?? "—",
    },
    {
      key: "period",
      header: "Период",
      render: (r) => (
        <span className="text-xs tabular-nums">
          {r.dateFrom?.slice(0, 10) ?? "—"} — {r.dateTo?.slice(0, 10) ?? "—"}
        </span>
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
      render: (r) => <span className="text-xs">{r.storageMode ?? "—"}</span>,
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
        <span className="text-xs">{r.completedAt ? formatAdminDate(r.completedAt) : "—"}</span>
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
            <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={() => void handleDownload(r.id)}>
              CSV
            </Button>
          ) : null}
          {r.status === "failed" && canMutate ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => void handleRetry(r.id)}>
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
          {entry.sensitive ? <AdminStatusBadge label="sensitive" tone="warning" /> : null}
        </div>
        <p className="text-sm leading-relaxed text-zinc-400">{entry.description}</p>
        <p className="text-xs text-zinc-400">{entry.estimatedVolume}</p>
        <div className="flex flex-wrap gap-1">
          {entry.formats.map((f) => (
            <span key={f} className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase">
              {f}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            size="sm"
            disabled={!allowed || !canMutate}
            onClick={() => openCreate(entry.value)}
          >
            Сформировать
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => openCreate(entry.value)}>
            Подробнее
          </Button>
        </div>
        {!allowed ? (
          <p className="text-[11px] text-amber-700">Недоступно для вашей роли</p>
        ) : null}
      </article>
    );
  }

  const kpi = summary
    ? [
        { key: "total", label: "Всего отчётов", value: summary.total, tip: REPORTS_FIELD_TOOLTIPS.total, tab: "jobs" as const },
        { key: "done", label: "Завершено", value: summary.completed, tip: REPORTS_FIELD_TOOLTIPS.completed, tab: "jobs" as const },
        { key: "queue", label: "В очереди", value: summary.queued, tip: REPORTS_FIELD_TOOLTIPS.queued, tab: "worker" as const },
        { key: "proc", label: "В обработке", value: summary.processing, tip: REPORTS_FIELD_TOOLTIPS.processing, tab: "worker" as const },
        { key: "fail", label: "Ошибки 24ч", value: summary.failed24h, tip: REPORTS_FIELD_TOOLTIPS.failed24h, tab: "jobs" as const },
        {
          key: "avg",
          label: "Среднее время",
          value: formatDurationMs(summary.avgGenerationMs),
          tip: REPORTS_FIELD_TOOLTIPS.avgGeneration,
          tab: "overview" as const,
        },
        {
          key: "size",
          label: "Общий размер",
          value: formatFileSize(summary.totalFileSizeBytes),
          tip: REPORTS_FIELD_TOOLTIPS.totalSize,
          tab: "overview" as const,
        },
      ]
    : [];

  return (
    <AdminSectionShell
      sectionId="reports"
      title={a.adminSectionLabel("reports")}
      actions={
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={() => openCreate()} disabled={!canMutate}>
            <Plus className="mr-1 size-4" />
            Новый отчёт
          </Button>
          <AdminSectionRefreshButton onClick={refreshAll} />
        </div>
      }
    >
      {readOnly ? <AdminReadOnlyBanner area="Отчёты" /> : null}

      <div className="flex gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3.5 shadow-sm">
        <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-zinc-400" />
        <p className="text-sm leading-relaxed text-zinc-400">
          Spliton Reports & Export Center — формирование CSV-отчётов, очередь задач, worker и
          контроль доступа по ролям.
        </p>
      </div>

      {summaryLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={cn(ADMIN_SECTION_TILE, "h-24 animate-pulse bg-zinc-50")} />
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpi.map((k) => (
            <AdminMetricTrendCard
              key={k.key}
              label={k.label}
              value={String(k.value)}
              tooltip={k.tip}
              onClick={() => setTab(k.tab)}
            />
          ))}
          <AdminMetricTrendCard
            label="Worker"
            value={workerStatus?.healthy ? a.t("admin.systemStatus.ok") : a.t("admin.systemStatus.degraded")}
            tooltip={REPORTS_FIELD_TOOLTIPS.worker}
            onClick={() => setTab("worker")}
          />
        </div>
      ) : null}

      <AdminSectionPanel>
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
              <div className={cn(ADMIN_SECTION_TILE, "p-4 text-sm")}>
                <p className="font-medium text-zinc-200">Последний успешный отчёт</p>
                <p className="mt-1 text-zinc-400">
                  {summary.lastCompleted.title ?? summary.lastCompleted.type} ·{" "}
                  {formatAdminDate(summary.lastCompleted.completedAt ?? summary.lastCompleted.createdAt)}
                </p>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-zinc-500">
                Отчётов пока нет. Сформируйте первый отчёт из каталога.
              </p>
            )}
            {workerStatus && !workerStatus.workerEnabled ? (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <Info className="size-4 shrink-0" />
                {WORKER_DISABLED_MESSAGE}
              </div>
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
          <div className={cn(ADMIN_SECTION_TILE, "mt-4 p-6 text-sm text-zinc-400")}>
            <p>{SCHEDULED_REPORTS_PLACEHOLDER}</p>
          </div>
        ) : null}

        {tab === "worker" && workerStatus ? (
          <div className="mt-4 space-y-4">
            <div className={cn(ADMIN_SECTION_TILE, "grid gap-4 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3")}>
              <p>
                Worker:{" "}
                <AdminStatusBadge
                  label={workerStatus.workerEnabled ? "enabled" : "disabled"}
                  tone={workerStatus.workerEnabled ? "success" : "danger"}
                />
              </p>
              <p>
                Health:{" "}
                <AdminStatusBadge
                  label={workerStatus.healthy ? "healthy" : "degraded"}
                  tone={workerStatus.healthy ? "success" : "warning"}
                />
              </p>
              <p>
                Queued: <strong className="tabular-nums">{workerStatus.queued}</strong>
              </p>
              <p>
                Processing: <strong className="tabular-nums">{workerStatus.processing}</strong>
              </p>
              <p>
                Stuck: <strong className="tabular-nums">{workerStatus.stuckProcessing}</strong>
              </p>
              <p>
                Failed 24h: <strong className="tabular-nums">{workerStatus.failedLast24h}</strong>
              </p>
              <p>
                Storage: <strong>{workerStatus.storageMode}</strong>
              </p>
              <p>
                Bucket: <strong>{workerStatus.bucketName ?? "—"}</strong>
              </p>
              <p>
                Avg time: <strong>{formatDurationMs(workerStatus.avgProcessingMs)}</strong>
              </p>
              {workerStatus.lastProcessedJobId ? (
                <p className="sm:col-span-2 lg:col-span-3 font-mono text-xs">
                  Last job: {workerStatus.lastProcessedJobId}
                  {workerStatus.lastProcessedAt
                    ? ` · ${formatAdminDate(workerStatus.lastProcessedAt)}`
                    : ""}
                </p>
              ) : null}
            </div>
            {!workerStatus.workerEnabled ? (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                <Server className="size-4 shrink-0" />
                {WORKER_DISABLED_MESSAGE}
              </div>
            ) : null}
            {workerStatus.storageMode === "db" ? (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <Info className="size-4 shrink-0" />
                {DB_STORAGE_WARNING}
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "access" ? (
          <div className="mt-4 space-y-4">
            <div className={cn(ADMIN_SECTION_TILE, "overflow-x-auto p-4")}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-zinc-500">
                    <th className="py-2 pr-4">Отчёт</th>
                    <th className="py-2 pr-4">Sensitive</th>
                    <th className="py-2">Роли</th>
                  </tr>
                </thead>
                <tbody>
                  {REPORT_CATALOG.map((r) => (
                    <tr key={r.value} className="border-b border-zinc-50">
                      <td className="py-2 pr-4 font-medium">{r.label}</td>
                      <td className="py-2 pr-4">{r.sensitive ? "Да" : "Нет"}</td>
                      <td className="py-2 text-xs text-zinc-400">{r.roles.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-zinc-500">
              Retry и download — COMPLIANCE/ACCOUNTANT/Super Admin согласно RBAC. Retention policy —
              TODO configurable.
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
