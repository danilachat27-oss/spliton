"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminAnalyticsExportButton } from "@/features/admin/analytics/components/admin-analytics-export-button";
import { AdminAnalyticsInsightsPanel } from "@/features/admin/analytics/components/admin-analytics-insights-panel";
import { AdminAnalyticsKpiGroup } from "@/features/admin/analytics/components/admin-analytics-kpi-group";
import { AdminChartCard } from "@/features/admin/analytics/components/admin-chart-card";
import { AdminBarChart, AdminLineChart } from "@/features/admin/analytics/components/admin-charts.lazy";
import { AdminMetricTrendCard } from "@/features/admin/analytics/components/admin-metric-trend-card";
import { AdminPeriodSelector } from "@/features/admin/analytics/components/admin-period-selector";
import {
  AdminOperationsAnalyticsFilters,
  type OperationsAnalyticsFilters,
} from "@/features/admin/analytics/components/admin-operations-analytics-filters";
import { useAnalyticsPeriod } from "@/features/admin/analytics/hooks/use-analytics-period";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDateShort } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { SUPPORT_PRIORITY_LABELS, SUPPORT_STATUS_LABELS, labelFromMap } from "@/features/admin/lib/admin-status-maps";
import { ANALYTICS_OPERATIONS_TABS } from "@/features/admin/analytics/config/analytics-page-tabs";
import { AdminAnalyticsPageShell } from "@/features/admin/analytics/ui/admin-analytics-page-shell";
import { AdminAnalyticsTabPanel } from "@/features/admin/analytics/ui/admin-analytics-tab-panel";
import { isBusinessAnalyst } from "@/features/admin/config/admin-rbac";
import {
  buildOperationsHealthSummary,
  buildOperationsInsights,
  financeEntityHref,
  formatDurationRu,
  formatHoursRu,
  OPS_CHART_EMPTY,
  OPS_KPI_TOOLTIPS,
  PRIORITY_BADGE,
  STATUS_BADGE,
  supportTicketHref,
} from "@/features/admin/lib/admin-operations-analytics-i18n";
import {
  getSupportAnalyticsByCategory,
  getSupportAnalyticsByStatus,
  getSupportAnalyticsEscalations,
  getSupportAnalyticsFinanceRelated,
  getSupportAnalyticsProductPainPoints,
  getSupportAnalyticsQueue,
  getSupportAnalyticsResolutionQuality,
  getSupportAnalyticsResponseTime,
  getSupportAnalyticsSla,
  getSupportAnalyticsSummary,
  getSupportAnalyticsWorkload,
} from "@/services/admin/adminSupportAnalytics.service";
import {
  AdminDataTable,
  AdminErrorState,
  AdminLoadingState,
  type AdminColumn,
} from "@/features/admin/ui";
import { cn } from "@/lib/utils";
import {
  adminAnalyticsHealthBannerBodyClass,
  adminAnalyticsHealthBannerSurface,
  adminAnalyticsHealthBannerTitleClass,
} from "@/features/admin/analytics/lib/admin-analytics-theme";

function pickOpsSummary(s: Record<string, unknown> | null) {
  return {
    openTickets: Number(s?.openTickets ?? 0),
    inProgressTickets: Number(s?.inProgressTickets ?? 0),
    waitingUserTickets: Number(s?.waitingUserTickets ?? 0),
    unassignedOpen: Number(s?.unassignedOpen ?? 0),
    escalatedTickets: Number(s?.escalatedTickets ?? 0),
    financeRelatedTickets: Number(s?.financeRelatedTickets ?? 0),
    depositTickets: Number(s?.depositTickets ?? 0),
    withdrawalTickets: Number(s?.withdrawalTickets ?? 0),
    marketTickets: Number(s?.marketTickets ?? 0),
    payoutsTickets: Number(s?.payoutsTickets ?? 0),
    createdInPeriod: Number(s?.createdInPeriod ?? 0),
    closedInPeriod: Number(s?.closedInPeriod ?? 0),
    overdueSla: Number(s?.overdueSla ?? 0),
    oldestOpenHours: Number(s?.oldestOpenHours ?? 0),
    averageFirstResponseMinutes: s?.averageFirstResponseMinutes != null ? Number(s.averageFirstResponseMinutes) : null,
    averageResolutionHours: s?.averageResolutionHours != null ? Number(s.averageResolutionHours) : null,
    slaCompliancePct: s?.slaCompliancePct != null ? Number(s.slaCompliancePct) : null,
    activeManagers: Number(s?.activeManagers ?? 0),
    avgManagerLoad: Number(s?.avgManagerLoad ?? 0),
    maxManagerLoad: Number(s?.maxManagerLoad ?? 0),
    reopenedTickets: Number(s?.reopenedTickets ?? 0),
    deltas: (s?.deltas ?? {}) as { createdPct?: number | null; closedPct?: number | null },
  };
}

function StatusBadge({ status }: { status: string }) {
  const a = useAdminI18n();
  const key = status.toLowerCase();
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_BADGE[key] ?? STATUS_BADGE.open)}>
      {a.formatAdminStatus(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const key = priority.toLowerCase();
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY_BADGE[key] ?? PRIORITY_BADGE.medium)}>
      {labelFromMap(SUPPORT_PRIORITY_LABELS, priority)}
    </span>
  );
}

const DRILL_LINK_KEYS = [
  { href: ROUTES.adminSupport, section: "support" },
  { href: ROUTES.adminDeposits, section: "deposits" },
  { href: ROUTES.adminWithdrawals, section: "withdrawals" },
  { href: ROUTES.adminWallets, section: "wallets" },
  { href: ROUTES.adminCompliance, section: "compliance" },
  { href: ROUTES.adminReports, section: "reports" },
] as const;

export function AnalyticsOperationsSection() {
  const a = useAdminI18n();
  const op = React.useCallback((key: string) => a.t(`admin.analytics.operations.${key}`), [a]);
  const drillLinks = React.useMemo(
    () => DRILL_LINK_KEYS.map((item) => ({ href: item.href, label: a.adminSectionLabel(item.section) })),
    [a],
  );
  const client = useAdminApi();
  const { user } = useAuth();
  const analyst = isBusinessAnalyst(user?.roles);
  const supportFocus = user?.roles?.includes("SUPPORT_MANAGER") ?? false;
  const accountantFocus =
    (user?.roles?.includes("ACCOUNTANT") ?? false) && !supportFocus;

  const { period, setPeriod, query: baseQuery, customFrom, customTo, setCustomDates } = useAnalyticsPeriod("30d");
  const [filters, setFilters] = React.useState<OperationsAnalyticsFilters>({
    status: "",
    category: "",
    priority: "",
    team: "",
    managerId: "",
    groupBy: "",
    onlyEscalated: false,
    onlyFinance: false,
    onlyOverdue: false,
    onlyUnassigned: false,
    onlyHighPriority: false,
  });

  const query = React.useMemo(() => {
    let hasRisk: string | undefined;
    if (filters.onlyEscalated) hasRisk = "true";
    else if (filters.onlyOverdue) hasRisk = "overdue";

    let hasHoldings: string | undefined;
    if (filters.onlyUnassigned) hasHoldings = "unassigned";
    else if (filters.onlyHighPriority) hasHoldings = "high_priority";

    return {
      ...baseQuery,
      granularity: (filters.groupBy || baseQuery.granularity) as "day" | "week" | "month" | undefined,
      status: filters.status || undefined,
      segment: filters.category || undefined,
      source: filters.priority || undefined,
      role: filters.team || undefined,
      managerId: filters.managerId || undefined,
      hasRisk,
      hasDeposit: filters.onlyFinance ? "true" : undefined,
      hasHoldings,
    };
  }, [baseQuery, filters]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getSupportAnalyticsSummary>> | null>(null);
  const [byStatus, setByStatus] = React.useState<Awaited<ReturnType<typeof getSupportAnalyticsByStatus>> | null>(null);
  const [byCategory, setByCategory] = React.useState<Awaited<ReturnType<typeof getSupportAnalyticsByCategory>> | null>(null);
  const [responseTime, setResponseTime] = React.useState<Awaited<ReturnType<typeof getSupportAnalyticsResponseTime>> | null>(null);
  const [queue, setQueue] = React.useState<Awaited<ReturnType<typeof getSupportAnalyticsQueue>> | null>(null);
  const [sla, setSla] = React.useState<Awaited<ReturnType<typeof getSupportAnalyticsSla>> | null>(null);
  const [finance, setFinance] = React.useState<Awaited<ReturnType<typeof getSupportAnalyticsFinanceRelated>> | null>(null);
  const [escalations, setEscalations] = React.useState<Awaited<ReturnType<typeof getSupportAnalyticsEscalations>> | null>(null);
  const [workload, setWorkload] = React.useState<Awaited<ReturnType<typeof getSupportAnalyticsWorkload>> | null>(null);
  const [resolution, setResolution] = React.useState<
    Awaited<ReturnType<typeof getSupportAnalyticsResolutionQuality>> | null
  >(null);
  const [painPoints, setPainPoints] = React.useState<
    Awaited<ReturnType<typeof getSupportAnalyticsProductPainPoints>> | null
  >(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      getSupportAnalyticsSummary(query, client),
      getSupportAnalyticsByStatus(query, client),
      getSupportAnalyticsByCategory(query, client),
      getSupportAnalyticsResponseTime(query, client),
      getSupportAnalyticsQueue(query, client),
      getSupportAnalyticsSla(query, client),
      getSupportAnalyticsFinanceRelated(query, client),
      getSupportAnalyticsEscalations(query, client),
      getSupportAnalyticsWorkload(query, client),
      getSupportAnalyticsResolutionQuality(query, client),
      getSupportAnalyticsProductPainPoints(query, client),
    ])
      .then(([s, st, cat, rt, q, sl, fin, esc, wl, res, pain]) => {
        setSummary(s);
        setByStatus(st);
        setByCategory(cat);
        setResponseTime(rt);
        setQueue(q);
        setSla(sl);
        setFinance(fin);
        setEscalations(esc);
        setWorkload(wl);
        setResolution(res);
        setPainPoints(pain);
        setLastUpdated(new Date().toISOString());
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [client, query]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading && !summary) {
    return <AdminLoadingState label={a.t("admin.analytics.operations.loading")} centered />;
  }

  if (error) {
    return <AdminErrorState onRetry={load} />;
  }

  const s = pickOpsSummary(summary as Record<string, unknown> | null);
  const hasActivity = s.createdInPeriod > 0 || s.openTickets > 0;
  const topManager = workload?.items?.[0];
  const overloadedManager =
    topManager && topManager.openTickets >= s.maxManagerLoad && s.maxManagerLoad > 5
      ? topManager.managerEmail
      : null;

  const depositShare =
    s.createdInPeriod > 0 ? s.depositTickets / s.createdInPeriod : 0;
  const marketShare =
    s.createdInPeriod > 0 ? s.marketTickets / s.createdInPeriod : 0;

  const issues: string[] = [];
  if (s.overdueSla > 0) issues.push(op("issue.overdueSla"));
  if (s.unassignedOpen > 0 && s.financeRelatedTickets > 0) {
    issues.push(op("issue.financeUnassigned"));
  }
  if (depositShare > 0.35) issues.push(op("issue.depositSpike"));
  if (marketShare > 0.25) issues.push(op("issue.marketSpike"));

  const health = buildOperationsHealthSummary({
    hasActivity,
    created: s.createdInPeriod,
    closed: s.closedInPeriod,
    open: s.openTickets,
    firstResponseMinutes: s.averageFirstResponseMinutes,
    overdue: s.overdueSla,
    issues,
  });

  const insights = buildOperationsInsights({
    unassigned: s.unassignedOpen,
    overdue: s.overdueSla,
    financeUnassigned: s.unassignedOpen > 0 ? s.financeRelatedTickets : 0,
    depositSpike: depositShare > 0.35,
    marketSpike: marketShare > 0.25,
    overloadedManager,
    repeatUsers: resolution?.repeatedUsersCount ?? 0,
    noActivity: !hasActivity,
  });

  const createdTrend = (byStatus?.trend ?? []).map((i) => i.count);
  const categoryTrend = (byCategory?.trend ?? []).map((i) => ({ period: i.period, value: i.count }));
  const resolutionTrend = (responseTime?.items ?? []).map((i) => ({
    period: i.period,
    value: i.averageHours ?? 0,
  }));
  const firstResponseTrend = (responseTime?.firstResponseTrend ?? []).map((i) => ({
    period: i.period,
    value: i.averageMinutes ?? 0,
  }));

  const managerOptions = (workload?.items ?? []).map((m) => ({
    id: m.managerId,
    label: m.managerEmail,
  }));

  const queueCols: AdminColumn<{
    ticketId: string;
    userEmail: string;
    subject: string;
    categoryLabel: string;
    priority: string;
    status: string;
    assignedTo: string | null;
    slaOverdue: boolean;
    relatedEntityId: string | null;
    lastMessagePreview: string | null;
    updatedAt: string;
    userId: string;
    category: string;
  }>[] = [
    {
      key: "id",
      header: a.table.ticket,
      render: (r) => <span className="font-mono text-xs">{r.ticketId.slice(0, 8)}…</span>,
    },
    {
      key: "user",
      header: a.table.user,
      render: (r) =>
        analyst ? (
          r.userEmail
        ) : (
          <Link href={ROUTES.adminUserDetail(r.userId)} className="hover:underline">
            {r.userEmail}
          </Link>
        ),
    },
    { key: "subject", header: op("col.subject"), render: (r) => <span className="max-w-[160px] truncate block">{r.subject}</span> },
    { key: "cat", header: a.table.category, render: (r) => r.categoryLabel },
    { key: "prio", header: a.table.priority, render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: "status", header: a.table.status, render: (ticketRow) => <StatusBadge status={ticketRow.status} /> },
    { key: "owner", header: op("col.assignee"), render: (r) => r.assignedTo ?? "—" },
    {
      key: "entity",
      header: a.t("admin.drawer.common.operation"),
      render: (r) =>
        r.relatedEntityId ? (
          <Link href={financeEntityHref(r.category, r.relatedEntityId)} className="font-mono text-xs hover:underline">
            {r.relatedEntityId.slice(0, 8)}…
          </Link>
        ) : (
          "—"
        ),
    },
    {
      key: "msg",
      header: op("col.lastMessage"),
      render: (r) => (
        <span className="max-w-[140px] truncate block text-xs text-zinc-500">{r.lastMessagePreview ?? "—"}</span>
      ),
    },
    {
      key: "sla",
      header: a.t("admin.table.sla"),
      render: (r) =>
        r.slaOverdue ? (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-800">{op("col.overdue")}</span>
        ) : (
          a.t("admin.common.ok")
        ),
    },
    { key: "updated", header: a.table.updated, render: (r) => formatAdminDateShort(r.updatedAt) },
    {
      key: "action",
      header: "",
      render: (r) =>
        analyst ? null : (
          <span className="flex gap-2">
            <Link href={supportTicketHref(r.ticketId)} className="text-xs text-blue-600 hover:underline">
              {op("col.ticket")}
            </Link>
            <Link href={ROUTES.adminAudit} className="text-xs text-zinc-500 hover:underline">
              {a.t("admin.common.audit")}
            </Link>
          </span>
        ),
    },
  ];

  const financeCols: AdminColumn<{
    ticketId: string;
    userEmail: string;
    categoryLabel: string;
    status: string;
    priority: string;
    assignedTo: string | null;
    slaOverdue: boolean;
    userId: string;
    category: string;
    relatedEntityId: string | null;
  }>[] = [
    { key: "id", header: a.table.ticket, render: (r) => r.ticketId.slice(0, 8) + "…" },
    { key: "user", header: a.table.user, render: (r) => r.userEmail },
    { key: "cat", header: a.table.category, render: (r) => r.categoryLabel },
    { key: "status", header: a.table.status, render: (financeRow) => <StatusBadge status={financeRow.status} /> },
    {
      key: "action",
      header: "",
      render: (r) =>
        analyst ? null : (
          <Link href={financeEntityHref(r.category, r.relatedEntityId)} className="text-xs text-blue-600 hover:underline">
            {a.t("admin.drawer.common.operation")}
          </Link>
        ),
    },
  ];

  const workloadCols: AdminColumn<{
    managerEmail: string;
    openTickets: number;
    inProgressTickets: number;
    closedInPeriod: number;
    avgResolutionHours: number | null;
    avgFirstResponseMinutes: number | null;
    slaCompliancePct: number | null;
    escalatedCount: number;
  }>[] = [
    { key: "mgr", header: a.t("admin.analytics.common.manager"), render: (r) => r.managerEmail },
    { key: "open", header: op("col.open"), render: (r) => String(r.openTickets) },
    { key: "wip", header: op("col.inProgress"), render: (r) => String(r.inProgressTickets) },
    { key: "closed", header: op("col.closed"), render: (r) => String(r.closedInPeriod) },
    {
      key: "fr",
      header: op("col.firstResponse"),
      render: (r) => formatDurationRu(r.avgFirstResponseMinutes),
    },
    {
      key: "res",
      header: op("col.resolution"),
      render: (r) => formatHoursRu(r.avgResolutionHours),
    },
    {
      key: "sla",
      header: a.t("admin.table.slaPct"),
      render: (r) =>
        r.slaCompliancePct != null ? `${r.slaCompliancePct}%` : op("noComparisonData"),
    },
    { key: "esc", header: op("col.escalations"), render: (r) => String(r.escalatedCount) },
  ];

  const escCols: AdminColumn<{
    ticketId: string;
    categoryLabel: string;
    escalatedTo: string;
    reason: string;
    hoursInEscalation: number;
  }>[] = [
    { key: "id", header: a.table.ticket, render: (r) => r.ticketId.slice(0, 8) + "…" },
    { key: "cat", header: a.table.category, render: (r) => r.categoryLabel },
    { key: "to", header: op("col.escalatedTo"), render: (r) => r.escalatedTo },
    { key: "reason", header: op("col.reason"), render: (r) => <span className="max-w-[200px] truncate block">{r.reason}</span> },
    { key: "hours", header: op("col.inEscalation"), render: (r) => formatHoursRu(r.hoursInEscalation) },
    {
      key: "action",
      header: "",
      render: (r) =>
        analyst ? null : (
          <Link href={supportTicketHref(r.ticketId)} className="text-xs text-blue-600 hover:underline">
            {op("col.ticket")}
          </Link>
        ),
    },
  ];

  const healthBannerClass = adminAnalyticsHealthBannerSurface(health.tone);

  const showFullOps = !accountantFocus;

  return (
    <AdminAnalyticsPageShell
      activeSection="analyticsOperations"
      title={a.t("admin.analytics.operations.title")}
      description={a.t("admin.analytics.operations.description")}
      breadcrumbs={a.adminSectionBreadcrumbs("analyticsOperations")}
      pageTabs={ANALYTICS_OPERATIONS_TABS}
      filters={
        <AdminOperationsAnalyticsFilters
          value={filters}
          onChange={setFilters}
          managerOptions={managerOptions}
        />
      }
      actions={
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <AdminPeriodSelector value={period} onChange={setPeriod} customFrom={customFrom} customTo={customTo} onCustomDatesChange={setCustomDates} />
            <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={load} disabled={loading}>
              {loading ? a.t("admin.analytics.common.refreshing") : a.t("admin.analytics.common.refresh")}
            </Button>
            <AdminAnalyticsExportButton
              reportType="support_tickets"
              label={a.t("admin.analytics.common.generateReport")}
            />
          </div>
          {lastUpdated ? (
            <p className="text-xs text-zinc-500">
              {a.t("admin.analytics.common.updatedAt")} {formatAdminDateShort(lastUpdated)}
            </p>
          ) : null}
        </div>
      }
    >
      {(tab) => (
        <>
        <AdminAnalyticsTabPanel activeTab={tab} tabId="overview">
        <div className={cn(ADMIN_SECTION_TILE, "border p-5", healthBannerClass)}>
          <h2 className={cn("text-sm font-semibold", adminAnalyticsHealthBannerTitleClass(health.tone))}>
            {health.title}
          </h2>
          <p className={cn("mt-2 text-sm leading-relaxed", adminAnalyticsHealthBannerBodyClass(health.tone))}>
            {health.body}
          </p>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <AdminAnalyticsKpiGroup title={op("kpiGroup.queue")}>
              <AdminMetricTrendCard
                label={op("kpi.openTickets")}
                value={String(s.openTickets)}
                tooltip={OPS_KPI_TOOLTIPS.open}
                href={ROUTES.adminSupport}
                trend={createdTrend}
                deltaPct={s.deltas.createdPct}
              />
              <AdminMetricTrendCard label={op("kpi.inProgress")} value={String(s.inProgressTickets)} tooltip={OPS_KPI_TOOLTIPS.inProgress} />
              <AdminMetricTrendCard label={op("kpi.waitingUser")} value={String(s.waitingUserTickets)} tooltip={OPS_KPI_TOOLTIPS.waiting} />
              <AdminMetricTrendCard label={op("kpi.unassigned")} value={String(s.unassignedOpen)} href={ROUTES.adminSupport} />
              <AdminMetricTrendCard label={op("kpi.escalated")} value={String(s.escalatedTickets)} tooltip={OPS_KPI_TOOLTIPS.escalated} />
            </AdminAnalyticsKpiGroup>

            <AdminAnalyticsKpiGroup title={op("kpiGroup.sla")}>
              <AdminMetricTrendCard label={op("kpi.overdueSla")} value={String(s.overdueSla)} tooltip={OPS_KPI_TOOLTIPS.overdue} href={ROUTES.adminSupport} />
              <AdminMetricTrendCard
                label={op("col.firstResponse")}
                value={formatDurationRu(s.averageFirstResponseMinutes)}
                tooltip={OPS_KPI_TOOLTIPS.firstResponse}
              />
              <AdminMetricTrendCard
                label={op("kpi.resolutionTime")}
                value={formatHoursRu(s.averageResolutionHours)}
                tooltip={OPS_KPI_TOOLTIPS.resolution}
              />
              <AdminMetricTrendCard
                label={op("kpi.slaPct")}
                value={s.slaCompliancePct != null ? `${s.slaCompliancePct}%` : op("noComparisonData")}
                tooltip={OPS_KPI_TOOLTIPS.slaCompliance}
              />
              <AdminMetricTrendCard label={op("kpi.oldestTicket")} value={formatHoursRu(s.oldestOpenHours)} />
            </AdminAnalyticsKpiGroup>

            <AdminAnalyticsKpiGroup title={op("kpiGroup.finance")}>
              <AdminMetricTrendCard label={op("kpi.financeTickets")} value={String(s.financeRelatedTickets)} tooltip={OPS_KPI_TOOLTIPS.finance} href={ROUTES.adminSupport} />
              <AdminMetricTrendCard label={op("kpi.deposits")} value={String(s.depositTickets)} href={ROUTES.adminDeposits} />
              <AdminMetricTrendCard label={op("kpi.withdrawals")} value={String(s.withdrawalTickets)} href={ROUTES.adminWithdrawals} />
              <AdminMetricTrendCard label={op("kpi.secondaryMarket")} value={String(s.marketTickets)} href={ROUTES.adminSecondaryMarket} />
              <AdminMetricTrendCard label={op("kpi.payouts")} value={String(s.payoutsTickets)} href={ROUTES.adminRevenue} />
            </AdminAnalyticsKpiGroup>

            {showFullOps ? (
              <AdminAnalyticsKpiGroup title={op("kpiGroup.team")}>
                <AdminMetricTrendCard label={op("kpi.activeManagers")} value={String(s.activeManagers)} />
                <AdminMetricTrendCard label={op("kpi.avgLoad")} value={String(s.avgManagerLoad)} />
                <AdminMetricTrendCard label={op("kpi.maxLoad")} value={String(s.maxManagerLoad)} />
                <AdminMetricTrendCard
                label={op("kpi.closedInPeriod")}
                value={String(s.closedInPeriod)}
                deltaPct={s.deltas.closedPct}
                href={ROUTES.adminSupport}
              />
                <AdminMetricTrendCard label={op("kpi.reopenedEstimate")} value={String(s.reopenedTickets)} />
              </AdminAnalyticsKpiGroup>
            ) : null}
          </div>

          <aside className="space-y-4">
            <AdminAnalyticsInsightsPanel items={insights} className="xl:sticky xl:top-4 xl:self-start" />
            <div className={cn(ADMIN_SECTION_TILE, "border p-4")}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{op("drilldowns")}</h3>
              <ul className="mt-3 space-y-2">
                {drillLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="flex items-center justify-between text-sm text-zinc-200 hover:text-blue-600">
                      {l.label}
                      <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
        </AdminAnalyticsTabPanel>

        <AdminAnalyticsTabPanel activeTab={tab} tabId="queue">
            <div className={cn(ADMIN_SECTION_TILE, "p-4")}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-100">{op("supportQueue")}</h3>
                <Link href={ROUTES.adminSupport} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  {a.adminSectionLabel("support")} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="mt-4 overflow-x-auto">
                <AdminDataTable
                  columns={queueCols}
                  rows={queue?.items ?? []}
                  rowKey={(r) => r.ticketId}
                  emptyMessage={OPS_CHART_EMPTY.queue.description}
                />
              </div>
            </div>
        </AdminAnalyticsTabPanel>

        <AdminAnalyticsTabPanel activeTab={tab} tabId="sla">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100">{op("slaAndSpeed")}</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <AdminMetricTrendCard label={op("avgOpenAge")} value={formatHoursRu(sla?.averageAgeHours ?? 0)} />
              <AdminMetricTrendCard label={op("overdue")} value={String(sla?.overdueTotal ?? 0)} href={ROUTES.adminSupport} />
            </div>
            <AdminChartCard
              title={op("ticketAge")}
              empty={!(sla?.buckets ?? []).some((b) => b.count > 0)}
              emptyTitle={OPS_CHART_EMPTY.queue.title}
              emptyDescription={OPS_CHART_EMPTY.queue.description}
            >
              <AdminBarChart items={(sla?.buckets ?? []).map((b) => ({ label: b.label, value: b.count }))} />
            </AdminChartCard>
            <div className="grid gap-4 xl:grid-cols-2">
              <AdminChartCard
                title={op("resolutionTrend")}
                empty={resolutionTrend.length < 2}
                emptyTitle={OPS_CHART_EMPTY.response.title}
                emptyDescription={OPS_CHART_EMPTY.response.description}
              >
                <AdminLineChart points={resolutionTrend} formatValue={(v) => `${v.toFixed(1)} ч`} />
              </AdminChartCard>
              <AdminChartCard
                title={op("firstResponseTrend")}
                empty={firstResponseTrend.length < 2}
                emptyTitle={OPS_CHART_EMPTY.response.title}
                emptyDescription={op("firstResponseEmpty")}
              >
                <AdminLineChart points={firstResponseTrend} formatValue={(v) => formatDurationRu(v)} />
              </AdminChartCard>
            </div>
          </div>
        </AdminAnalyticsTabPanel>

        <AdminAnalyticsTabPanel activeTab={tab} tabId="categories">
          <div className="grid gap-4 xl:grid-cols-2">
            <AdminChartCard
              title={op("byStatus")}
              empty={!byStatus?.items?.length}
              emptyTitle={OPS_CHART_EMPTY.status.title}
              emptyDescription={OPS_CHART_EMPTY.status.description}
              drilldownHref={ROUTES.adminSupport}
            >
              <AdminBarChart
                items={(byStatus?.items ?? []).map((i) => ({
                  label: labelFromMap(SUPPORT_STATUS_LABELS, i.status),
                  value: i.count,
                }))}
              />
            </AdminChartCard>
            <AdminChartCard
              title={op("byCategory")}
              empty={!byCategory?.items?.length}
              emptyTitle={OPS_CHART_EMPTY.category.title}
              emptyDescription={OPS_CHART_EMPTY.category.description}
            >
              <AdminBarChart items={(byCategory?.items ?? []).map((i) => ({ label: i.label, value: i.count }))} />
            </AdminChartCard>
            <AdminChartCard
              title={op("categoryTrend")}
              empty={categoryTrend.length < 2}
              emptyTitle={OPS_CHART_EMPTY.category.title}
              emptyDescription={OPS_CHART_EMPTY.category.description}
            >
              <AdminLineChart points={categoryTrend} />
            </AdminChartCard>
            <AdminChartCard
              title={op("slaOverdueByPriority")}
              empty={!sla?.overdueByPriority?.length}
              emptyDescription={op("noSlaOverdueByPriority")}
            >
              <AdminBarChart
                items={(sla?.overdueByPriority ?? []).map((i) => ({
                  label: labelFromMap(SUPPORT_PRIORITY_LABELS, i.priority),
                  value: i.count,
                }))}
              />
            </AdminChartCard>
          </div>
        </AdminAnalyticsTabPanel>

        <AdminAnalyticsTabPanel activeTab={tab} tabId="finance">
          <AdminChartCard
            title={op("financeTicketsTitle")}
            empty={!finance?.items?.length}
            emptyTitle={OPS_CHART_EMPTY.finance.title}
            emptyDescription={OPS_CHART_EMPTY.finance.description}
            drilldownHref={ROUTES.adminSupport}
          >
            <AdminDataTable columns={financeCols} rows={finance?.items ?? []} rowKey={(r) => r.ticketId} />
          </AdminChartCard>
        </AdminAnalyticsTabPanel>

        <AdminAnalyticsTabPanel activeTab={tab} tabId="escalations">
          <AdminChartCard
            title={op("escalationsTitle")}
            empty={!escalations?.items?.length}
            emptyTitle={OPS_CHART_EMPTY.escalations.title}
            emptyDescription={OPS_CHART_EMPTY.escalations.description}
            drilldownHref={ROUTES.adminSupport}
          >
            <AdminDataTable columns={escCols} rows={escalations?.items ?? []} rowKey={(r) => r.ticketId} />
          </AdminChartCard>
        </AdminAnalyticsTabPanel>

        <AdminAnalyticsTabPanel activeTab={tab} tabId="workload">
          {showFullOps ? (
            <div className="space-y-4">
              <AdminChartCard
                title={op("managerWorkload")}
                empty={!workload?.items?.length}
                emptyTitle={OPS_CHART_EMPTY.manager.title}
                emptyDescription={OPS_CHART_EMPTY.manager.description}
              >
                <AdminDataTable columns={workloadCols} rows={workload?.items ?? []} rowKey={(r) => r.managerEmail} />
              </AdminChartCard>
              <div className="grid gap-4 xl:grid-cols-2">
                <AdminChartCard title={op("workloadOpen")} empty={!workload?.items?.length} emptyDescription={OPS_CHART_EMPTY.manager.description}>
                  <AdminBarChart
                    items={(workload?.items ?? []).map((i) => ({
                      label: i.managerEmail.split("@")[0] ?? i.managerEmail,
                      value: i.openTickets,
                    }))}
                  />
                </AdminChartCard>
                <AdminChartCard title={op("kpi.closedInPeriod")} empty={!workload?.items?.length} emptyDescription={OPS_CHART_EMPTY.manager.description}>
                  <AdminBarChart
                    items={(workload?.items ?? []).map((i) => ({
                      label: i.managerEmail.split("@")[0] ?? i.managerEmail,
                      value: i.closedInPeriod,
                    }))}
                  />
                </AdminChartCard>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">{op("workloadRestricted")}</p>
          )}
        </AdminAnalyticsTabPanel>

        <AdminAnalyticsTabPanel activeTab={tab} tabId="quality">
          <div className="space-y-4">
            <div className={cn(ADMIN_SECTION_TILE, "border p-4")}>
              <h3 className="text-sm font-semibold text-zinc-100">{op("qualityTitle")}</h3>
              <p className="mt-1 text-xs text-zinc-500">{resolution?.note}</p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <div>
                  <dt className="text-zinc-500">{op("closed")}</dt>
                  <dd className="font-semibold tabular-nums">{resolution?.closedTickets ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{op("repeatUsers")}</dt>
                  <dd className="font-semibold tabular-nums">{resolution?.repeatedUsersCount ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{op("closedWithoutResponse")}</dt>
                  <dd className="font-semibold tabular-nums">{resolution?.closedWithoutResponseCount ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{op("avgMessages")}</dt>
                  <dd className="font-semibold tabular-nums">
                    {resolution?.avgMessagesPerTicket ?? op("noComparisonData")}
                  </dd>
                </div>
              </dl>
            </div>
            <AdminChartCard
              title={op("productPainPoints")}
              empty={!painPoints?.items?.length}
              emptyTitle={OPS_CHART_EMPTY.pain.title}
              emptyDescription={OPS_CHART_EMPTY.pain.description}
            >
              <AdminBarChart items={(painPoints?.items ?? []).map((i) => ({ label: i.label, value: i.count }))} />
            </AdminChartCard>
          </div>
        </AdminAnalyticsTabPanel>
        </>
      )}
    </AdminAnalyticsPageShell>
  );
}
