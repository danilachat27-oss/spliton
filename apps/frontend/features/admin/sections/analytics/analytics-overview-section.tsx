"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Coins,
  FileSpreadsheet,
  LineChart,
  ShieldAlert,
  Users,
} from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { ROUTES } from "@/constants/routes";
import { AdminAnalyticsExportButton } from "@/features/admin/analytics/components/admin-analytics-export-button";
import { AdminAnalyticsInsightsPanel } from "@/features/admin/analytics/components/admin-analytics-insights-panel";
import { AdminAnalyticsKpiGroup } from "@/features/admin/analytics/components/admin-analytics-kpi-group";
import { AdminChartCard } from "@/features/admin/analytics/components/admin-chart-card";
import {
  AdminBarChart,
  AdminDonutChart,
  AdminMultiLineChart,
} from "@/features/admin/analytics/components/admin-charts.lazy";
import { AdminMetricTrendCard } from "@/features/admin/analytics/components/admin-metric-trend-card";
import { AdminPeriodSelector } from "@/features/admin/analytics/components/admin-period-selector";
import { ANALYTICS_OVERVIEW_TABS } from "@/features/admin/analytics/config/analytics-page-tabs";
import { AdminAnalyticsPageShell } from "@/features/admin/analytics/ui/admin-analytics-page-shell";
import { AdminAnalyticsSection } from "@/features/admin/analytics/ui/admin-analytics-section";
import { AdminAnalyticsTabPanel } from "@/features/admin/analytics/ui/admin-analytics-tab-panel";
import {
  countPointsToValues,
  moneyPointsToValues,
  parseAnalyticsMoney,
  useAnalyticsPeriod,
} from "@/features/admin/analytics/hooks/use-analytics-period";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  buildAnalyticsAttentionItems,
  buildExecutiveSummary,
  feeCodeLabel,
  kpiTooltipsForLocale,
} from "@/features/admin/lib/admin-analytics-i18n";
import {
  ADMIN_METRIC_NA_LABEL,
  formatAdminDateShort,
  formatAdminMetricUsdt,
  formatUsdtAmount,
} from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import {
  labelFromMap,
  RISK_SEVERITY_LABELS,
  SUPPORT_STATUS_LABELS,
} from "@/features/admin/lib/admin-status-maps";
import { getAdminDashboardTasks, getAdminDashboardTrends } from "@/services/admin/adminDashboard.service";
import { getFinanceAnalyticsFees, getFinanceAnalyticsSummary } from "@/services/admin/adminFinanceAnalytics.service";
import { getUserAnalyticsFunnel, getUserAnalyticsSummary } from "@/services/admin/adminUserAnalytics.service";
import { getMarketAnalyticsSummary } from "@/services/admin/adminMarketAnalytics.service";
import {
  getRiskAnalyticsBySeverity,
  getRiskAnalyticsSummary,
} from "@/services/admin/adminRiskAnalytics.service";
import {
  getSupportAnalyticsByStatus,
  getSupportAnalyticsSummary,
} from "@/services/admin/adminSupportAnalytics.service";
import { getAdminReportsSummary } from "@/services/admin/adminReports.service";
import { AdminErrorState } from "@/features/admin/ui/admin-error-state";
import { AdminLoadingState } from "@/features/admin/ui/admin-loading-state";
import { cn } from "@/lib/utils";

import {
  ANALYTICS_CHART,
  ANALYTICS_SEVERITY_COLORS,
  ANALYTICS_SUPPORT_STATUS_COLORS,
  adminAnalyticsHealthBannerBodyClass,
  adminAnalyticsHealthBannerSurface,
  adminAnalyticsHealthBannerTitleClass,
} from "@/features/admin/analytics/lib/admin-analytics-theme";

function pickNumber(obj: Record<string, unknown> | null | undefined, ...keys: string[]): number {
  if (!obj) return 0;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return 0;
}

function pickString(obj: Record<string, unknown> | null | undefined, ...keys: string[]): string {
  if (!obj) return "0,00";
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.length) return v;
  }
  return "0,00";
}

function funnelStepCount(
  funnel: Awaited<ReturnType<typeof getUserAnalyticsFunnel>> | null,
  key: string,
): number {
  const step = funnel?.steps?.find(
    (s) => (s as { key?: string; step?: string }).key === key || (s as { step?: string }).step === key,
  );
  return step?.count ?? 0;
}

function mergeNetFlowSeries(
  deposits: Array<{ period: string; value: number }>,
  withdrawals: Array<{ period: string; value: number }>,
) {
  const periods = [...new Set([...deposits.map((p) => p.period), ...withdrawals.map((p) => p.period)])].sort();
  return periods.map((period) => ({
    period,
    value:
      (deposits.find((p) => p.period === period)?.value ?? 0) -
      (withdrawals.find((p) => p.period === period)?.value ?? 0),
  }));
}

const DRILL_LINKS = [
  { href: ROUTES.adminAnalyticsFinance, label: "Финансовая", icon: Coins },
  { href: ROUTES.adminAnalyticsUsers, label: "Пользователи", icon: Users },
  { href: ROUTES.adminAnalyticsMarket, label: "Вторичный рынок", icon: LineChart },
  { href: ROUTES.adminPlatformRevenue, label: "Доход платформы", icon: BarChart3 },
  { href: ROUTES.adminAnalyticsRisk, label: "Риски", icon: ShieldAlert },
  { href: ROUTES.adminReports, label: "Отчёты", icon: FileSpreadsheet },
] as const;

export function AnalyticsOverviewSection() {
  const a = useAdminI18n();
  const KPI = kpiTooltipsForLocale(a.locale);
  const client = useAdminApi();
  const { period, setPeriod, query, customFrom, customTo, setCustomDates } = useAnalyticsPeriod("30d");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [trends, setTrends] = React.useState<Awaited<ReturnType<typeof getAdminDashboardTrends>>>(null);
  const [finance, setFinance] = React.useState<Awaited<ReturnType<typeof getFinanceAnalyticsSummary>> | null>(
    null,
  );
  const [fees, setFees] = React.useState<Awaited<ReturnType<typeof getFinanceAnalyticsFees>> | null>(null);
  const [users, setUsers] = React.useState<Awaited<ReturnType<typeof getUserAnalyticsSummary>> | null>(null);
  const [funnel, setFunnel] = React.useState<Awaited<ReturnType<typeof getUserAnalyticsFunnel>> | null>(null);
  const [market, setMarket] = React.useState<Awaited<ReturnType<typeof getMarketAnalyticsSummary>> | null>(null);
  const [risk, setRisk] = React.useState<Awaited<ReturnType<typeof getRiskAnalyticsSummary>> | null>(null);
  const [riskBySeverity, setRiskBySeverity] = React.useState<
    Awaited<ReturnType<typeof getRiskAnalyticsBySeverity>> | null
  >(null);
  const [support, setSupport] = React.useState<Awaited<ReturnType<typeof getSupportAnalyticsSummary>> | null>(
    null,
  );
  const [supportByStatus, setSupportByStatus] = React.useState<
    Awaited<ReturnType<typeof getSupportAnalyticsByStatus>> | null
  >(null);
  const [reportsSummary, setReportsSummary] = React.useState<
    Awaited<ReturnType<typeof getAdminReportsSummary>> | null
  >(null);
  const [tasks, setTasks] = React.useState<Awaited<ReturnType<typeof getAdminDashboardTasks>>>([]);
  const [optionalWidgetError, setOptionalWidgetError] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    setOptionalWidgetError(false);
    void (async () => {
      try {
        const [t, f, fee, u, fun, m, r, rSev, s, sSt] = await Promise.all([
          getAdminDashboardTrends(query, client),
          getFinanceAnalyticsSummary(query, client),
          getFinanceAnalyticsFees(query, client),
          getUserAnalyticsSummary(query, client),
          getUserAnalyticsFunnel(query, client),
          getMarketAnalyticsSummary(query, client),
          getRiskAnalyticsSummary(query, client),
          getRiskAnalyticsBySeverity(query, client),
          getSupportAnalyticsSummary(query, client),
          getSupportAnalyticsByStatus(query, client),
        ]);
        setTrends(t);
        setFinance(f);
        setFees(fee);
        setUsers(u);
        setFunnel(fun);
        setMarket(m);
        setRisk(r);
        setRiskBySeverity(rSev);
        setSupport(s);
        setSupportByStatus(sSt);
        setLastUpdated(new Date().toISOString());

        const [repResult, tasksResult] = await Promise.allSettled([
          getAdminReportsSummary(undefined, client),
          getAdminDashboardTasks(client),
        ]);
        let optionalFailed = false;
        if (repResult.status === "fulfilled") {
          setReportsSummary(repResult.value);
        } else {
          setReportsSummary(null);
          optionalFailed = true;
        }
        if (tasksResult.status === "fulfilled") {
          setTasks(tasksResult.value);
        } else {
          setTasks([]);
          optionalFailed = true;
        }
        setOptionalWidgetError(optionalFailed);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [client, query]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading && !finance && !trends) {
    return <AdminLoadingState label={a.t("admin.analytics.overview.loading")} centered />;
  }

  if (error) {
    return <AdminErrorState onRetry={load} />;
  }

  const financeRec = finance as Record<string, unknown> | null;
  const usersRec = users as Record<string, unknown> | null;
  const marketRec = market as Record<string, unknown> | null;
  const riskRec = risk as Record<string, unknown> | null;
  const supportRec = support as Record<string, unknown> | null;

  const depositsUsdt = pickString(financeRec, "depositsUsdt");
  const withdrawalsUsdt = pickString(financeRec, "withdrawalsUsdt");
  const netFlowUsdt = pickString(financeRec, "netFlowUsdt");
  const platformRevenueUsdt = pickString(financeRec, "feesUsdt");
  const pendingWithdrawalsUsdt = pickString(financeRec, "pendingWithdrawalsUsdt");
  const deltas = (financeRec?.deltas ?? {}) as {
    depositsPct?: number | null;
    withdrawalsPct?: number | null;
    netFlowPct?: number | null;
  };

  const newUsers = pickNumber(usersRec, "newUsers");
  const activeUsers = pickNumber(usersRec, "activeUsers", "active");
  const firstDeposit = funnelStepCount(funnel, "first_deposit");
  const firstPurchase = funnelStepCount(funnel, "first_units");

  const completedTrades = pickNumber(marketRec, "completedTrades", "tradesCompleted");
  const volumeUsdt = pickString(marketRec, "volumeUsdt");
  const activeListings = pickNumber(marketRec, "activeListings");
  const avgPrice =
    marketRec?.avgPricePerUnit != null
      ? formatUsdtAmount(String(marketRec.avgPricePerUnit))
      : completedTrades > 0
        ? formatUsdtAmount(String(parseAnalyticsMoney(volumeUsdt) / completedTrades))
        : ADMIN_METRIC_NA_LABEL;

  const openFlags = pickNumber(riskRec, "openFlags");
  const criticalRisk = pickNumber(riskRec, "criticalCount");
  const highRisk = pickNumber(riskRec, "highSeverity", "highCount");
  const openTickets = pickNumber(supportRec, "openTickets");
  const overdueSla = pickNumber(supportRec, "overdueSla");

  const depositPoints = trends?.deposits ? moneyPointsToValues(trends.deposits) : [];
  const withdrawalPoints = trends?.withdrawals ? moneyPointsToValues(trends.withdrawals) : [];
  const netFlowPoints = mergeNetFlowSeries(depositPoints, withdrawalPoints);
  const revenuePoints = trends?.platformRevenue ? moneyPointsToValues(trends.platformRevenue) : [];
  const newUserPoints = trends?.newUsers ? countPointsToValues(trends.newUsers) : [];
  const marketVolumePoints = trends?.marketVolume ? moneyPointsToValues(trends.marketVolume) : [];
  const marketTradePoints = trends?.marketTrades ? countPointsToValues(trends.marketTrades) : [];

  const hasActivity =
    parseAnalyticsMoney(depositsUsdt) > 0 ||
    parseAnalyticsMoney(withdrawalsUsdt) > 0 ||
    newUsers > 0 ||
    completedTrades > 0 ||
    depositPoints.some((p) => p.value > 0) ||
    newUserPoints.some((p) => p.value > 0);

  const executive = buildExecutiveSummary(
    {
      hasActivity,
      finance: { depositsUsdt, withdrawalsUsdt, netFlowUsdt },
      market: { completedTrades, volumeUsdt },
      risk: { openFlags, criticalCount: criticalRisk || highRisk },
      support: { openTickets },
    },
    a.locale,
  );

  const attentionItems = buildAnalyticsAttentionItems(
    {
      finance: {
        pendingWithdrawalsUsdt,
        manualReviewDeposits: pickNumber(financeRec, "manualReviewDeposits"),
      },
      risk: {
        openFlags,
        criticalCount: criticalRisk,
        highSeverity: highRisk,
        frozenOperations: pickNumber(riskRec, "frozenOperations"),
      },
      support: { openTickets, overdueSla },
      reportsFailed: reportsSummary?.failed24h ?? 0,
      tasks,
    },
    a.locale,
  );

  const riskDonut = (riskBySeverity?.items ?? [])
    .filter((i) => i.count > 0)
    .map((i) => ({
      label: labelFromMap(RISK_SEVERITY_LABELS, i.severity),
      value: i.count,
      color: ANALYTICS_SEVERITY_COLORS[i.severity.toLowerCase()] ?? ANALYTICS_CHART.neutral,
    }));

  const supportDonut = (supportByStatus?.items ?? [])
    .filter((i) => i.count > 0)
    .map((i) => ({
      label: labelFromMap(SUPPORT_STATUS_LABELS, i.status),
      value: i.count,
      color: ANALYTICS_SUPPORT_STATUS_COLORS[i.status.toLowerCase()] ?? ANALYTICS_CHART.neutral,
    }));

  const feeBars = (fees?.items ?? []).map((item) => ({
    label: feeCodeLabel(item.feeCode, a.locale),
    value: parseAnalyticsMoney(item.amountUsdt),
    color: ANALYTICS_CHART.lime,
  }));

  const executiveBannerClass = adminAnalyticsHealthBannerSurface(executive.tone);

  const overviewKpis = (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <AdminMetricTrendCard
        label={a.t("admin.analytics.operations.kpi.deposits")}
        value={formatUsdtAmount(depositsUsdt)}
        deltaPct={deltas.depositsPct}
        tooltip={KPI.deposits}
        href={ROUTES.adminDeposits}
        trend={depositPoints.map((p) => p.value)}
      />
      <AdminMetricTrendCard
        label={a.t("admin.analytics.operations.kpi.withdrawals")}
        value={formatUsdtAmount(withdrawalsUsdt)}
        deltaPct={deltas.withdrawalsPct}
        tooltip={KPI.withdrawals}
        href={ROUTES.adminWithdrawals}
        trend={withdrawalPoints.map((p) => p.value)}
      />
      <AdminMetricTrendCard
        label={a.t("admin.analytics.finance.netFlow")}
        value={formatUsdtAmount(netFlowUsdt)}
        deltaPct={deltas.netFlowPct}
        tooltip={KPI.netFlow}
        href={ROUTES.adminAnalyticsFinance}
        trend={netFlowPoints.map((p) => p.value)}
      />
      <AdminMetricTrendCard
        label={a.t("admin.analytics.metric.newUsers")}
        value={String(newUsers)}
        deltaPct={(usersRec?.deltas as { newUsersPct?: number | null })?.newUsersPct}
        tooltip={KPI.newUsers}
        href={ROUTES.adminAnalyticsUsers}
        trend={newUserPoints.map((p) => p.value)}
      />
      <AdminMetricTrendCard
        label={a.t("admin.analytics.metric.marketTrades")}
        value={String(completedTrades)}
        tooltip={KPI.tradesCount}
        href={ROUTES.adminSecondaryMarket}
      />
      <AdminMetricTrendCard
        label={a.t("admin.analytics.metric.openRiskSignals")}
        value={String(openFlags)}
        tooltip={KPI.openFlags}
        href={ROUTES.adminCompliance}
      />
    </div>
  );

  const drillSection = (
    <section className={cn(ADMIN_SECTION_TILE, "p-5")}>
      <h2 className="text-sm font-semibold text-zinc-100">Детальная аналитика</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Перейдите в доменные разделы для drill-down, сегментов и экспорта.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {DRILL_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center justify-between gap-2 rounded-2xl bg-zinc-50/80 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-900/80"
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4 text-zinc-500 group-hover:text-zinc-200" />
                {link.label}
              </span>
              <ArrowRight className="size-4 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>
    </section>
  );

  return (
    <AdminAnalyticsPageShell
      activeSection="analyticsOverview"
      title={a.t("admin.analytics.overview.title")}
      description={a.t("admin.analytics.overview.description")}
      breadcrumbs={a.adminSectionBreadcrumbs("analyticsOverview")}
      pageTabs={ANALYTICS_OVERVIEW_TABS}
      actions={
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <AdminPeriodSelector
              value={period}
              onChange={setPeriod}
              customFrom={customFrom}
              customTo={customTo}
              onCustomDatesChange={setCustomDates}
            />
            <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={load} disabled={loading}>
              {loading ? a.t("admin.analytics.common.refreshing") : a.t("admin.analytics.common.refresh")}
            </Button>
            <AdminAnalyticsExportButton
              reportType="finance_cashflow"
              label={a.t("admin.analytics.common.export")}
              period={period}
              customFrom={customFrom}
              customTo={customTo}
            />
          </div>
          {lastUpdated ? (
            <p className="text-xs text-zinc-400">
              {a.t("admin.analytics.common.updatedAt")} {formatAdminDateShort(lastUpdated)}
            </p>
          ) : null}
        </div>
      }
    >
      {(tab) => (
        <>
          <AdminAnalyticsTabPanel activeTab={tab} tabId="overview">
            {optionalWidgetError ? (
              <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {a.t("admin.ui.widgetUnavailable")}
              </p>
            ) : null}
            <div className={cn(ADMIN_SECTION_TILE, "border p-5 sm:p-6", executiveBannerClass)}>
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  adminAnalyticsHealthBannerTitleClass(executive.tone),
                )}
              >
                {executive.title}
              </p>
              <p
                className={cn(
                  "mt-2 max-w-4xl text-sm leading-relaxed",
                  adminAnalyticsHealthBannerBodyClass(executive.tone),
                )}
              >
                {executive.body}
              </p>
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
              <AdminAnalyticsSection
                title={a.t("admin.analytics.common.keyMetrics")}
                description={a.t("admin.analytics.common.keyMetricsDesc")}
              >
                {overviewKpis}
              </AdminAnalyticsSection>
              <AdminAnalyticsInsightsPanel items={attentionItems} className="xl:sticky xl:top-4 xl:self-start" />
            </div>
            <div className="mt-6">
              <AdminChartCard
                title={a.t("admin.analytics.overview.platformActivity")}
                description={a.t("admin.analytics.finance.cashflowDesc")}
                className="xl:col-span-2"
                empty={!depositPoints.length && !withdrawalPoints.length && !netFlowPoints.length}
                emptyVariant="finance"
                drilldownHref={ROUTES.adminAnalyticsFinance}
                lastUpdated={lastUpdated ?? undefined}
              >
                <AdminMultiLineChart
                  series={[
                    { key: "deposits", label: "Пополнения", color: ANALYTICS_CHART.deposits, points: depositPoints },
                    { key: "withdrawals", label: "Выводы", color: ANALYTICS_CHART.withdrawals, points: withdrawalPoints },
                    { key: "net", label: "Чистый поток", color: ANALYTICS_CHART.netFlow, points: netFlowPoints },
                  ]}
                  formatValue={(v) => `${v.toLocaleString("ru-RU")} USDT`}
                />
              </AdminChartCard>
            </div>
            {drillSection}
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="finance">
            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.tracks.kpiGroup.finance")} description={a.t("admin.analytics.overview.financeTabDesc")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.operations.kpi.deposits")}
                value={formatUsdtAmount(depositsUsdt)}
                deltaPct={deltas.depositsPct}
                tooltip={KPI.deposits}
                href={ROUTES.adminDeposits}
                trend={depositPoints.map((p) => p.value)}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.operations.kpi.withdrawals")}
                value={formatUsdtAmount(withdrawalsUsdt)}
                deltaPct={deltas.withdrawalsPct}
                tooltip={KPI.withdrawals}
                href={ROUTES.adminWithdrawals}
                trend={withdrawalPoints.map((p) => p.value)}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.finance.netFlow")}
                value={formatUsdtAmount(netFlowUsdt)}
                deltaPct={deltas.netFlowPct}
                tooltip={KPI.netFlow}
                href={ROUTES.adminAnalyticsFinance}
                trend={netFlowPoints.map((p) => p.value)}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.tracks.platformRevenue")}
                value={formatUsdtAmount(platformRevenueUsdt)}
                tooltip={KPI.platformRevenue}
                href={ROUTES.adminPlatformRevenue}
                trend={revenuePoints.map((p) => p.value)}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.finance.pendingQueue")}
                value={formatUsdtAmount(pendingWithdrawalsUsdt)}
                tooltip={KPI.pendingWithdrawals}
                href={`${ROUTES.adminWithdrawals}?status=requested`}
              />
            </AdminAnalyticsKpiGroup>
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              <AdminChartCard
                title={a.t("admin.analytics.overview.cashflow")}
                description={a.t("admin.analytics.finance.cashflowDesc")}
                className="xl:col-span-2"
                empty={!depositPoints.length && !withdrawalPoints.length && !netFlowPoints.length}
                emptyVariant="finance"
                drilldownHref={ROUTES.adminAnalyticsFinance}
              >
                <AdminMultiLineChart
                  series={[
                    { key: "deposits", label: "Пополнения", color: ANALYTICS_CHART.deposits, points: depositPoints },
                    { key: "withdrawals", label: "Выводы", color: ANALYTICS_CHART.withdrawals, points: withdrawalPoints },
                    { key: "net", label: "Чистый поток", color: ANALYTICS_CHART.netFlow, points: netFlowPoints },
                  ]}
                  formatValue={(v) => `${v.toLocaleString("ru-RU")} USDT`}
                />
              </AdminChartCard>
              <AdminChartCard
                title={a.t("admin.analytics.tracks.platformRevenue")}
                description={a.t("admin.analytics.overview.platformRevenueDesc")}
                empty={!revenuePoints.length && !feeBars.length}
                emptyVariant="revenue"
                drilldownHref={ROUTES.adminPlatformRevenue}
              >
                <div className="space-y-6">
                  <AdminMultiLineChart
                    series={[
                      { key: "revenue", label: "Доход платформы", color: ANALYTICS_CHART.revenue, points: revenuePoints },
                    ]}
                    formatValue={(v) => `${v.toLocaleString("ru-RU")} USDT`}
                  />
                  {feeBars.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-medium text-zinc-500">Структура комиссий за период</p>
                      <AdminBarChart items={feeBars} formatValue={(v) => formatUsdtAmount(String(v))} />
                    </div>
                  ) : null}
                </div>
              </AdminChartCard>
            </div>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="users">
            <AdminAnalyticsKpiGroup title={a.t("admin.section.users")} description={a.t("admin.analytics.overview.usersTabDesc")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.newUsers")}
                value={String(newUsers)}
                deltaPct={(usersRec?.deltas as { newUsersPct?: number | null })?.newUsersPct}
                tooltip={KPI.newUsers}
                href={ROUTES.adminAnalyticsUsers}
                trend={newUserPoints.map((p) => p.value)}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.activeUsers")}
                value={String(activeUsers)}
                tooltip={KPI.activeUsers}
                href={ROUTES.adminUsers}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.firstDeposit")}
                value={String(firstDeposit)}
                tooltip={KPI.firstDeposit}
                href={ROUTES.adminAnalyticsUsers}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.firstPurchase")}
                value={String(firstPurchase)}
                tooltip={KPI.firstPurchase}
                href={ROUTES.adminAnalyticsUsers}
              />
            </AdminAnalyticsKpiGroup>
            <div className="mt-6">
              <AdminChartCard
                title={a.t("admin.section.users")}
                description={a.t("admin.analytics.overview.usersChartDesc")}
                empty={!newUserPoints.length && firstDeposit === 0 && firstPurchase === 0}
                emptyVariant="users"
                drilldownHref={ROUTES.adminAnalyticsUsers}
              >
                <div className="space-y-6">
                  <AdminMultiLineChart
                    series={[{ key: "newUsers", label: "Новые пользователи", color: ANALYTICS_CHART.users, points: newUserPoints }]}
                  />
                  {(firstDeposit > 0 || firstPurchase > 0) && (
                    <AdminBarChart
                      items={[
                        { label: "Первый депозит", value: firstDeposit, color: ANALYTICS_CHART.deposits },
                        { label: "Первая покупка", value: firstPurchase, color: ANALYTICS_CHART.secondary },
                      ]}
                    />
                  )}
                </div>
              </AdminChartCard>
            </div>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="market">
            <AdminAnalyticsKpiGroup title={a.t("admin.section.analyticsMarket")} description={a.t("admin.analytics.overview.marketTabDesc")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.marketVolume")}
                value={formatUsdtAmount(volumeUsdt)}
                tooltip={KPI.marketVolume}
                href={ROUTES.adminSecondaryMarket}
                trend={marketVolumePoints.map((p) => p.value)}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.market.trades")}
                value={String(completedTrades)}
                tooltip={KPI.tradesCount}
                href={ROUTES.adminSecondaryMarket}
                trend={marketTradePoints.map((p) => p.value)}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.tracks.kpi.activeListings")}
                value={String(activeListings)}
                tooltip={KPI.activeListings}
                href={ROUTES.adminSecondaryMarket}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.avgPricePerUnit")}
                value={avgPrice}
                tooltip={KPI.avgPrice}
                href={ROUTES.adminAnalyticsMarket}
              />
            </AdminAnalyticsKpiGroup>
            <div className="mt-6">
              <AdminChartCard
                title={a.t("admin.section.analyticsMarket")}
                description={a.t("admin.analytics.overview.marketChartDesc")}
                empty={!marketVolumePoints.length && !marketTradePoints.length}
                emptyVariant="market"
                drilldownHref={ROUTES.adminAnalyticsMarket}
              >
                <AdminMultiLineChart
                  series={[
                    { key: "volume", label: "Объём USDT", color: ANALYTICS_CHART.volume, points: marketVolumePoints },
                    { key: "trades", label: "Сделки", color: ANALYTICS_CHART.trades, points: marketTradePoints },
                  ]}
                  formatValue={(v) => v.toLocaleString("ru-RU")}
                />
              </AdminChartCard>
            </div>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="risk">
            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.overview.riskSupport")} description={a.t("admin.analytics.overview.riskSupportDesc")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.openRiskSignals")}
                value={String(openFlags)}
                tooltip={KPI.openFlags}
                href={ROUTES.adminCompliance}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.highCritical")}
                value={String(criticalRisk || highRisk)}
                tooltip={KPI.criticalRisk}
                href={`${ROUTES.adminCompliance}?severity=high`}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.operations.kpi.openTickets")}
                value={String(openTickets)}
                tooltip={KPI.openTickets}
                href={ROUTES.adminSupport}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.overdueSla")}
                value={String(overdueSla)}
                tooltip={KPI.overdueSla}
                href={ROUTES.adminSupport}
              />
            </AdminAnalyticsKpiGroup>
            <div className="mt-6">
              <AdminChartCard
                title={a.t("admin.analytics.overview.riskSupport")}
                description={a.t("admin.analytics.overview.riskSupportChartDesc")}
                empty={!riskDonut.length && !supportDonut.length}
                emptyVariant="risk"
                drilldownHref={ROUTES.adminCompliance}
              >
                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <p className="mb-3 text-xs font-medium text-zinc-500">Риск-сигналы</p>
                    {riskDonut.length ? (
                      <AdminDonutChart items={riskDonut} />
                    ) : (
                      <p className="text-sm text-zinc-500">Активных риск-сигналов нет</p>
                    )}
                  </div>
                  <div>
                    <p className="mb-3 text-xs font-medium text-zinc-500">Поддержка</p>
                    {supportDonut.length ? (
                      <AdminDonutChart items={supportDonut} />
                    ) : (
                      <p className="text-sm text-zinc-500">Открытых обращений нет</p>
                    )}
                  </div>
                </div>
              </AdminChartCard>
            </div>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="insights">
            <AdminAnalyticsInsightsPanel items={attentionItems} />
            {drillSection}
          </AdminAnalyticsTabPanel>
        </>
      )}
    </AdminAnalyticsPageShell>
  );
}
