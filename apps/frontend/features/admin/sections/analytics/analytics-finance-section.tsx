"use client";

import * as React from "react";

import { AdminSectionRefreshButton } from "@/features/admin/components/admin-section-layout";
import { ROUTES } from "@/constants/routes";
import { AdminChartCard } from "@/features/admin/analytics/components/admin-chart-card";
import { AdminBarChart, AdminLineChart, AdminMultiLineChart } from "@/features/admin/analytics/components/admin-charts.lazy";
import { AdminAnalyticsKpiGroup } from "@/features/admin/analytics/components/admin-analytics-kpi-group";
import { AdminMetricTrendCard } from "@/features/admin/analytics/components/admin-metric-trend-card";
import { AdminPeriodSelector } from "@/features/admin/analytics/components/admin-period-selector";
import { ANALYTICS_FINANCE_TABS } from "@/features/admin/analytics/config/analytics-page-tabs";
import { AdminAnalyticsPageShell, AdminAnalyticsPageError, AdminAnalyticsPageLoading } from "@/features/admin/analytics/ui/admin-analytics-page-shell";
import {
  moneyPointsToValues,
  parseAnalyticsMoney,
  useAnalyticsPeriod,
} from "@/features/admin/analytics/hooks/use-analytics-period";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminMetricHours, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { AdminKpiValue } from "@/features/admin/ui/admin-kpi-value";
import { feeCodeLabel, kpiTooltipsForLocale } from "@/features/admin/lib/admin-analytics-i18n";
import { ADMIN_ANALYTICS_INLINE_STAT } from "@/features/admin/lib/admin-section-styles";
import {
  getFinanceAnalyticsCashflow,
  getFinanceAnalyticsFailures,
  getFinanceAnalyticsFees,
  getFinanceAnalyticsSummary,
  getFinanceAnalyticsWithdrawalProcessing,
} from "@/services/admin/adminFinanceAnalytics.service";
import { AdminDataTable, type AdminColumn } from "@/features/admin/ui/admin-data-table";

type FailureRow = { id: string; type: string; amountUsdt: string; createdAt: string };

export function AnalyticsFinanceSection() {
  const a = useAdminI18n();
  const KPI = kpiTooltipsForLocale(a.locale);
  const client = useAdminApi();
  const { period, setPeriod, query, customFrom, customTo, setCustomDates } = useAnalyticsPeriod("30d");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getFinanceAnalyticsSummary>> | null>(null);
  const [cashflow, setCashflow] = React.useState<Awaited<ReturnType<typeof getFinanceAnalyticsCashflow>> | null>(null);
  const [fees, setFees] = React.useState<Awaited<ReturnType<typeof getFinanceAnalyticsFees>> | null>(null);
  const [processing, setProcessing] = React.useState<Awaited<ReturnType<typeof getFinanceAnalyticsWithdrawalProcessing>> | null>(null);
  const [failures, setFailures] = React.useState<Awaited<ReturnType<typeof getFinanceAnalyticsFailures>> | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      getFinanceAnalyticsSummary(query, client),
      getFinanceAnalyticsCashflow(query, client),
      getFinanceAnalyticsFees(query, client),
      getFinanceAnalyticsWithdrawalProcessing(query, client),
      getFinanceAnalyticsFailures(query, client),
    ])
      .then(([s, c, f, p, fail]) => {
        setSummary(s);
        setCashflow(c);
        setFees(f);
        setProcessing(p);
        setFailures(fail);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [client, query]);

  React.useEffect(() => {
    load();
  }, [load]);

  const failureCols: AdminColumn<FailureRow>[] = [
    { key: "type", header: a.table.type, render: (r) => r.type },
    { key: "amount", header: a.table.amount, render: (r) => formatUsdtAmount(r.amountUsdt) },
    { key: "created", header: a.table.created, render: (r) => r.createdAt.slice(0, 16).replace("T", " ") },
  ];

  if (loading && !summary) {
    return <AdminAnalyticsPageLoading label={a.t("admin.analytics.finance.loading")} />;
  }

  if (error || !summary) {
    return <AdminAnalyticsPageError onRetry={load} />;
  }

  const netFlowSeries = (cashflow?.items ?? []).map((item) => ({
    period: item.period,
    value: parseAnalyticsMoney(item.netFlowUsdt),
  }));

  const depositsAmount = parseAnalyticsMoney(summary.depositsUsdt);
  const withdrawalsAmount = parseAnalyticsMoney(summary.withdrawalsUsdt);
  const netFlowAmount = parseAnalyticsMoney(summary.netFlowUsdt);
  const pendingAmount = parseAnalyticsMoney(summary.pendingWithdrawalsUsdt);

  return (
    <AdminAnalyticsPageShell
      activeSection="analyticsFinance"
      title={a.t("admin.analytics.finance.title")}
      description={a.t("admin.analytics.finance.description")}
      breadcrumbs={a.adminSectionBreadcrumbs("analyticsFinance")}
      pageTabs={ANALYTICS_FINANCE_TABS}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <AdminPeriodSelector value={period} onChange={setPeriod} customFrom={customFrom} customTo={customTo} onCustomDatesChange={setCustomDates} />
          <AdminSectionRefreshButton onClick={load} loading={loading} />
        </div>
      }
    >
      {(tab) => (
        <>
          {tab === "overview" ? (
            <>
              <AdminAnalyticsKpiGroup
                title={a.t("admin.analytics.common.keyMetrics")}
                description={a.t("admin.analytics.common.keyMetricsDesc")}
                gridClassName="xl:grid-cols-3"
              >
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.filters.ops.category.deposit")}
                  value={formatUsdtAmount(summary.depositsUsdt)}
                  deltaPct={summary.deltas?.depositsPct}
                  href={ROUTES.adminDeposits}
                  tooltip={KPI.deposits}
                  activeTone={depositsAmount > 0 ? "success" : "neutral"}
                />
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.filters.ops.category.withdrawal")}
                  value={formatUsdtAmount(summary.withdrawalsUsdt)}
                  deltaPct={summary.deltas?.withdrawalsPct}
                  href={ROUTES.adminWithdrawals}
                  tooltip={KPI.withdrawals}
                  activeTone={withdrawalsAmount > 0 ? "warning" : "neutral"}
                />
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.finance.netFlow")}
                  value={formatUsdtAmount(summary.netFlowUsdt)}
                  deltaPct={summary.deltas?.netFlowPct}
                  tooltip={KPI.netFlow}
                  activeTone={netFlowAmount > 0 ? "success" : netFlowAmount < 0 ? "danger" : "neutral"}
                />
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.finance.pendingQueue")}
                  value={formatUsdtAmount(summary.pendingWithdrawalsUsdt)}
                  href={`${ROUTES.adminWithdrawals}?status=requested`}
                  tooltip={KPI.pendingWithdrawals}
                  activeTone={pendingAmount > 0 ? "warning" : "neutral"}
                />
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.finance.fees")}
                  value={formatUsdtAmount(summary.feesUsdt)}
                  href={ROUTES.adminPlatformRevenue}
                  tooltip={KPI.platformRevenue}
                  activeTone={parseAnalyticsMoney(summary.feesUsdt) > 0 ? "success" : "neutral"}
                />
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.finance.lockedBalance")}
                  value={formatUsdtAmount(summary.lockedBalanceUsdt)}
                  tooltip={KPI.lockedBalance}
                />
              </AdminAnalyticsKpiGroup>
              <div className="mt-6">
                <AdminChartCard
                  title={a.t("admin.analytics.finance.cashflowTitle")}
                  description={a.t("admin.analytics.finance.cashflowDesc")}
                  empty={!cashflow?.items?.length}
                  emptyVariant="finance"
                  drilldownHref={ROUTES.adminDeposits}
                >
                  <AdminMultiLineChart
                    series={[
                      {
                        key: "dep",
                        label: a.t("admin.analytics.filters.ops.category.deposit"),
                        color: "#059669",
                        points: (cashflow?.items ?? []).map((i) => ({
                          period: i.period,
                          value: parseAnalyticsMoney(i.depositsUsdt),
                        })),
                      },
                      {
                        key: "wd",
                        label: a.t("admin.analytics.filters.ops.category.withdrawal"),
                        color: "#e11d48",
                        points: (cashflow?.items ?? []).map((i) => ({
                          period: i.period,
                          value: parseAnalyticsMoney(i.withdrawalsUsdt),
                        })),
                      },
                    ]}
                    formatValue={(v) => `${v.toLocaleString(a.locale)} USDT`}
                  />
                </AdminChartCard>
              </div>
            </>
          ) : null}

          {tab === "cashflow" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <AdminChartCard
                title={a.t("admin.analytics.finance.depositsWithdrawalsDaily")}
                empty={!cashflow?.items?.length}
                emptyVariant="finance"
                drilldownHref={ROUTES.adminDeposits}
              >
                <AdminMultiLineChart
                  series={[
                    {
                      key: "dep",
                      label: a.t("admin.analytics.filters.ops.category.deposit"),
                      color: "#059669",
                      points: (cashflow?.items ?? []).map((i) => ({
                        period: i.period,
                        value: parseAnalyticsMoney(i.depositsUsdt),
                      })),
                    },
                    {
                      key: "wd",
                      label: a.t("admin.analytics.filters.ops.category.withdrawal"),
                      color: "#e11d48",
                      points: (cashflow?.items ?? []).map((i) => ({
                        period: i.period,
                        value: parseAnalyticsMoney(i.withdrawalsUsdt),
                      })),
                    },
                  ]}
                  formatValue={(v) => `${v.toLocaleString(a.locale)} USDT`}
                />
              </AdminChartCard>
              <AdminChartCard
                title={a.t("admin.analytics.finance.netFlowDaily")}
                description={a.t("admin.analytics.finance.netFlowDailyDesc")}
                empty={!netFlowSeries.length}
                emptyVariant="finance"
              >
                <AdminLineChart
                  points={netFlowSeries}
                  formatValue={(v) => `${v.toLocaleString(a.locale)} USDT`}
                  showNegativeColor
                />
              </AdminChartCard>
            </div>
          ) : null}

          {tab === "fees" ? (
            <AdminChartCard
              title={a.t("admin.analytics.finance.feesByType")}
              description={a.t("admin.analytics.finance.feesByTypeDesc")}
              empty={!fees?.items?.length}
              emptyVariant="finance"
              drilldownHref={ROUTES.adminPlatformRevenue}
            >
              <AdminBarChart
                items={(fees?.items ?? []).map((f) => ({
                  label: feeCodeLabel(f.feeCode, a.locale),
                  value: parseAnalyticsMoney(f.amountUsdt),
                }))}
                formatValue={(v) => `${v.toLocaleString(a.locale, { minimumFractionDigits: 2 })} USDT`}
              />
            </AdminChartCard>
          ) : null}

          {tab === "deposits" ? (
            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.finance.depositsSection")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.finance.depositsPeriod")}
                value={formatUsdtAmount(summary.depositsUsdt)}
                href={ROUTES.adminDeposits}
                tooltip={KPI.deposits}
                activeTone={depositsAmount > 0 ? "success" : "neutral"}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.finance.manualReview")}
                value={String(summary.manualReviewDeposits)}
                href={`${ROUTES.adminDeposits}?status=manual_review`}
                tooltip={a.t("admin.analytics.finance.manualReviewTooltip")}
                activeTone={summary.manualReviewDeposits > 0 ? "warning" : "neutral"}
              />
            </AdminAnalyticsKpiGroup>
          ) : null}

          {tab === "withdrawals" ? (
            <div className="space-y-4">
              <AdminAnalyticsKpiGroup title={a.t("admin.analytics.finance.withdrawalsSection")}>
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.finance.withdrawalsPeriod")}
                  value={formatUsdtAmount(summary.withdrawalsUsdt)}
                  href={ROUTES.adminWithdrawals}
                  activeTone={withdrawalsAmount > 0 ? "warning" : "neutral"}
                />
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.finance.inQueue")}
                  value={formatUsdtAmount(summary.pendingWithdrawalsUsdt)}
                  href={ROUTES.adminWithdrawals}
                  activeTone={pendingAmount > 0 ? "warning" : "neutral"}
                />
              </AdminAnalyticsKpiGroup>
              <AdminChartCard
                title={a.t("admin.analytics.finance.processingSpeed")}
                description={a.t("admin.analytics.finance.processingSpeedDesc")}
                empty={!processing?.samples}
                emptyVariant="finance"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className={ADMIN_ANALYTICS_INLINE_STAT}>
                    <p className="text-xs text-zinc-500">{a.t("admin.analytics.finance.avgHours")}</p>
                    <AdminKpiValue value={formatAdminMetricHours(processing?.averageHours ?? null)} />
                  </div>
                  <div className={ADMIN_ANALYTICS_INLINE_STAT}>
                    <p className="text-xs text-zinc-500">{a.t("admin.analytics.finance.medianHours")}</p>
                    <AdminKpiValue value={formatAdminMetricHours(processing?.medianHours ?? null)} />
                  </div>
                  <div className={ADMIN_ANALYTICS_INLINE_STAT}>
                    <p className="text-xs text-zinc-500">{a.t("admin.analytics.finance.sample")}</p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-100">{processing?.samples ?? 0}</p>
                  </div>
                </div>
              </AdminChartCard>
            </div>
          ) : null}

          {tab === "failures" ? (
            <div className="space-y-4">
              <AdminAnalyticsKpiGroup title={a.t("admin.analytics.finance.failedOps")} gridClassName="sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.finance.manualDepositReview")}
                  value={String(summary.manualReviewDeposits)}
                  href={`${ROUTES.adminDeposits}?status=manual_review`}
                  activeTone={summary.manualReviewDeposits > 0 ? "warning" : "neutral"}
                />
              </AdminAnalyticsKpiGroup>
              <AdminChartCard
                title={a.t("admin.analytics.finance.failedOps")}
                description={a.t("admin.analytics.finance.failedOpsDesc")}
                empty={!failures?.items?.length}
                emptyVariant="finance"
                drilldownHref={ROUTES.adminDeposits}
              >
                <AdminDataTable columns={failureCols} rows={failures?.items ?? []} rowKey={(r) => r.id} />
              </AdminChartCard>
            </div>
          ) : null}

          {tab === "detail" ? (
            <AdminAnalyticsKpiGroup
              title={a.t("admin.analytics.common.detail")}
              description={a.t("admin.analytics.finance.detailDesc")}
            >
              <AdminMetricTrendCard
                label={a.t("admin.analytics.finance.availableBalance")}
                value={formatUsdtAmount(summary.availableBalanceUsdt)}
                href={ROUTES.adminWallets}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.finance.locked")}
                value={formatUsdtAmount(summary.lockedBalanceUsdt)}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.finance.fees")}
                value={formatUsdtAmount(summary.feesUsdt)}
                href={ROUTES.adminPlatformRevenue}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.finance.netFlow")}
                value={formatUsdtAmount(summary.netFlowUsdt)}
                activeTone={netFlowAmount > 0 ? "success" : netFlowAmount < 0 ? "danger" : "neutral"}
              />
            </AdminAnalyticsKpiGroup>
          ) : null}
        </>
      )}
    </AdminAnalyticsPageShell>
  );
}
