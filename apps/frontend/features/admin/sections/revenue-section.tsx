"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, Plus } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { AdminRevenueCreateDrawer } from "@/features/admin/components/admin-revenue-create-drawer";
import { AdminRevenueDrawer } from "@/features/admin/components/admin-revenue-drawer";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminPaginatedList } from "@/features/admin/hooks/use-admin-paginated-list";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import {
  formatRevenuePeriod,
  REVENUE_SOURCE_OPTIONS,
  revenueSourceLabel,
  revenueStatusLabel,
  revenueStatusTone,
} from "@/features/admin/lib/admin-revenue-i18n";
import {
  ADMIN_METRIC_NA_LABEL,
  formatAdminDate,
  formatAdminMetricUsdt,
  formatUsdtAmount,
  isAdminMetricEmpty,
} from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import type { AdminRevenueDetail, AdminRevenueListItem } from "@/features/admin/mocks/admin-revenue.mock";
import {
  AdminDataTable,
  AdminFilterBar,
  AdminPagination,
  AdminReadOnlyBanner,
  AdminSectionInfoHint,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import {
  getAdminRevenueEvent,
  getAdminRevenueSummary,
  listAdminRevenueEventsPaginated,
  approveAdminRevenueDistribution,
  previewAdminDistribution,
  retryAdminRevenueDistribution,
  runAdminDistribution,
  saveAdminDistributionPreview,
  submitAdminRevenueForReview,
  type AdminRevenueQuery,
} from "@/services/admin/adminRevenue.service";
import { cn } from "@/lib/utils";

const REVENUE_FILTER_OPTIONS = [
  { value: "all", label: "Все события" },
  { value: "pending", label: "Ожидают запуска" },
  { value: "failed", label: "Ошибочные" },
  { value: "completed", label: "Завершённые" },
  { value: "manual_review", label: "Ручная проверка" },
];

const STATUS_OPTIONS_BASE = [
  { value: "draft", label: revenueStatusLabel("draft") },
  { value: "calculated", label: revenueStatusLabel("calculated") },
  { value: "review", label: revenueStatusLabel("review") },
  { value: "approved", label: revenueStatusLabel("approved") },
  { value: "paid", label: revenueStatusLabel("paid") },
  { value: "failed", label: revenueStatusLabel("failed") },
  { value: "cancelled", label: revenueStatusLabel("cancelled") },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Сначала новые" },
  { value: "amount", label: "Крупнее доход" },
  { value: "failed_first", label: "Ошибки первыми" },
  { value: "pending_first", label: "Ожидающие первыми" },
  { value: "track", label: "По релизу" },
];

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "info" | "danger";
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400"
        : tone === "info"
          ? "text-sky-400"
          : tone === "danger"
            ? "text-red-400"
            : "text-zinc-100";
  const empty = isAdminMetricEmpty(value);
  return (
    <div className={cn(ADMIN_SECTION_TILE, "space-y-1")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
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
}

export function RevenueSection() {
  const a = useAdminI18n();
  const statusOptions = React.useMemo(
    () => [{ value: "all", label: a.actions.allStatuses }, ...STATUS_OPTIONS_BASE],
    [a],
  );
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const readOnly = perms.readOnly("Revenue");
  const canMutate = perms.can("Revenue", "update") || perms.can("Revenue", "approve");
  const canApproveRevenue = perms.can("Revenue", "approve");

  const loader = React.useCallback(
    (q: AdminRevenueQuery) => listAdminRevenueEventsPaginated(q, client),
    [client],
  );
  const { data: page, loading, error, query, setQuery, reload } = useAdminPaginatedList(loader);

  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getAdminRevenueSummary>> | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [revenueFilter, setRevenueFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("newest");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [minAmount, setMinAmount] = React.useState("");
  const [maxAmount, setMaxAmount] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<AdminRevenueDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const summaryQuery = React.useMemo(
    () => ({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
    [dateFrom, dateTo],
  );

  const loadSummary = React.useCallback(async () => {
    setSummaryLoading(true);
    try {
      setSummary(await getAdminRevenueSummary(client, summaryQuery));
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [client, summaryQuery]);

  React.useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  React.useEffect(() => {
    setQuery((q) => ({
      ...q,
      page: 1,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      source: sourceFilter === "all" ? undefined : sourceFilter,
      revenueFilter: revenueFilter === "all" ? undefined : revenueFilter,
      sortBy: sortBy === "newest" ? undefined : sortBy,
      sortDir: "desc",
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minAmount: minAmount || undefined,
      maxAmount: maxAmount || undefined,
    }));
  }, [search, statusFilter, sourceFilter, revenueFilter, sortBy, dateFrom, dateTo, minAmount, maxAmount, setQuery]);

  async function openDetail(row: AdminRevenueListItem) {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetail({ ...row, asset: "USDT", note: null });
    try {
      const loaded = await getAdminRevenueEvent(row.id, client);
      if (loaded) setDetail(loaded);
    } catch {
      /* keep list preview */
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshDetail() {
    if (!detail) return;
    const loaded = await getAdminRevenueEvent(detail.id, client);
    if (loaded) setDetail(loaded);
  }

  async function handleRun(note: string) {
    if (!detail) return;
    await runAdminDistribution(detail.id, note || undefined, client);
    await refreshDetail();
    await reload();
    void loadSummary();
  }

  async function handleRetry() {
    if (!detail) return;
    await retryAdminRevenueDistribution(detail.id, client);
    await refreshDetail();
    await reload();
    void loadSummary();
  }

  async function handleRefreshPreview() {
    if (!detail) return;
    const p = await previewAdminDistribution(detail.id, client);
    await saveAdminDistributionPreview(detail.id, client);
    setDetail((d) => (d ? { ...d, preview: p, status: "calculated" } : d));
    await refreshDetail();
  }

  async function handleSubmitReview() {
    if (!detail) return;
    await submitAdminRevenueForReview(detail.id, client);
    await refreshDetail();
    await reload();
  }

  async function handleApprove() {
    if (!detail) return;
    await approveAdminRevenueDistribution(detail.id, client);
    await refreshDetail();
    await reload();
  }

  const columns: AdminColumn<AdminRevenueListItem>[] = [
    {
      key: "id",
      header: a.table.id,
      render: (r) => (
        <span className="inline-flex items-center gap-1 font-mono text-[10px]">
          {r.id.slice(0, 10)}…
          <AdminCopyButton value={r.id} />
        </span>
      ),
    },
    {
      key: "release",
      header: "Релиз",
      render: (r) => (
        <div className="min-w-[160px]">
          <Link
            href={ROUTES.adminTracks}
            className="text-sm font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {r.trackTitle}
          </Link>
          {r.artistName ? <p className="text-xs text-zinc-500">{r.artistName}</p> : null}
        </div>
      ),
    },
    {
      key: "period",
      header: "Период",
      render: (r) => (
        <span className="whitespace-nowrap text-xs">{formatRevenuePeriod(r.periodFrom, r.periodTo)}</span>
      ),
    },
    {
      key: "source",
      header: "Источник",
      render: (r) => revenueSourceLabel(r.source),
    },
    {
      key: "gross",
      header: a.t("admin.table.gross"),
      render: (r) => <span className="tabular-nums font-medium">{formatUsdtAmount(r.grossRevenueUsdt)}</span>,
    },
    {
      key: "holders",
      header: "Держателям",
      render: (r) => formatUsdtAmount(r.holdersShareUsdt),
    },
    {
      key: "artist",
      header: "Артисту",
      render: (r) => formatUsdtAmount(r.artistShareUsdt),
    },
    {
      key: "platform",
      header: "Платформе",
      render: (r) => formatUsdtAmount(r.platformShareUsdt),
    },
    {
      key: "hc",
      header: "Держат.",
      render: (r) => r.holdersCount,
    },
    {
      key: "status",
      header: a.table.status,
      render: (r) => (
        <div className="flex flex-col gap-1">
          <AdminStatusBadge label={revenueStatusLabel(r.status)} tone={revenueStatusTone(r.status)} />
          {r.errorMessage ? (
            <span className="max-w-[120px] truncate text-[10px] text-red-600" title={r.errorMessage}>
              {r.errorMessage}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "by",
      header: "Создал",
      render: (r) => r.createdBy ?? "—",
    },
    {
      key: "created",
      header: a.table.created,
      render: (r) => (
        <span className="whitespace-nowrap text-xs tabular-nums">{formatAdminDate(r.createdAt)}</span>
      ),
    },
    {
      key: "open",
      header: "",
      render: (r) => (
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-sm font-medium hover:bg-zinc-800/60"
          onClick={(e) => {
            e.stopPropagation();
            void openDetail(r);
          }}
        >
          {a.actions.detail}
        </button>
      ),
    },
  ];

  return (
    <AdminSectionShell
      sectionId="revenue"
      title={a.adminSectionLabel("revenue")}
      actions={
        <div className="flex items-center gap-2">
          <Link href={ROUTES.adminAnalyticsRevenue}>
            <Button type="button" size="sm" variant="ghost" className={adminBtnOutline}>
              <BarChart3 className="mr-1.5 size-3.5" />
              Аналитика начислений
            </Button>
          </Link>
          {canMutate ? (
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 size-3.5" />
              Создать доход релиза
            </Button>
          ) : null}
          <AdminSectionRefreshButton
            onClick={() => {
              reload();
              void loadSummary();
            }}
          />
        </div>
      }
    >
      {readOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("revenue")} /> : null}

      <AdminSectionInfoHint>
        Управление доходами релизов Spliton, предпросмотром распределения и начислениями держателям юнитов через
        wallet ledger. Начисления рассчитываются автоматически на основе юнитов держателей; запуск выполняется
        оператором.
      </AdminSectionInfoHint>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9">
        <StatTile
          label={a.t("admin.kpi.revenue.releaseIncome")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.totalGrossRevenueUsdt ?? "0")}
        />
        <StatTile
          label={a.t("admin.kpi.revenue.paidToHolders")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.distributedToHoldersUsdt ?? "0")}
          tone="success"
        />
        <StatTile
          label={a.t("admin.kpi.revenue.platformShare")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.platformShareUsdt ?? "0")}
        />
        <StatTile
          label={a.t("admin.kpi.revenue.artistShare")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.artistShareUsdt ?? "0")}
        />
        <StatTile label={a.t("admin.kpi.revenue.pendingLaunch")} value={summaryLoading ? "…" : String(summary?.pendingCount ?? 0)} tone="info" />
        <StatTile
          label={a.t("admin.kpi.processing")}
          value={summaryLoading ? "…" : String(summary?.processingCount ?? 0)}
          tone="warning"
        />
        <StatTile label={a.t("admin.kpi.errors")} value={summaryLoading ? "…" : String(summary?.failedCount ?? 0)} tone="danger" />
        <StatTile
          label={a.t("admin.kpi.revenue.avgAccrual")}
          value={
            summaryLoading
              ? "…"
              : formatAdminMetricUsdt(summary?.avgPayoutPerHolderUsdt ?? null)
          }
        />
        <StatTile
          label={a.t("admin.kpi.revenue.activeEvents")}
          value={summaryLoading ? "…" : String(summary?.activeEventsCount ?? 0)}
        />
      </div>

      <AdminSectionPanel>
        <AdminFilterBar
          className="!rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
          fields={[
            {
              id: "search",
              label: "Поиск",
              type: "search",
              value: search,
              onChange: setSearch,
              placeholder: "Релиз, артист, event id…",
            },
            {
              id: "status",
              label: a.table.status,
              type: "select",
              value: statusFilter,
              onChange: setStatusFilter,
              options: statusOptions,
            },
            {
              id: "source",
              label: "Источник",
              type: "select",
              value: sourceFilter,
              onChange: setSourceFilter,
              options: REVENUE_SOURCE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            },
            {
              id: "revFilter",
              label: "Быстрый фильтр",
              type: "select",
              value: revenueFilter,
              onChange: setRevenueFilter,
              options: REVENUE_FILTER_OPTIONS,
            },
            {
              id: "sort",
              label: "Сортировка",
              type: "select",
              value: sortBy,
              onChange: setSortBy,
              options: SORT_OPTIONS,
            },
            {
              id: "from",
              label: "Дата с",
              type: "date",
              value: dateFrom,
              onChange: setDateFrom,
            },
            {
              id: "to",
              label: "Дата по",
              type: "date",
              value: dateTo,
              onChange: setDateTo,
            },
            {
              id: "minAmount",
              label: a.t("admin.filters.minUsdt"),
              type: "search",
              value: minAmount,
              onChange: setMinAmount,
              placeholder: "0",
            },
            {
              id: "maxAmount",
              label: a.t("admin.filters.maxUsdt"),
              type: "search",
              value: maxAmount,
              onChange: setMaxAmount,
              placeholder: "999999",
            },
          ]}
        />

        <AdminSectionDataArea loading={loading} error={error} onRetry={reload} loadingLabel="Загрузка доходов…">
          <AdminDataTable
            flat
            columns={columns}
            rows={page.items}
            rowKey={(r) => r.id}
            onRowClick={(r) => void openDetail(r)}
            emptyMessage={
              !loading && !error && page.items.length === 0
                ? "Доходы релизов ещё не добавлены"
                : a.empty.noData
            }
          />
          <AdminPagination
            page={query.page ?? 1}
            pageSize={query.pageSize ?? 20}
            total={page.total}
            onPageChange={(p) => setQuery((q) => ({ ...q, page: p }))}
          />
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminRevenueDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        event={detail}
        loading={detailLoading}
        canMutate={canMutate}
        canApprove={canApproveRevenue}
        onRun={handleRun}
        onRetry={isFailedStatus(detail?.status) ? handleRetry : undefined}
        onRefreshPreview={canMutate ? handleRefreshPreview : undefined}
        onSubmitReview={canMutate ? handleSubmitReview : undefined}
        onApprove={canApproveRevenue ? handleApprove : undefined}
      />

      {canMutate ? (
        <AdminRevenueCreateDrawer
          open={createOpen}
          onOpenChange={setCreateOpen}
          client={client}
          onCreated={() => {
            reload();
            void loadSummary();
          }}
        />
      ) : null}
    </AdminSectionShell>
  );
}

function isFailedStatus(status: string | undefined): boolean {
  return status === "failed";
}
