"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { ROUTES } from "@/constants/routes";
import { AdminAnalyticsExportButton } from "@/features/admin/analytics/components/admin-analytics-export-button";
import { AdminAnalyticsInsightsPanel } from "@/features/admin/analytics/components/admin-analytics-insights-panel";
import { AdminAnalyticsKpiGroup } from "@/features/admin/analytics/components/admin-analytics-kpi-group";
import { ANALYTICS_USERS_TABS } from "@/features/admin/analytics/config/analytics-page-tabs";
import { AdminAnalyticsPageShell } from "@/features/admin/analytics/ui/admin-analytics-page-shell";
import { AdminAnalyticsTabPanel } from "@/features/admin/analytics/ui/admin-analytics-tab-panel";
import { AdminChartCard } from "@/features/admin/analytics/components/admin-chart-card";
import {
  AdminBarChart,
  AdminDonutChart,
  AdminMultiLineChart,
} from "@/features/admin/analytics/components/admin-charts.lazy";
import { AdminMetricTrendCard } from "@/features/admin/analytics/components/admin-metric-trend-card";
import { AdminPeriodSelector } from "@/features/admin/analytics/components/admin-period-selector";
import { AdminUserActivationFunnel } from "@/features/admin/analytics/components/admin-user-activation-funnel";
import {
  AdminUserAnalyticsFilters,
  type UserAnalyticsFilters,
} from "@/features/admin/analytics/components/admin-user-analytics-filters";
import {
  countPointsToValues,
  useAnalyticsPeriod,
} from "@/features/admin/analytics/hooks/use-analytics-period";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDateShort, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import {
  buildUserHealthSummary,
  buildUserInsights,
  USER_CHART_EMPTY,
  USER_KPI_TOOLTIPS,
  usersFilterHref,
} from "@/features/admin/lib/admin-user-analytics-i18n";
import {
  getUserAnalyticsDormant,
  getUserAnalyticsFinancialSegments,
  getUserAnalyticsFunnel,
  getUserAnalyticsGrowth,
  getUserAnalyticsRiskUsers,
  getUserAnalyticsSegments,
  getUserAnalyticsSummary,
  getUserAnalyticsTopHolders,
} from "@/services/admin/adminUserAnalytics.service";
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

const FUNNEL_STEPS_RU = [
  "Регистрация",
  "Первый депозит",
  "Первая покупка юнитов",
  "Первое начисление",
  "Первый вывод",
  "Вторичный рынок",
] as const;

function pickSummary(s: Record<string, unknown> | null) {
  return {
    totalUsers: Number(s?.totalUsers ?? s?.total ?? 0),
    activeUsers: Number(s?.activeUsers ?? s?.active ?? 0),
    newUsers: Number(s?.newUsers ?? 0),
    activeInPeriod: Number(s?.activeInPeriod ?? 0),
    dormantUsers: Number(s?.dormantUsers ?? 0),
    usersWithRiskFlags: Number(s?.usersWithRiskFlags ?? s?.withRiskFlags ?? 0),
    usersWithPendingWithdrawals: Number(s?.usersWithPendingWithdrawals ?? 0),
    blockedUsers: Number(s?.blockedUsers ?? 0),
    highRiskUsers: Number(s?.highRiskUsers ?? s?.highSeverity ?? 0),
    withFirstDeposit: Number(s?.withFirstDeposit ?? 0),
    withFirstPurchase: Number(s?.withFirstPurchase ?? 0),
    withFirstPayout: Number(s?.withFirstPayout ?? 0),
    withFirstWithdrawal: Number(s?.withFirstWithdrawal ?? 0),
    withSecondaryTrade: Number(s?.withSecondaryTrade ?? 0),
    balanceNoPurchase: Number(s?.balanceNoPurchase ?? 0),
    inactive30Plus: Number(s?.inactive30Plus ?? 0),
    returnedUsers: Number(s?.returnedUsers ?? 0),
    deltas: (s?.deltas ?? {}) as { newUsersPct?: number | null; activeInPeriodPct?: number | null },
  };
}

const DRILL_LINKS = [
  { href: ROUTES.adminUsers, label: "Все пользователи" },
  { href: ROUTES.adminHoldings, label: "Холдинги" },
  { href: ROUTES.adminCompliance, label: "Риски и контроль" },
  { href: ROUTES.adminAnalyticsFinance, label: "Финансовая аналитика" },
  { href: ROUTES.adminReports, label: "Отчёты" },
] as const;

export function AnalyticsUsersSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { period, setPeriod, query, customFrom, customTo, setCustomDates } = useAnalyticsPeriod("30d");
  const [filters, setFilters] = React.useState<UserAnalyticsFilters>({
    status: "",
    segment: "",
    role: "",
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getUserAnalyticsSummary>> | null>(null);
  const [growth, setGrowth] = React.useState<Awaited<ReturnType<typeof getUserAnalyticsGrowth>> | null>(null);
  const [funnel, setFunnel] = React.useState<Awaited<ReturnType<typeof getUserAnalyticsFunnel>> | null>(null);
  const [segments, setSegments] = React.useState<Awaited<ReturnType<typeof getUserAnalyticsSegments>> | null>(null);
  const [financial, setFinancial] = React.useState<
    Awaited<ReturnType<typeof getUserAnalyticsFinancialSegments>> | null
  >(null);
  const [dormant, setDormant] = React.useState<Awaited<ReturnType<typeof getUserAnalyticsDormant>> | null>(null);
  const [riskUsers, setRiskUsers] = React.useState<
    Awaited<ReturnType<typeof getUserAnalyticsRiskUsers>> | null
  >(null);
  const [holders, setHolders] = React.useState<Awaited<ReturnType<typeof getUserAnalyticsTopHolders>> | null>(null);

  const filterQuery = React.useMemo(
    () => ({
      ...query,
      status: filters.status || undefined,
      segment: filters.segment || undefined,
      role: filters.role || undefined,
    }),
    [query, filters],
  );

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      getUserAnalyticsSummary(filterQuery, client),
      getUserAnalyticsGrowth(filterQuery, client),
      getUserAnalyticsFunnel(filterQuery, client),
      getUserAnalyticsSegments(filterQuery, client),
      getUserAnalyticsFinancialSegments(filterQuery, client),
      getUserAnalyticsDormant(filterQuery, client),
      getUserAnalyticsRiskUsers(filterQuery, client),
      getUserAnalyticsTopHolders(filterQuery, client),
    ])
      .then(([s, g, f, seg, fin, dor, risk, h]) => {
        setSummary(s);
        setGrowth(g);
        setFunnel(f);
        setSegments(seg);
        setFinancial(fin);
        setDormant(dor);
        setRiskUsers(risk);
        setHolders(h);
        setLastUpdated(new Date().toISOString());
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [client, filterQuery]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading && !summary) {
    return <AdminLoadingState label={a.t("admin.analytics.users.loading")} centered />;
  }

  if (error) {
    return <AdminErrorState onRetry={load} />;
  }

  const s = pickSummary(summary as Record<string, unknown> | null);
  const hasActivity = s.newUsers > 0 || s.activeInPeriod > 0 || (growth?.newUsers?.length ?? 0) > 0;
  const health = buildUserHealthSummary({
    hasActivity,
    newUsers: s.newUsers,
    withFirstDeposit: s.withFirstDeposit,
    withFirstPurchase: s.withFirstPurchase,
    funnelSteps: funnel?.steps,
  });
  const insights = buildUserInsights({ summary: s });

  const newPoints = growth?.newUsers ? countPointsToValues(growth.newUsers) : [];
  const activePoints = growth?.activeUsers ? countPointsToValues(growth.activeUsers) : [];
  const cumulativePoints = growth?.cumulativeUsers ? countPointsToValues(growth.cumulativeUsers) : [];

  const lifecycleDonut = (segments?.lifecycle ?? [])
    .filter((i) => i.count > 0)
    .map((i, idx) => ({
      label: i.label,
      value: i.count,
      color: ["#2563eb", "#059669", "#7c3aed", "#a855f7", "#71717a", "#18181b", "#e11d48", "#f97316"][idx % 8]!,
    }));

  const holderCols: AdminColumn<{
    userId: string;
    email: string;
    totalUnits: string;
    holdingsCount: number;
    valueUsdt: string;
    availableBalanceUsdt: string;
    riskStatus: string;
    lastActivityAt: string | null;
  }>[] = [
    {
      key: "email",
      header: "Пользователь",
      render: (r) => (
        <Link href={`${ROUTES.adminUsers}/${r.userId}`} className="font-medium text-zinc-100 hover:underline">
          {r.email}
        </Link>
      ),
    },
    { key: "units", header: "Юниты", render: (r) => r.totalUnits },
    { key: "holdings", header: "Позиций", render: (r) => String(r.holdingsCount) },
    { key: "value", header: "Оценка", render: (r) => formatUsdtAmount(r.valueUsdt) },
    { key: "balance", header: "Баланс", render: (r) => formatUsdtAmount(r.availableBalanceUsdt) },
    {
      key: "risk",
      header: "Риск",
      render: (r) =>
        r.riskStatus === "none" ? (
          <span className="text-zinc-400">—</span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium uppercase">
            {r.riskStatus}
          </span>
        ),
    },
    {
      key: "activity",
      header: "Активность",
      render: (r) => (r.lastActivityAt ? formatAdminDateShort(r.lastActivityAt) : "—"),
    },
  ];

  const riskCols: AdminColumn<{
    userId: string;
    email: string;
    severity: string;
    ruleCode: string;
    entityType: string | null;
    status: string;
    updatedAt: string;
  }>[] = [
    {
      key: "user",
      header: "Пользователь",
      render: (r) => (
        <Link href={`${ROUTES.adminUsers}/${r.userId}`} className="hover:underline">
          {r.email}
        </Link>
      ),
    },
    {
      key: "severity",
      header: a.t("admin.table.severity"),
      render: (r) => (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium uppercase text-amber-900">
          {a.complianceSeverityLabel(r.severity)}
        </span>
      ),
    },
    { key: "rule", header: a.t("admin.table.rule"), render: (r) => r.ruleCode },
    { key: "entity", header: a.table.entity, render: (r) => r.entityType ?? "—" },
    { key: "status", header: a.table.status, render: (r) => a.formatAdminStatus(r.status) },
    { key: "updated", header: a.table.updated, render: (r) => formatAdminDateShort(r.updatedAt) },
  ];

  const dormantCols: AdminColumn<{
    userId: string;
    email: string;
    dormantDays: number;
    availableBalanceUsdt: string;
    holdingsUnits: string;
  }>[] = [
    {
      key: "email",
      header: "Пользователь",
      render: (r) => (
        <Link href={`${ROUTES.adminUsers}/${r.userId}`} className="hover:underline">
          {r.email}
        </Link>
      ),
    },
    { key: "days", header: "Дней без активности", render: (r) => String(r.dormantDays) },
    { key: "balance", header: "Баланс", render: (r) => formatUsdtAmount(r.availableBalanceUsdt) },
    { key: "units", header: "Юниты", render: (r) => r.holdingsUnits },
  ];

  const healthBannerClass = adminAnalyticsHealthBannerSurface(health.tone);

  const overviewKpiGroup = (
    <AdminAnalyticsKpiGroup title={a.t("admin.analytics.users.baseOverview")} description={a.t("admin.analytics.users.baseOverviewDesc")}>
      <AdminMetricTrendCard label={a.t("admin.analytics.metric.totalUsers")} value={String(s.totalUsers)} tooltip={USER_KPI_TOOLTIPS.totalUsers} href={ROUTES.adminUsers} />
      <AdminMetricTrendCard label={a.t("admin.analytics.filters.user.segment.new")} value={String(s.newUsers)} deltaPct={s.deltas.newUsersPct} tooltip={USER_KPI_TOOLTIPS.newUsers} href={usersFilterHref({ segment: "new" })} />
      <AdminMetricTrendCard label={a.t("admin.analytics.metric.active")} value={String(s.activeInPeriod)} deltaPct={s.deltas.activeInPeriodPct} tooltip={USER_KPI_TOOLTIPS.activeInPeriod} />
      <AdminMetricTrendCard label={a.t("admin.analytics.users.kpi.firstDeposit")} value={String(s.withFirstDeposit)} tooltip={USER_KPI_TOOLTIPS.firstDeposit} href={usersFilterHref({ segment: "deposited" })} />
      <AdminMetricTrendCard label={a.t("admin.analytics.metric.firstPurchase")} value={String(s.withFirstPurchase)} tooltip={USER_KPI_TOOLTIPS.firstPurchase} href={usersFilterHref({ segment: "holders" })} />
      <AdminMetricTrendCard label={a.t("admin.analytics.users.kpi.dormant")} value={String(s.dormantUsers)} tooltip={USER_KPI_TOOLTIPS.dormant} href={usersFilterHref({ segment: "dormant" })} />
      <AdminMetricTrendCard label={a.t("admin.analytics.metric.openRiskSignals")} value={String(s.usersWithRiskFlags)} tooltip={USER_KPI_TOOLTIPS.riskFlags} href={ROUTES.adminCompliance} />
    </AdminAnalyticsKpiGroup>
  );

  return (
    <AdminAnalyticsPageShell
      activeSection="analyticsUsers"
      title={a.t("admin.analytics.users.title")}
      description={a.t("admin.analytics.users.description")}
      breadcrumbs={a.adminSectionBreadcrumbs("analyticsUsers")}
      pageTabs={ANALYTICS_USERS_TABS}
      filters={<AdminUserAnalyticsFilters value={filters} onChange={setFilters} />}
      actions={
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <AdminPeriodSelector value={period} onChange={setPeriod} customFrom={customFrom} customTo={customTo} onCustomDatesChange={setCustomDates} />
            <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={load} disabled={loading}>
              {loading ? a.t("admin.analytics.common.refreshing") : a.t("admin.analytics.common.refresh")}
            </Button>
            <AdminAnalyticsExportButton
              reportType="users_funnel"
              label={a.t("admin.analytics.common.export")}
              period={period}
              customFrom={customFrom}
              customTo={customTo}
            />
          </div>
          {lastUpdated ? (
            <p className="text-xs text-zinc-400">Обновлено: {formatAdminDateShort(lastUpdated)}</p>
          ) : null}
        </div>
      }
    >
      {(tab) => (
        <>
          <AdminAnalyticsTabPanel activeTab={tab} tabId="overview">
            <div className={cn(ADMIN_SECTION_TILE, "border p-5", healthBannerClass)}>
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  adminAnalyticsHealthBannerTitleClass(health.tone),
                )}
              >
                {health.title}
              </p>
              <p
                className={cn(
                  "mt-2 max-w-4xl text-sm leading-relaxed",
                  adminAnalyticsHealthBannerBodyClass(health.tone),
                )}
              >
                {health.body}
              </p>
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_300px]">
              <div className="min-w-0">{overviewKpiGroup}</div>
              <AdminAnalyticsInsightsPanel items={insights} className="xl:sticky xl:top-4 xl:self-start" />
            </div>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="growth">
            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.users.growth")} description={a.t("admin.analytics.users.growthDesc")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.totalUsers")}
                value={String(s.totalUsers)}
                tooltip={USER_KPI_TOOLTIPS.totalUsers}
                href={ROUTES.adminUsers}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.newInPeriod")}
                value={String(s.newUsers)}
                deltaPct={s.deltas.newUsersPct}
                tooltip={USER_KPI_TOOLTIPS.newUsers}
                href={usersFilterHref({ segment: "new" })}
                trend={newPoints.map((p) => p.value)}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.activeInPeriod")}
                value={String(s.activeInPeriod)}
                deltaPct={s.deltas.activeInPeriodPct}
                tooltip={USER_KPI_TOOLTIPS.activeInPeriod}
                trend={activePoints.map((p) => p.value)}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.returnedUsers")}
                value={String(s.returnedUsers)}
                tooltip="Пользователи с активностью после длительного простоя (если доступно в API)."
              />
            </AdminAnalyticsKpiGroup>
            <AdminChartCard
              title={a.t("admin.analytics.users.userGrowth")}
              description={a.t("admin.analytics.users.userGrowthDesc")}
              className="mt-6"
              empty={!newPoints.length && !activePoints.length}
              emptyVariant="users"
              drilldownHref={ROUTES.adminUsers}
              lastUpdated={lastUpdated ?? undefined}
            >
              <AdminMultiLineChart
                series={[
                  { key: "new", label: "Новые", color: "#2563eb", points: newPoints },
                  { key: "active", label: "Активные", color: "#059669", points: activePoints },
                  { key: "cumulative", label: "Накопительно", color: "#71717a", points: cumulativePoints },
                ]}
              />
            </AdminChartCard>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="funnel">
            <div className={cn(ADMIN_SECTION_TILE, "p-5")}>
              <h2 className="text-base font-semibold text-zinc-100">Воронка активации</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {FUNNEL_STEPS_RU.join(" → ")}. Клик по этапу открывает фильтр в пользователях.
              </p>
              <div className="mt-4">
                {!funnel?.steps?.length ? (
                  <div className="rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                    <p className="font-medium text-zinc-200">{USER_CHART_EMPTY.funnel.title}</p>
                    <p className="mt-1">{USER_CHART_EMPTY.funnel.description}</p>
                  </div>
                ) : (
                  <AdminUserActivationFunnel steps={funnel.steps} />
                )}
              </div>
            </div>
            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.users.activation")} description={a.t("admin.analytics.users.activationDesc")} className="mt-6">
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.firstDeposit")}
                value={String(s.withFirstDeposit)}
                tooltip={USER_KPI_TOOLTIPS.firstDeposit}
                href={usersFilterHref({ segment: "deposited" })}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.firstPurchase")}
                value={String(s.withFirstPurchase)}
                tooltip={USER_KPI_TOOLTIPS.firstPurchase}
                href={usersFilterHref({ segment: "holders" })}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.firstPayout")}
                value={String(s.withFirstPayout)}
                tooltip={USER_KPI_TOOLTIPS.firstPayout}
                href={ROUTES.adminRevenue}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.firstWithdrawal")}
                value={String(s.withFirstWithdrawal)}
                tooltip={USER_KPI_TOOLTIPS.firstWithdrawal}
                href={ROUTES.adminWithdrawals}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.filters.ops.category.secondary_market")}
                value={String(s.withSecondaryTrade)}
                tooltip={USER_KPI_TOOLTIPS.secondaryTrade}
                href={ROUTES.adminSecondaryMarket}
              />
            </AdminAnalyticsKpiGroup>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="segments">
            <div className="grid gap-4 xl:grid-cols-2">
              <AdminChartCard
                title={a.t("admin.analytics.users.segments")}
                description={a.t("admin.analytics.users.segmentsDesc")}
                empty={!lifecycleDonut.length}
                drilldownHref={ROUTES.adminUsers}
              >
                <AdminDonutChart items={lifecycleDonut} />
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {(segments?.lifecycle ?? []).map((seg) => (
                    <Link
                      key={seg.key}
                      href={usersFilterHref({ segment: seg.key })}
                      className="flex justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm hover:bg-zinc-900/80"
                    >
                      <span>{seg.label}</span>
                      <span className="tabular-nums text-zinc-400">
                        {seg.count} · {seg.sharePct}%
                      </span>
                    </Link>
                  ))}
                </div>
              </AdminChartCard>
              <AdminChartCard
                title={a.t("admin.analytics.users.financialSegments")}
                description={a.t("admin.analytics.users.financialSegmentsDesc")}
                empty={!financial?.buckets?.length}
                drilldownHref={ROUTES.adminAnalyticsFinance}
              >
                <AdminBarChart items={(financial?.buckets ?? []).map((b) => ({ label: b.label, value: b.count }))} />
                <div className="mt-4 space-y-2">
                  {(financial?.cohorts ?? []).map((c) => (
                    <Link key={c.key} href={ROUTES.adminUsers} className="flex justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm">
                      <span>{c.label}</span>
                      <span className="font-medium tabular-nums">{c.count}</span>
                    </Link>
                  ))}
                </div>
              </AdminChartCard>
            </div>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="retention">
            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.users.retention")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.dormantUsers")}
                value={String(s.dormantUsers)}
                tooltip={USER_KPI_TOOLTIPS.dormant}
                href={usersFilterHref({ segment: "dormant" })}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.inactive30Plus")}
                value={String(s.inactive30Plus)}
                tooltip={USER_KPI_TOOLTIPS.inactive30}
              />
            </AdminAnalyticsKpiGroup>
            <AdminChartCard
              title={a.t("admin.analytics.users.retentionChart")}
              description={a.t("admin.analytics.users.retentionChartDesc")}
              className="mt-6"
              drilldownHref={usersFilterHref({ segment: "dormant" })}
            >
          <AdminBarChart
            items={(dormant?.inactiveBuckets ?? []).map((b) => ({
              label: b.label,
              value: b.count,
              color: "#71717a",
            }))}
          />
          <div className="mt-4">
            <AdminDataTable
              columns={dormantCols}
              rows={dormant?.items ?? []}
              rowKey={(r) => r.userId}
              emptyMessage={USER_CHART_EMPTY.growth.description}
            />
          </div>
            </AdminChartCard>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="holders">
            <AdminChartCard
              title={a.t("admin.analytics.users.topHolders")}
            drilldownHref={ROUTES.adminHoldings}
            empty={!holders?.items?.length}
          >
            <AdminDataTable
              columns={holderCols}
              rows={holders?.items ?? []}
              rowKey={(r) => r.userId}
              emptyMessage={USER_CHART_EMPTY.holders.description}
            />
            </AdminChartCard>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="risk">
            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.users.risks")}>
              <AdminMetricTrendCard label={a.t("admin.analytics.metric.openRiskSignals")} value={String(s.usersWithRiskFlags)} tooltip={USER_KPI_TOOLTIPS.riskFlags} href={ROUTES.adminCompliance} />
              <AdminMetricTrendCard label={a.t("admin.analytics.metric.highCritical")} value={String(s.highRiskUsers)} tooltip={USER_KPI_TOOLTIPS.highRisk} href={`${ROUTES.adminCompliance}?severity=high`} />
              <AdminMetricTrendCard label={a.t("admin.analytics.metric.blockedUsers")} value={String(s.blockedUsers)} tooltip={USER_KPI_TOOLTIPS.blocked} href={usersFilterHref({ status: "suspended" })} />
            </AdminAnalyticsKpiGroup>
            <AdminChartCard title="Пользователи с рисками" className="mt-6" drilldownHref={ROUTES.adminCompliance} empty={!riskUsers?.items?.length}>
              <AdminDataTable columns={riskCols} rows={riskUsers?.items ?? []} rowKey={(r) => r.userId} emptyMessage={USER_CHART_EMPTY.risk.description} />
            </AdminChartCard>
            <section className={cn(ADMIN_SECTION_TILE, "mt-6 p-5")}>
              <h2 className="text-sm font-semibold text-zinc-100">Переходы</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {DRILL_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="group flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-900/80">
                    {link.label}
                    <ArrowRight className="size-4 opacity-0 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </section>
          </AdminAnalyticsTabPanel>
        </>
      )}
    </AdminAnalyticsPageShell>
  );
}
