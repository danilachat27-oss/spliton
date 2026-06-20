"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, Info, ShieldAlert } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { AdminBarChart } from "@/features/admin/analytics/components/admin-charts.lazy";
import { AdminChartCard } from "@/features/admin/analytics/components/admin-chart-card";
import { AdminMetricTrendCard } from "@/features/admin/analytics/components/admin-metric-trend-card";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminComplianceDrawer,
  type CompliancePendingAction,
} from "@/features/admin/components/admin-compliance-drawer";
import {
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
  AdminSectionTabBar,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { useAdminPaginatedList } from "@/features/admin/hooks/use-admin-paginated-list";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import { useAdminSectionTab } from "@/features/admin/hooks/use-admin-section-tab";
import {
  COMPLIANCE_FIELD_TOOLTIPS,
  COMPLIANCE_SEVERITY_FILTER,
  COMPLIANCE_SORT_OPTIONS,
  COMPLIANCE_STATUS_OPTIONS,
  complianceEntityPath,
  formatSlaBadge,
} from "@/features/admin/lib/admin-compliance-i18n";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { complianceStatusTone } from "@/features/admin/lib/admin-status-maps";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import type {
  AdminComplianceDetail,
  AdminComplianceHistoryItem,
  AdminComplianceItem,
  AdminComplianceSummary,
  AdminRiskRule,
} from "@/features/admin/mocks/admin-compliance.mock";
import {
  AdminActionMenu,
  AdminDataTable,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminLocalizedStatusBadge,
  AdminPagination,
  AdminReadOnlyBanner,
  AdminRiskBadge,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import {
  addAdminComplianceNote,
  assignAdminComplianceFlag,
  blockAdminComplianceUser,
  dismissAdminComplianceFlag,
  escalateAdminComplianceFlag,
  freezeAdminComplianceOperation,
  getAdminComplianceFlag,
  getAdminComplianceSummary,
  getAdminRiskRules,
  listAdminComplianceHistory,
  listAdminCompliancePaginated,
  releaseAdminComplianceOperation,
  resolveAdminComplianceFlag,
  unblockAdminComplianceUser,
  type AdminComplianceQuery,
} from "@/services/admin/adminCompliance.service";
import { cn } from "@/lib/utils";

type ComplianceTab =
  | "overview"
  | "queue"
  | "users"
  | "withdrawals"
  | "trades"
  | "frozen"
  | "blocked"
  | "rules"
  | "history";

const TAB_CONFIG: Array<{
  id: ComplianceTab;
  label: string;
  entityType?: string;
  status?: string;
  queueFilter?: string;
}> = [
  { id: "overview", label: "Обзор" },
  { id: "queue", label: "Очередь проверки", queueFilter: "queue" },
  { id: "users", label: "Риск-пользователи", entityType: "user" },
  { id: "withdrawals", label: "Риск-выводы", entityType: "withdrawal" },
  { id: "trades", label: "Подозрительные сделки", entityType: "trade" },
  { id: "frozen", label: "Замороженные операции", queueFilter: "frozen" },
  { id: "blocked", label: "Заблокированные пользователи", queueFilter: "blocked" },
  { id: "rules", label: "Правила риска" },
  { id: "history", label: "История решений" },
];

function SeverityBadge({ severity }: { severity?: string }) {
  const a = useAdminI18n();
  if (!severity) return <span className="text-xs text-zinc-500">—</span>;
  const tone =
    severity === "critical"
      ? "danger"
      : severity === "high"
        ? "warning"
        : severity === "medium"
          ? "info"
          : "neutral";
  return (
    <AdminStatusBadge label={a.complianceSeverityLabel(severity) ?? severity} tone={tone} />
  );
}

export function ComplianceSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const [tab, setTab] = useAdminSectionTab<ComplianceTab>(
    TAB_CONFIG.map((t) => t.id),
    "overview",
  );
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [severityFilter, setSeverityFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("newest");
  const [minRisk, setMinRisk] = React.useState("");
  const [maxRisk, setMaxRisk] = React.useState("");

  const [summary, setSummary] = React.useState<AdminComplianceSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [summaryError, setSummaryError] = React.useState(false);
  const [rules, setRules] = React.useState<AdminRiskRule[]>([]);
  const [rulesLoading, setRulesLoading] = React.useState(false);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<AdminComplianceDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const canAct = perms.can("Compliance", "update");
  const readOnly = perms.readOnly("Compliance");

  const activeTab = TAB_CONFIG.find((t) => t.id === tab)!;
  const isListTab = !["overview", "rules", "history"].includes(tab);

  const listQuery = React.useMemo<AdminComplianceQuery>(
    () => ({
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      entityType: activeTab.entityType,
      queueFilter: activeTab.queueFilter,
      severity: severityFilter === "all" ? undefined : severityFilter,
      sortBy,
      minRiskScore: minRisk || undefined,
      maxRiskScore: maxRisk || undefined,
    }),
    [search, statusFilter, severityFilter, sortBy, minRisk, maxRisk, activeTab],
  );

  const loader = React.useCallback(
    (q: AdminComplianceQuery) => listAdminCompliancePaginated({ ...listQuery, ...q }, client),
    [client, listQuery],
  );

  const historyLoader = React.useCallback(
    (q: AdminComplianceQuery) => listAdminComplianceHistory(q, client),
    [client],
  );

  const flags = useAdminPaginatedList(loader);
  const historyList = useAdminPaginatedList(historyLoader);

  const loadSummary = React.useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(false);
    try {
      setSummary(await getAdminComplianceSummary(client));
    } catch {
      setSummaryError(true);
    } finally {
      setSummaryLoading(false);
    }
  }, [client]);

  const loadRules = React.useCallback(async () => {
    setRulesLoading(true);
    try {
      const res = await getAdminRiskRules(client);
      setRules(res.items);
    } finally {
      setRulesLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  React.useEffect(() => {
    if (tab === "rules") void loadRules();
  }, [tab, loadRules]);

  React.useEffect(() => {
    if (isListTab) flags.setQuery((q) => ({ ...q, page: 1 }));
  }, [tab, search, statusFilter, severityFilter, sortBy, minRisk, maxRisk]);

  const refreshAll = React.useCallback(() => {
    void loadSummary();
    if (isListTab) flags.reload();
    if (tab === "history") historyList.reload();
    if (tab === "rules") void loadRules();
  }, [loadSummary, isListTab, flags, tab, historyList, loadRules]);

  async function openRow(row: AdminComplianceItem) {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const loaded = await getAdminComplianceFlag(row.id, client);
      setDetail(loaded ?? row);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDrawerAction(
    action: CompliancePendingAction,
    note: string,
    extra?: string,
  ) {
    if (!detail) return;
    setActionError(null);
    try {
      if (action.action === "reviewed") {
        await resolveAdminComplianceFlag(detail.id, note, client);
      } else if (action.action === "dismiss") {
        await dismissAdminComplianceFlag(detail.id, note, client);
      } else if (action.action === "freeze") {
        await freezeAdminComplianceOperation(detail.reference, detail.kind, note, client);
      } else if (action.action === "release") {
        await releaseAdminComplianceOperation(detail.reference, detail.kind, note, client);
      } else if (action.action === "block" && detail.userId) {
        await blockAdminComplianceUser(detail.userId, note, client);
      } else if (action.action === "unblock" && detail.userId) {
        await unblockAdminComplianceUser(detail.userId, note, client);
      } else if (action.action === "note") {
        await addAdminComplianceNote(detail.id, note, client);
      } else if (action.action === "assign" && extra) {
        await assignAdminComplianceFlag(detail.id, extra, client);
      } else if (action.action === "escalate") {
        await escalateAdminComplianceFlag(detail.id, note, client);
      }
      setDrawerOpen(false);
      setDetail(null);
      refreshAll();
    } catch (e) {
      setActionError(localizedAdminError(e));
      throw e;
    }
  }

  const tabCounts: Partial<Record<ComplianceTab, number>> = {
    queue: summary?.openCount,
    users: summary?.usersCount,
    withdrawals: summary?.withdrawalsCount,
    trades: summary?.tradesCount,
    frozen: summary?.frozenCount,
    blocked: summary?.blockedUsersCount,
  };

  const severityChart =
    summary?.bySeverity?.map((s) => ({
      label: a.complianceSeverityLabel(s.severity) ?? s.severity,
      value: s.count,
    })) ?? [];

  const entityChart =
    summary?.byEntityType?.map((e) => ({
      label: a.complianceKindLabel(e.entityType) ?? e.entityType,
      value: e.count,
    })) ?? [];

  const columns: AdminColumn<AdminComplianceItem>[] = [
    {
      key: "id",
      header: a.t("admin.table.riskId"),
      render: (r) => (
        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
          {r.id.slice(0, 10)}…
          <AdminCopyButton value={r.id} />
        </span>
      ),
    },
    {
      key: "kind",
      header: a.table.type,
      render: (r) => (
        <span className="font-medium text-zinc-100">
          {a.complianceKindLabel(r.kind) ?? r.kind}
        </span>
      ),
    },
    {
      key: "ref",
      header: "Объект",
      render: (r) => {
        const href = complianceEntityPath(r);
        return (
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-200">
              {r.reference.slice(0, 12)}…
              <AdminCopyButton value={r.reference} />
            </span>
            {r.flagCode ? (
              <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{r.flagCode}</p>
            ) : null}
            {href ? (
              <Link
                href={href}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 inline-block text-[11px] font-semibold text-zinc-500 hover:text-zinc-100"
              >
                Открыть →
              </Link>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "user",
      header: a.table.user,
      render: (r) =>
        r.userId ? (
          <div className="min-w-0">
            <Link
              href={`${ROUTES.adminUsers}/${r.userId}`}
              onClick={(e) => e.stopPropagation()}
              className="max-w-[160px] truncate text-sm hover:underline"
              title={r.userEmail}
            >
              {r.userEmail ?? r.userId.slice(0, 8)}
            </Link>
            {r.userStatus === "suspended" ? (
              <AdminStatusBadge label="blocked" tone="danger" className="mt-1" />
            ) : null}
          </div>
        ) : (
          <span className="text-sm text-zinc-500">—</span>
        ),
    },
    {
      key: "severity",
      header: a.t("admin.table.severity"),
      render: (r) => <SeverityBadge severity={r.severity} />,
    },
    {
      key: "risk",
      header: a.table.risk,
      render: (r) => <AdminRiskBadge score={r.riskScore} />,
    },
    {
      key: "status",
      header: a.table.status,
      render: (caseRow) => (
        <AdminLocalizedStatusBadge status={caseRow.status} tone={complianceStatusTone(caseRow.status)} />
      ),
    },
    {
      key: "assignee",
      header: "Ответственный",
      render: (r) => (
        <span className="text-xs text-zinc-400">{r.assignedToEmail ?? "—"}</span>
      ),
    },
    {
      key: "sla",
      header: a.t("admin.table.sla"),
      render: (r) => {
        const sla = formatSlaBadge(r);
        return (
          <AdminStatusBadge label={sla.label} tone={sla.overdue ? "danger" : "neutral"} />
        );
      },
    },
    {
      key: "updated",
      header: a.table.updated,
      render: (r) => (
        <span className="text-xs tabular-nums text-zinc-500">{formatAdminDate(r.updatedAt)}</span>
      ),
    },
    {
      key: "note",
      header: a.table.note,
      className: "max-w-[180px]",
      render: (r) => (
        <span className="line-clamp-2 text-xs text-zinc-400" title={r.note}>
          {r.note || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button
          type="button"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-100"
          onClick={(e) => {
            e.stopPropagation();
            void openRow(r);
          }}
        >
          {canAct ? a.actions.review : a.actions.view}
        </button>
      ),
    },
  ];

  const historyColumns: AdminColumn<AdminComplianceHistoryItem>[] = [
    {
      key: "action",
      header: "Действие",
      render: (r) => <span className="font-mono text-xs">{a.formatAuditAction(r.action)}</span>,
    },
    {
      key: "entity",
      header: "Объект",
      render: (r) => (
        <span className="font-mono text-xs">
          {r.entityType}/{r.entityId.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "actor",
      header: "Оператор",
      render: (r) => r.actorEmail ?? "—",
    },
    {
      key: "at",
      header: "Дата",
      render: (r) => formatAdminDate(r.createdAt),
    },
  ];

  const ruleColumns: AdminColumn<AdminRiskRule>[] = [
    { key: "code", header: a.t("admin.table.code"), render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "title", header: "Название", render: (r) => r.title },
    { key: "sev", header: a.t("admin.table.severity"), render: (r) => <SeverityBadge severity={r.defaultSeverity} /> },
    { key: "entity", header: a.table.entity, render: (r) => r.entityType },
    {
      key: "enabled",
      header: "Статус",
      render: (r) => (
        <AdminStatusBadge label={r.enabled ? "enabled" : "disabled"} tone={r.enabled ? "success" : "neutral"} />
      ),
    },
    {
      key: "count",
      header: "30d",
      render: (r) => r.countLast30Days ?? "—",
    },
  ];

  const kpiCards = summary
    ? [
        { key: "open", label: "Открытые риск-сигналы", value: summary.openCount, tip: COMPLIANCE_FIELD_TOOLTIPS.openSignals, tab: "queue" as const },
        { key: "critical", label: "Критические риски", value: summary.criticalCount, tip: COMPLIANCE_FIELD_TOOLTIPS.critical, tab: "queue" as const, severity: "critical" },
        { key: "high", label: "Высокие риски", value: summary.highCount, tip: COMPLIANCE_FIELD_TOOLTIPS.high, tab: "queue" as const, severity: "high" },
        { key: "hold", label: "На удержании", value: summary.onHoldCount, tip: COMPLIANCE_FIELD_TOOLTIPS.onHold, tab: "frozen" as const },
        { key: "blocked", label: "Заблокированные пользователи", value: summary.blockedUsersCount, tip: COMPLIANCE_FIELD_TOOLTIPS.blocked, tab: "blocked" as const },
        { key: "frozen", label: "Замороженные операции", value: summary.frozenOpsCount, tip: COMPLIANCE_FIELD_TOOLTIPS.frozenOps, tab: "frozen" as const },
        { key: "avg", label: "Среднее время проверки", value: summary.avgReviewHours != null ? `${summary.avgReviewHours} ч` : "—", tip: COMPLIANCE_FIELD_TOOLTIPS.avgReview, tab: "history" as const },
        { key: "overdue", label: "Просроченные проверки", value: summary.overdueCount, tip: COMPLIANCE_FIELD_TOOLTIPS.overdue, tab: "queue" as const },
        { key: "new24", label: "Новые за 24 ч", value: summary.new24hCount, tip: COMPLIANCE_FIELD_TOOLTIPS.new24h, tab: "queue" as const },
        { key: "repeat", label: "Повторные нарушители", value: summary.repeatOffendersCount, tip: COMPLIANCE_FIELD_TOOLTIPS.repeatOffenders, tab: "users" as const },
      ]
    : [];

  return (
    <AdminSectionShell
      sectionId="compliance"
      title={a.t("admin.title.compliance")}
      actions={<AdminSectionRefreshButton onClick={refreshAll} />}
    >
      {readOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("compliance")} /> : null}

      <div className="flex gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3.5 shadow-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-zinc-400" />
        <p className="text-sm leading-relaxed text-zinc-400">
          Центр мониторинга риск-сигналов, подозрительных операций, заморозок, блокировок и
          compliance-расследований Spliton.
        </p>
      </div>

      {summaryLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={cn(ADMIN_SECTION_TILE, "h-24 animate-pulse bg-zinc-50")} />
          ))}
        </div>
      ) : summaryError ? (
        <AdminSectionPanel>
          <AdminErrorState onRetry={() => void loadSummary()} />
        </AdminSectionPanel>
      ) : summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {kpiCards.map((k) => (
            <AdminMetricTrendCard
              key={k.key}
              label={k.label}
              value={String(k.value)}
              tooltip={k.tip}
              onClick={() => {
                setTab(k.tab);
                if ("severity" in k && k.severity) setSeverityFilter(k.severity);
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={ROUTES.adminAnalyticsRisk}
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-zinc-100"
        >
          <BarChart3 className="size-4" />
          Открыть риск-аналитику
        </Link>
      </div>

      <AdminSectionPanel>
        <AdminSectionTabBar
          tabs={TAB_CONFIG.map((t) => ({
            id: t.id,
            label: t.label,
            count: tabCounts[t.id],
          }))}
          activeId={tab}
          onChange={(id) => {
            setTab(id as ComplianceTab);
            setStatusFilter("all");
            setSeverityFilter("all");
          }}
        />

        {tab === "overview" ? (
          <div className="space-y-6 pt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <AdminChartCard title="По severity">
                {severityChart.length ? (
                  <AdminBarChart items={severityChart} />
                ) : (
                  <p className="py-8 text-center text-sm text-zinc-500">Активных риск-сигналов нет</p>
                )}
              </AdminChartCard>
              <AdminChartCard title={a.t("admin.title.complianceByEntity")}>
                {entityChart.length ? (
                  <AdminBarChart items={entityChart} />
                ) : (
                  <p className="py-8 text-center text-sm text-zinc-500">Нет данных</p>
                )}
              </AdminChartCard>
            </div>
            <div className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-400">
              <Info className="mt-0.5 size-4 shrink-0" />
              Очередь проверки — открытые флаги, отсортированные по severity и SLA. Перейдите на вкладку «Очередь проверки» для работы с кейсами.
            </div>
          </div>
        ) : null}

        {tab === "rules" ? (
          rulesLoading ? (
            <AdminLoadingState label={a.t("admin.loading.rules")} />
          ) : (
            <>
              <p className="mb-4 text-sm text-zinc-500">
                Read-only каталог правил Spliton. Dynamic rules engine — TODO.
              </p>
              <AdminDataTable flat columns={ruleColumns} rows={rules} rowKey={(r) => r.code} />
            </>
          )
        ) : null}

        {tab === "history" ? (
          <>
            {historyList.loading ? <AdminLoadingState label={a.t("admin.loading.history")} /> : null}
            {historyList.error ? <AdminErrorState onRetry={historyList.reload} /> : null}
            {!historyList.loading && !historyList.error ? (
              <>
                <AdminDataTable
                  flat
                  columns={historyColumns}
                  rows={historyList.data.items}
                  rowKey={(r) => r.id}
                  emptyMessage="История compliance-решений пуста"
                />
                <AdminPagination
                  page={historyList.data.page}
                  pageSize={historyList.data.pageSize}
                  total={historyList.data.total}
                  onPageChange={(page) => historyList.setQuery((q) => ({ ...q, page }))}
                />
              </>
            ) : null}
          </>
        ) : null}

        {isListTab ? (
          <>
            <AdminFilterBar
              className="!rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
              fields={[
                {
                  id: "search",
                  label: "Поиск",
                  type: "search",
                  value: search,
                  onChange: setSearch,
                  placeholder: "Email, user id, risk id, object id, rule code…",
                },
                {
                  id: "status",
                  label: a.table.status,
                  type: "select",
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: COMPLIANCE_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
                },
                {
                  id: "severity",
                  label: a.t("admin.filters.severity"),
                  type: "select",
                  value: severityFilter,
                  onChange: setSeverityFilter,
                  options: COMPLIANCE_SEVERITY_FILTER.map((o) => ({ value: o.value, label: o.label })),
                },
                {
                  id: "sort",
                  label: "Сортировка",
                  type: "select",
                  value: sortBy,
                  onChange: setSortBy,
                  options: COMPLIANCE_SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
                },
              ]}
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    Risk min
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={minRisk}
                      onChange={(e) => setMinRisk(e.target.value)}
                      className="h-8 w-16 rounded-md border border-neutral-200 px-2 text-sm"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    Risk max
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={maxRisk}
                      onChange={(e) => setMaxRisk(e.target.value)}
                      className="h-8 w-16 rounded-md border border-neutral-200 px-2 text-sm"
                    />
                  </label>
                  <p className="text-xs text-zinc-500">
                    Найдено:{" "}
                    <span className="font-semibold tabular-nums text-zinc-200">{flags.data.total}</span>
                  </p>
                </div>
              }
            />

            {flags.loading ? <AdminLoadingState label={a.t("admin.loading.riskFlags")} /> : null}
            {flags.error ? <AdminErrorState onRetry={flags.reload} /> : null}

            {!flags.loading && !flags.error ? (
              <>
                <AdminDataTable
                  flat
                  columns={columns}
                  rows={flags.data.items}
                  rowKey={(r) => r.id}
                  onRowClick={openRow}
                  emptyMessage="Активных риск-сигналов нет"
                />
                <AdminPagination
                  page={flags.data.page}
                  pageSize={flags.data.pageSize}
                  total={flags.data.total}
                  onPageChange={(page) => flags.setQuery((q) => ({ ...q, page }))}
                />
              </>
            ) : null}
          </>
        ) : null}
      </AdminSectionPanel>

      <AdminSectionPanel>
        <div className="flex gap-3 text-sm text-zinc-400">
          <ShieldAlert className="size-5 shrink-0 text-zinc-500" aria-hidden />
          <p>
            Spliton Compliance Control Center — все действия фиксируются в{" "}
            <Link href={ROUTES.adminAudit} className="font-semibold text-zinc-200 hover:underline">
              журнале операторов
            </Link>
            .
          </p>
        </div>
      </AdminSectionPanel>

      {actionError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      <AdminComplianceDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        item={detail}
        loading={detailLoading}
        canMutate={canAct}
        onAction={handleDrawerAction}
      />
    </AdminSectionShell>
  );
}
