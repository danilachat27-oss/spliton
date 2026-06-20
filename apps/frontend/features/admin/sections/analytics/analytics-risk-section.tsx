"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminAnalyticsExportButton } from "@/features/admin/analytics/components/admin-analytics-export-button";
import { AdminAnalyticsInsightsPanel } from "@/features/admin/analytics/components/admin-analytics-insights-panel";
import { AdminAnalyticsKpiGroup } from "@/features/admin/analytics/components/admin-analytics-kpi-group";
import { AdminAnalyticsLayout } from "@/features/admin/analytics/components/admin-analytics-layout";
import { AdminChartCard } from "@/features/admin/analytics/components/admin-chart-card";
import { AdminBarChart, AdminLineChart } from "@/features/admin/analytics/components/admin-charts.lazy";
import { AdminMetricTrendCard } from "@/features/admin/analytics/components/admin-metric-trend-card";
import { AdminPeriodSelector } from "@/features/admin/analytics/components/admin-period-selector";
import {
  AdminRiskAnalyticsFilters,
  type RiskAnalyticsFilters,
} from "@/features/admin/analytics/components/admin-risk-analytics-filters";
import { useAnalyticsPeriod } from "@/features/admin/analytics/hooks/use-analytics-period";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDateShort, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { isBusinessAnalyst } from "@/features/admin/config/admin-rbac";
import {
  buildRiskHealthSummary,
  buildRiskInsights,
  complianceCaseHref,
  RISK_CHART_EMPTY,
  RISK_KPI_TOOLTIPS,
  riskOperationHref,
  SEVERITY_BADGE,
} from "@/features/admin/lib/admin-risk-analytics-i18n";
import {
  getRiskAnalyticsBySeverity,
  getRiskAnalyticsByType,
  getRiskAnalyticsFreezeImpact,
  getRiskAnalyticsHighValueOperations,
  getRiskAnalyticsQueue,
  getRiskAnalyticsQueueAging,
  getRiskAnalyticsRepeatOffenders,
  getRiskAnalyticsResolutionQuality,
  getRiskAnalyticsRulesPerformance,
  getRiskAnalyticsSummary,
} from "@/services/admin/adminRiskAnalytics.service";
import {
  AdminDataTable,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminReadOnlyBanner,
  type AdminColumn,
} from "@/features/admin/ui";
import { cn } from "@/lib/utils";
import {
  adminAnalyticsHealthBannerBodyClass,
  adminAnalyticsHealthBannerSurface,
  adminAnalyticsHealthBannerTitleClass,
} from "@/features/admin/analytics/lib/admin-analytics-theme";

function pickRiskSummary(s: Record<string, unknown> | null) {
  return {
    openFlags: Number(s?.openFlags ?? 0),
    highCriticalOpen: Number(s?.highCriticalOpen ?? s?.highSeverity ?? 0),
    unassignedOpen: Number(s?.unassignedOpen ?? 0),
    overdueSla: Number(s?.overdueSla ?? 0),
    blockedUsers: Number(s?.blockedUsers ?? 0),
    frozenOperations: Number(s?.frozenOperations ?? 0),
    frozenVolumeUsdt: String(s?.frozenVolumeUsdt ?? "0,00"),
    highValuePendingWithdrawals: Number(s?.highValuePendingWithdrawals ?? 0),
    flagsInPeriod: Number(s?.flagsInPeriod ?? 0),
    suspiciousTrades: Number(s?.suspiciousTrades ?? 0),
    frozenListings: Number(s?.frozenListings ?? 0),
    reviewedCases: Number(s?.reviewedCases ?? 0),
    dismissedCases: Number(s?.dismissedCases ?? 0),
    averageReviewHours: s?.averageReviewHours != null ? Number(s.averageReviewHours) : null,
    criticalCount: Number(s?.criticalCount ?? 0),
    highCount: Number(s?.highCount ?? 0),
    deltas: (s?.deltas ?? {}) as { flagsPct?: number | null },
  };
}

function SeverityBadge({ severity }: { severity: string }) {
  const a = useAdminI18n();
  const key = severity.toLowerCase();
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", SEVERITY_BADGE[key] ?? SEVERITY_BADGE.medium)}>
      {a.complianceSeverityLabel(severity)}
    </span>
  );
}

const DRILL_LINK_KEYS = [
  { href: ROUTES.adminCompliance, section: "compliance" as const, labelKey: "admin.analytics.risk.link.compliance" as const },
  { href: ROUTES.adminWithdrawals, section: "withdrawals" as const },
  { href: ROUTES.adminDeposits, section: "deposits" as const },
  { href: ROUTES.adminSecondaryMarket, section: "secondaryMarket" as const },
  { href: ROUTES.adminUsers, section: "users" as const },
  { href: ROUTES.adminReports, section: "reports" as const },
] as const;

export function AnalyticsRiskSection() {
  const a = useAdminI18n();
  const drillLinks = React.useMemo(
    () =>
      DRILL_LINK_KEYS.map((item) => ({
        href: item.href,
        label: "labelKey" in item && item.labelKey ? a.t(item.labelKey) : a.adminSectionLabel(item.section),
      })),
    [a],
  );
  const client = useAdminApi();
  const { user } = useAuth();
  const analyst = isBusinessAnalyst(user?.roles);
  const complianceFocus = user?.roles?.includes("COMPLIANCE") ?? false;
  const accountantFocus =
    (user?.roles?.includes("ACCOUNTANT") ?? false) && !complianceFocus;

  const { period, setPeriod, query: baseQuery, customFrom, customTo, setCustomDates } = useAnalyticsPeriod("30d");
  const [filters, setFilters] = React.useState<RiskAnalyticsFilters>({
    severity: "",
    entityType: "",
    ruleCode: "",
    status: "",
  });

  const query = React.useMemo(
    () => ({
      ...baseQuery,
      segment: filters.severity || undefined,
      role: filters.entityType || undefined,
      source: filters.ruleCode || undefined,
      status: filters.status || undefined,
    }),
    [baseQuery, filters],
  );

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getRiskAnalyticsSummary>> | null>(null);
  const [bySeverity, setBySeverity] = React.useState<Awaited<ReturnType<typeof getRiskAnalyticsBySeverity>> | null>(null);
  const [byType, setByType] = React.useState<Awaited<ReturnType<typeof getRiskAnalyticsByType>> | null>(null);
  const [aging, setAging] = React.useState<Awaited<ReturnType<typeof getRiskAnalyticsQueueAging>> | null>(null);
  const [highValue, setHighValue] = React.useState<
    Awaited<ReturnType<typeof getRiskAnalyticsHighValueOperations>> | null
  >(null);
  const [queue, setQueue] = React.useState<Awaited<ReturnType<typeof getRiskAnalyticsQueue>> | null>(null);
  const [rules, setRules] = React.useState<Awaited<ReturnType<typeof getRiskAnalyticsRulesPerformance>> | null>(null);
  const [repeat, setRepeat] = React.useState<Awaited<ReturnType<typeof getRiskAnalyticsRepeatOffenders>> | null>(null);
  const [freeze, setFreeze] = React.useState<Awaited<ReturnType<typeof getRiskAnalyticsFreezeImpact>> | null>(null);
  const [resolution, setResolution] = React.useState<
    Awaited<ReturnType<typeof getRiskAnalyticsResolutionQuality>> | null
  >(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      getRiskAnalyticsSummary(query, client),
      getRiskAnalyticsBySeverity(query, client),
      getRiskAnalyticsByType(query, client),
      getRiskAnalyticsQueueAging(query, client),
      getRiskAnalyticsHighValueOperations(query, client),
      getRiskAnalyticsQueue(query, client),
      getRiskAnalyticsRulesPerformance(query, client),
      getRiskAnalyticsRepeatOffenders(query, client),
      getRiskAnalyticsFreezeImpact(query, client),
      getRiskAnalyticsResolutionQuality(query, client),
    ])
      .then(([s, sev, typ, ag, hv, q, r, rep, fr, res]) => {
        setSummary(s);
        setBySeverity(sev);
        setByType(typ);
        setAging(ag);
        setHighValue(hv);
        setQueue(q);
        setRules(r);
        setRepeat(rep);
        setFreeze(fr);
        setResolution(res);
        setLastUpdated(new Date().toISOString());
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [client, query]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading && !summary) {
    return (
      <AdminPageShell>
        <AdminLoadingState label={a.t("admin.analytics.risk.loading")} centered />
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell>
        <AdminErrorState onRetry={load} />
      </AdminPageShell>
    );
  }

  const s = pickRiskSummary(summary as Record<string, unknown> | null);
  const hasActivity = s.flagsInPeriod > 0 || s.openFlags > 0;
  const issues: string[] = [];
  if (s.overdueSla > 0) issues.push(a.t("admin.analytics.risk.issue.overdueCompliance"));
  if (s.highValuePendingWithdrawals > 0) issues.push(a.t("admin.analytics.risk.issue.highValueWithdrawals"));
  if ((repeat?.items?.length ?? 0) > 0) issues.push(a.t("admin.analytics.risk.issue.repeatFlags"));
  const highFpRule =
    (rules?.items ?? []).find((r) => (r.falsePositiveRatePct ?? 0) >= 50 && r.triggeredCount >= 3)?.ruleCode ?? null;
  if (highFpRule) issues.push(a.t("admin.analytics.risk.issue.highFpRule").replace("{rule}", highFpRule));
  if (s.unassignedOpen > 0) issues.push(a.t("admin.analytics.risk.issue.unassignedFrozen"));

  const health = buildRiskHealthSummary({
    hasActivity,
    flagsInPeriod: s.flagsInPeriod,
    highCritical: s.highCriticalOpen,
    openFlags: s.openFlags,
    overdue: s.overdueSla,
    avgReviewHours: s.averageReviewHours,
    issues,
  });

  const insights = buildRiskInsights({
    unassigned: s.unassignedOpen,
    overdue: s.overdueSla,
    highValueWd: s.highValuePendingWithdrawals,
    repeatUsers: repeat?.items?.length ?? 0,
    suspiciousTrades: s.suspiciousTrades,
    highFpRule,
    noActivity: !hasActivity,
  });

  const trendPoints = (bySeverity?.trend ?? []).map((i) => ({ period: i.period, value: i.count }));
  const resolutionRate = resolution?.resolutionRatePct ?? 0;

  const queueCols: AdminColumn<{
    riskId: string;
    ruleCode: string;
    severity: string;
    riskScore: number;
    entityType: string;
    entityId: string | null;
    userId: string;
    userEmail: string;
    amountUsdt: string | null;
    status: string;
    assignedTo: string | null;
    slaOverdue: boolean;
    updatedAt: string;
  }>[] = [
    { key: "id", header: a.t("admin.table.riskId"), render: (r) => <span className="font-mono text-xs">{r.riskId.slice(0, 8)}…</span> },
    { key: "rule", header: a.t("admin.table.rule"), render: (r) => r.ruleCode },
    { key: "sev", header: a.t("admin.table.severity"), render: (r) => <SeverityBadge severity={r.severity} /> },
    { key: "score", header: a.t("admin.table.score"), render: (r) => String(r.riskScore) },
    { key: "entity", header: a.table.entity, render: (r) => `${r.entityType}${r.entityId ? ` · ${r.entityId.slice(0, 6)}…` : ""}` },
    {
      key: "user",
      header: a.table.user,
      render: (r) =>
        analyst ? (
          <span>{r.userEmail}</span>
        ) : (
          <Link href={ROUTES.adminUserDetail(r.userId)} className="hover:underline">
            {r.userEmail}
          </Link>
        ),
    },
    { key: "amount", header: a.table.amount, render: (r) => (r.amountUsdt ? formatUsdtAmount(r.amountUsdt) : "—") },
    {
      key: "sla",
      header: a.t("admin.table.sla"),
      render: (r) =>
        r.slaOverdue ? (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-800">{a.t("admin.common.overdue")}</span>
        ) : (
          <span className="text-xs text-zinc-500">{a.t("admin.common.ok")}</span>
        ),
    },
    { key: "updated", header: a.table.updated, render: (r) => formatAdminDateShort(r.updatedAt) },
    {
      key: "action",
      header: "",
      render: (r) =>
        analyst ? null : (
          <Link href={complianceCaseHref(r.riskId)} className="text-xs text-blue-600 hover:underline">
            {a.t("admin.analytics.risk.col.case")}
          </Link>
        ),
    },
  ];

  const hvCols: AdminColumn<{
    id: string;
    type: string;
    operationId: string;
    userId: string;
    userEmail: string;
    amountUsdt: string;
    status: string;
    riskScore: number;
    createdAt: string;
  }>[] = [
    { key: "type", header: a.table.type, render: (r) => r.type },
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
    { key: "amount", header: a.table.amount, render: (r) => formatUsdtAmount(r.amountUsdt) },
    { key: "score", header: a.t("admin.table.riskScore"), render: (r) => String(r.riskScore) },
    { key: "status", header: a.t("admin.analytics.common.status"), render: (r) => a.formatAdminStatus(r.status) },
    { key: "date", header: a.table.created, render: (r) => formatAdminDateShort(r.createdAt) },
    {
      key: "action",
      header: "",
      render: (r) =>
        analyst ? null : (
          <Link href={riskOperationHref(r.type, r.operationId, r.userId)} className="text-xs text-blue-600 hover:underline">
            {a.actions.open}
          </Link>
        ),
    },
  ];

  const rulesCols: AdminColumn<{
    ruleCode: string;
    label: string;
    entityType: string;
    triggeredCount: number;
    highCriticalCount: number;
    falsePositiveRatePct: number | null;
    avgResolutionHours: number | null;
    lastTriggeredAt: string;
  }>[] = [
    { key: "code", header: a.t("admin.table.rule"), render: (r) => r.ruleCode },
    { key: "entity", header: a.table.entity, render: (r) => r.entityType },
    { key: "triggered", header: a.t("admin.table.triggered"), render: (r) => String(r.triggeredCount) },
    { key: "hc", header: a.t("admin.table.highCrit"), render: (r) => String(r.highCriticalCount) },
    {
      key: "fp",
      header: a.t("admin.table.fpRate"),
      render: (r) =>
        r.falsePositiveRatePct != null ? `${r.falsePositiveRatePct}%` : a.t("admin.analytics.common.none"),
    },
    {
      key: "res",
      header: a.t("admin.table.avgResolution"),
      render: (r) => (r.avgResolutionHours != null ? `${r.avgResolutionHours} ч` : "—"),
    },
    { key: "last", header: a.table.updated, render: (r) => formatAdminDateShort(r.lastTriggeredAt) },
  ];

  const repeatCols: AdminColumn<{
    userId: string;
    email: string;
    flagsCount: number;
    criticalCount: number;
    blocked: boolean;
    lastFlagCode: string;
    lastFlagAt: string | null;
  }>[] = [
    {
      key: "user",
      header: a.table.user,
      render: (r) =>
        analyst ? (
          r.email
        ) : (
          <Link href={ROUTES.adminUserDetail(r.userId)} className="hover:underline">
            {r.email}
          </Link>
        ),
    },
    { key: "flags", header: a.t("admin.table.flags"), render: (r) => String(r.flagsCount) },
    { key: "crit", header: a.t("admin.table.criticalCol"), render: (r) => String(r.criticalCount) },
    {
      key: "blocked",
      header: a.t("admin.table.blockedCol"),
      render: (r) =>
        r.blocked ? (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-800">Да</span>
        ) : (
          "Нет"
        ),
    },
    { key: "last", header: a.t("admin.table.lastFlag"), render: (r) => r.lastFlagCode },
    {
      key: "action",
      header: "",
      render: (r) =>
        analyst ? null : (
          <Link href={ROUTES.adminCompliance} className="text-xs text-blue-600 hover:underline">
            {a.t("admin.analytics.risk.col.case")}
          </Link>
        ),
    },
  ];

  const healthBannerClass = adminAnalyticsHealthBannerSurface(health.tone);

  const showMarketRisk = !accountantFocus;
  const showUserRisk = !accountantFocus || complianceFocus;

  return (
    <AdminPageShell>
      {analyst ? <AdminReadOnlyBanner area="analytics" className="mb-2" /> : null}
      <AdminPageHeader
        title={a.t("admin.analytics.risk.title")}
        description={a.t("admin.analytics.risk.description")}
        breadcrumbs={a.adminSectionBreadcrumbs("analyticsRisk")}
        actions={
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <AdminPeriodSelector value={period} onChange={setPeriod} customFrom={customFrom} customTo={customTo} onCustomDatesChange={setCustomDates} />
              <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={load} disabled={loading}>
                {loading ? a.t("admin.analytics.common.refreshing") : a.t("admin.analytics.common.refresh")}
              </Button>
              <AdminAnalyticsExportButton
                reportType="risk_flags"
                label={a.t("admin.analytics.common.generateReport")}
              />
            </div>
            {lastUpdated ? (
              <p className="text-xs text-zinc-500">Обновлено: {formatAdminDateShort(lastUpdated)}</p>
            ) : null}
          </div>
        }
      />

      <AdminAnalyticsLayout activeSection="analyticsRisk">
        <AdminRiskAnalyticsFilters value={filters} onChange={setFilters} className="mb-6" />

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
            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.risk.queue")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.openFlags")}
                value={String(s.openFlags)}
                tooltip={RISK_KPI_TOOLTIPS.openFlags}
                href={ROUTES.adminCompliance}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.highCritical")}
                value={String(s.highCriticalOpen)}
                tooltip={RISK_KPI_TOOLTIPS.highCritical}
                href={ROUTES.adminCompliance}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.operations.kpi.unassigned")}
                value={String(s.unassignedOpen)}
                tooltip={RISK_KPI_TOOLTIPS.unassigned}
                href={ROUTES.adminCompliance}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.operations.kpi.overdueSla")}
                value={String(s.overdueSla)}
                tooltip={RISK_KPI_TOOLTIPS.overdue}
                href={ROUTES.adminCompliance}
              />
            </AdminAnalyticsKpiGroup>

            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.risk.financialRisk")}>
              <AdminMetricTrendCard
                label={a.t("admin.wallets.pendingWithdrawals")}
                value={String(s.highValuePendingWithdrawals)}
                tooltip={RISK_KPI_TOOLTIPS.hvWithdrawals}
                href={ROUTES.adminWithdrawals}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.frozenVolume")}
                value={formatUsdtAmount(s.frozenVolumeUsdt)}
                tooltip={RISK_KPI_TOOLTIPS.frozenVolume}
                href={ROUTES.adminWithdrawals}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.flagsInPeriod")}
                value={String(s.flagsInPeriod)}
                deltaPct={s.deltas.flagsPct}
                tooltip={RISK_KPI_TOOLTIPS.flagsPeriod}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.amountAtRisk")}
                value={formatUsdtAmount(s.frozenVolumeUsdt)}
                tooltip={RISK_KPI_TOOLTIPS.frozenVolume}
              />
            </AdminAnalyticsKpiGroup>

            {showMarketRisk ? (
              <AdminAnalyticsKpiGroup title={a.t("admin.analytics.risk.marketRisk")}>
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.metric.suspiciousTrades")}
                  value={String(s.suspiciousTrades)}
                  tooltip={RISK_KPI_TOOLTIPS.suspiciousTrades}
                  href={ROUTES.adminSecondaryMarket}
                />
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.metric.frozenListings")}
                  value={String(s.frozenListings)}
                  href={ROUTES.adminSecondaryMarket}
                />
                <AdminMetricTrendCard label={a.t("admin.analytics.metric.frozenOperations")} value={String(s.frozenOperations)} tooltip={RISK_KPI_TOOLTIPS.frozenOps} />
              </AdminAnalyticsKpiGroup>
            ) : null}

            {showUserRisk ? (
              <AdminAnalyticsKpiGroup title={a.t("admin.analytics.risk.userRisk")}>
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.metric.blockedUsers")}
                  value={String(s.blockedUsers)}
                  tooltip={RISK_KPI_TOOLTIPS.blocked}
                  href={ROUTES.adminUsers}
                />
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.metric.repeatOffenders")}
                  value={String(repeat?.items?.length ?? 0)}
                  href={ROUTES.adminCompliance}
                />
                <AdminMetricTrendCard label={a.t("admin.analytics.risk.metric.criticalOpen")} value={String(s.criticalCount)} />
                <AdminMetricTrendCard label={a.t("admin.analytics.risk.metric.highOpen")} value={String(s.highCount)} />
              </AdminAnalyticsKpiGroup>
            ) : null}

            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.risk.reviewQuality")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.risk.metric.reviewedCases")}
                value={String(s.reviewedCases)}
                tooltip={RISK_KPI_TOOLTIPS.reviewed}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.avgReviewTime")}
                value={s.averageReviewHours != null ? `${s.averageReviewHours} ч` : a.t("admin.analytics.common.none")}
                tooltip={RISK_KPI_TOOLTIPS.avgReview}
              />
              <AdminMetricTrendCard label={a.t("admin.analytics.risk.metric.resolutionRate")} value={`${resolutionRate}%`} />
            </AdminAnalyticsKpiGroup>

            <div className={cn(ADMIN_SECTION_TILE, "p-4")}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-100">{a.t("admin.analytics.risk.queueTitle")}</h3>
                <Link href={ROUTES.adminCompliance} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  {a.t("admin.analytics.risk.link.compliance")} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="mt-4 overflow-x-auto">
                <AdminDataTable
                  columns={queueCols}
                  rows={queue?.items ?? []}
                  rowKey={(r) => r.riskId}
                  emptyMessage="Очередь compliance пуста — открытых флагов на проверку нет."
                />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-zinc-100">Распределение рисков</h3>
            <div className="grid gap-4 xl:grid-cols-2">
              <AdminChartCard
                title={a.t("admin.table.severity")}
                empty={!bySeverity?.items?.length}
                emptyTitle={RISK_CHART_EMPTY.severity.title}
                emptyDescription={RISK_CHART_EMPTY.severity.description}
                drilldownHref={ROUTES.adminCompliance}
              >
                <AdminBarChart items={(bySeverity?.items ?? []).map((i) => ({ label: i.severity, value: i.count }))} />
              </AdminChartCard>
              <AdminChartCard
                title={a.t("admin.analytics.risk.byEntityType")}
                empty={!byType?.items?.length}
                emptyTitle={RISK_CHART_EMPTY.type.title}
                emptyDescription={RISK_CHART_EMPTY.type.description}
              >
                <AdminBarChart items={(byType?.items ?? []).map((i) => ({ label: i.type, value: i.count }))} />
              </AdminChartCard>
              <AdminChartCard
                title={a.t("admin.analytics.risk.byStatus")}
                empty={!bySeverity?.byStatus?.length}
                emptyTitle={RISK_CHART_EMPTY.severity.title}
                emptyDescription={RISK_CHART_EMPTY.severity.description}
              >
                <AdminBarChart items={(bySeverity?.byStatus ?? []).map((i) => ({ label: i.status, value: i.count }))} />
              </AdminChartCard>
              <AdminChartCard
                title={a.t("admin.analytics.risk.flagsTrend")}
                empty={trendPoints.length < 2}
                emptyTitle={RISK_CHART_EMPTY.trend.title}
                emptyDescription={RISK_CHART_EMPTY.trend.description}
              >
                <AdminLineChart points={trendPoints} />
              </AdminChartCard>
            </div>

            <AdminChartCard
              title={a.t("admin.analytics.risk.rulesEfficiency")}
              empty={!rules?.items?.length}
              emptyTitle={RISK_CHART_EMPTY.rules.title}
              emptyDescription={RISK_CHART_EMPTY.rules.description}
              className="mt-2"
            >
              <AdminDataTable columns={rulesCols} rows={rules?.items ?? []} rowKey={(r) => r.ruleCode} />
            </AdminChartCard>

            <h3 className="text-sm font-semibold text-zinc-100">Возраст очереди и SLA</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <AdminMetricTrendCard label={a.t("admin.analytics.metric.avgAge")} value={`${aging?.averageAgeHours ?? 0} ч`} />
              <AdminMetricTrendCard label={a.t("admin.analytics.metric.oldestCase")} value={`${aging?.oldestOpenHours ?? 0} ч`} />
              <AdminMetricTrendCard label={a.t("admin.analytics.metric.overdueSla")} value={String(aging?.overdueTotal ?? 0)} href={ROUTES.adminCompliance} />
            </div>
            <AdminChartCard
              title={a.t("admin.analytics.risk.metric.agingBuckets")}
              empty={!(aging?.buckets ?? []).some((b) => b.count > 0)}
              emptyTitle={RISK_CHART_EMPTY.aging.title}
              emptyDescription={RISK_CHART_EMPTY.aging.description}
            >
              <AdminBarChart
                items={(aging?.buckets ?? []).map((i) => ({
                  label: i.label,
                  value: i.count,
                }))}
              />
            </AdminChartCard>

            <AdminChartCard
              title={a.t("admin.analytics.risk.highValueOps")}
              description={highValue?.thresholdUsdt ? `Порог: ${formatUsdtAmount(highValue.thresholdUsdt)}` : undefined}
              empty={!highValue?.items?.length}
              emptyTitle={RISK_CHART_EMPTY.highValue.title}
              emptyDescription={RISK_CHART_EMPTY.highValue.description}
              drilldownHref={ROUTES.adminWithdrawals}
            >
              <AdminDataTable columns={hvCols} rows={highValue?.items ?? []} rowKey={(r) => r.id} />
            </AdminChartCard>

            <AdminChartCard
              title={a.t("admin.analytics.risk.repeatRiskUsers")}
              empty={!repeat?.items?.length}
              emptyTitle={RISK_CHART_EMPTY.repeat.title}
              emptyDescription={RISK_CHART_EMPTY.repeat.description}
              drilldownHref={ROUTES.adminCompliance}
            >
              <AdminDataTable columns={repeatCols} rows={repeat?.items ?? []} rowKey={(r) => r.userId} />
            </AdminChartCard>

            <h3 className="text-sm font-semibold text-zinc-100">Влияние заморозок и блокировок</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdminMetricTrendCard label={a.t("admin.analytics.risk.metric.frozenWithdrawals")} value={String(freeze?.frozenWithdrawals ?? 0)} href={ROUTES.adminWithdrawals} />
              <AdminMetricTrendCard label={a.t("admin.analytics.risk.metric.frozenListings")} value={String(freeze?.frozenListings ?? 0)} href={ROUTES.adminSecondaryMarket} />
              <AdminMetricTrendCard label={a.t("admin.analytics.risk.metric.blockedUsers")} value={String(freeze?.blockedUsers ?? 0)} href={ROUTES.adminUsers} />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.risk.metric.amountFrozen")}
                value={formatUsdtAmount(freeze?.frozenAmountUsdt ?? "0,00")}
              />
            </div>

            <div className={cn(ADMIN_SECTION_TILE, "border p-4")}>
              <h3 className="text-sm font-semibold text-zinc-100">Качество проверок</h3>
              <p className="mt-1 text-xs text-zinc-500">{resolution?.note}</p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Reviewed</dt>
                  <dd className="font-semibold tabular-nums">{resolution?.reviewedCases ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Open</dt>
                  <dd className="font-semibold tabular-nums">{resolution?.openCases ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">False positive rate (approx.)</dt>
                  <dd className="font-semibold tabular-nums">
                    {resolution?.falsePositiveRatePct != null
                      ? `${resolution.falsePositiveRatePct}%`
                      : "Нет данных для сравнения"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Avg resolution</dt>
                  <dd className="font-semibold tabular-nums">
                    {resolution?.avgResolutionHours != null
                      ? `${resolution.avgResolutionHours} ч`
                      : "Нет данных для сравнения"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <aside className="space-y-4">
            <AdminAnalyticsInsightsPanel items={insights} className="xl:sticky xl:top-4 xl:self-start" />
            <div className={cn(ADMIN_SECTION_TILE, "border p-4")}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Drill-down</h3>
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
            {complianceFocus ? (
              <p className="text-xs text-zinc-500">
                Режим COMPLIANCE: полный доступ к кейсам и очереди через раздел Compliance.
              </p>
            ) : null}
            {accountantFocus ? (
              <p className="text-xs text-zinc-500">
                Режим ACCOUNTANT: акцент на выводах, депозитах и суммах под риском (read-only аналитика).
              </p>
            ) : null}
          </aside>
        </div>
      </AdminAnalyticsLayout>
    </AdminPageShell>
  );
}
