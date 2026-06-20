"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertTriangle } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { AdminSectionRefreshButton } from "@/features/admin/components/admin-section-layout";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminAnalyticsPageError, AdminAnalyticsPageLoading } from "@/features/admin/analytics/ui/admin-analytics-page-shell";
import { AdminAnalyticsExportButton } from "@/features/admin/analytics/components/admin-analytics-export-button";
import { AdminAnalyticsInsightsPanel } from "@/features/admin/analytics/components/admin-analytics-insights-panel";
import { AdminAnalyticsKpiGroup } from "@/features/admin/analytics/components/admin-analytics-kpi-group";
import { AdminAnalyticsLayout } from "@/features/admin/analytics/components/admin-analytics-layout";
import { AdminChartCard } from "@/features/admin/analytics/components/admin-chart-card";
import { AdminBarChart, AdminDonutChart, AdminLineChart, AdminMultiLineChart } from "@/features/admin/analytics/components/admin-charts.lazy";
import { AdminMetricTrendCard } from "@/features/admin/analytics/components/admin-metric-trend-card";
import { AdminPeriodSelector } from "@/features/admin/analytics/components/admin-period-selector";
import { parseAnalyticsMoney, useAnalyticsPeriod } from "@/features/admin/analytics/hooks/use-analytics-period";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDateShort, formatAdminMetricUsdt, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ADMIN_ANALYTICS_DRILL_LINK, ADMIN_ANALYTICS_INLINE_STAT, ADMIN_SECTION_NOTICE, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { isBusinessAnalyst } from "@/features/admin/config/admin-rbac";
import {
  buildRevenueHealthSummary,
  buildRevenueInsights,
  REVENUE_CHART_EMPTY,
  REVENUE_KPI_TOOLTIPS,
} from "@/features/admin/lib/admin-revenue-analytics-i18n";
import {
  getRevenueAnalyticsByTrack,
  getRevenueAnalyticsDistributions,
  getRevenueAnalyticsEvents,
  getRevenueAnalyticsFailed,
  getRevenueAnalyticsPayouts,
  getRevenueAnalyticsPipeline,
  getRevenueAnalyticsReconciliation,
  getRevenueAnalyticsSplit,
  getRevenueAnalyticsSummary,
  getRevenueAnalyticsTopHolders,
} from "@/services/admin/adminRevenueAnalytics.service";
import {
  AdminDataTable,
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

function pickRevenueSummary(s: Record<string, unknown> | null) {
  return {
    revenueEventsCount: Number(s?.revenueEventsCount ?? 0),
    grossRevenueUsdt: String(s?.grossRevenueUsdt ?? "0,00"),
    avgRevenueEventUsdt: s?.avgRevenueEventUsdt != null ? String(s.avgRevenueEventUsdt) : null,
    eventsWithoutDistribution: Number(s?.eventsWithoutDistribution ?? 0),
    distributedUsdt: String(s?.distributedToHoldersUsdt ?? s?.distributedUsdt ?? "0,00"),
    platformShareUsdt: String(s?.platformShareUsdt ?? "0,00"),
    artistShareUsdt: String(s?.artistShareUsdt ?? "0,00"),
    holdersShareUsdt: String(s?.holdersShareUsdt ?? "0,00"),
    completedDistributions: Number(s?.completedDistributions ?? 0),
    processingDistributions: Number(s?.processingDistributions ?? 0),
    failedDistributions: Number(s?.failedDistributions ?? s?.failedCount ?? 0),
    payoutHoldersCount: Number(s?.payoutHoldersCount ?? 0),
    avgPayoutPerHolderUsdt: s?.avgPayoutPerHolderUsdt != null ? String(s.avgPayoutPerHolderUsdt) : null,
    maxPayoutUsdt: s?.maxPayoutUsdt != null ? String(s.maxPayoutUsdt) : null,
    pendingPayouts: Number(s?.pendingPayouts ?? 0),
    ledgerMismatchCount: Number(s?.ledgerMismatchCount ?? 0),
    deltas: (s?.deltas ?? {}) as { grossPct?: number | null; distributedPct?: number | null; eventsPct?: number | null },
  };
}

const DRILL_LINK_KEYS = [
  { href: ROUTES.adminRevenue, section: "revenue" },
  { href: ROUTES.adminReports, section: "reports" },
  { href: ROUTES.adminWallets, section: "wallets" },
  { href: ROUTES.adminHoldings, section: "holdings" },
  { href: ROUTES.adminPlatformRevenue, section: "platformRevenue" },
] as const;

export function AnalyticsRevenueSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { user } = useAuth();
  const analyst = isBusinessAnalyst(user?.roles);
  const contentOnly =
    (user?.roles?.includes("CONTENT_MANAGER") ?? false) &&
    !(user?.roles?.some((r) => ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "BUSINESS_ANALYST"].includes(r)) ?? false);

  const drillLinks = React.useMemo(
    () => DRILL_LINK_KEYS.map((item) => ({ href: item.href, label: a.adminSectionLabel(item.section) })),
    [a],
  );
  const { period, setPeriod, query, customFrom, customTo, setCustomDates } = useAnalyticsPeriod("30d");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getRevenueAnalyticsSummary>> | null>(null);
  const [events, setEvents] = React.useState<Awaited<ReturnType<typeof getRevenueAnalyticsEvents>> | null>(null);
  const [distributions, setDistributions] = React.useState<Awaited<ReturnType<typeof getRevenueAnalyticsDistributions>> | null>(null);
  const [byTrack, setByTrack] = React.useState<Awaited<ReturnType<typeof getRevenueAnalyticsByTrack>> | null>(null);
  const [payouts, setPayouts] = React.useState<Awaited<ReturnType<typeof getRevenueAnalyticsPayouts>> | null>(null);
  const [pipeline, setPipeline] = React.useState<Awaited<ReturnType<typeof getRevenueAnalyticsPipeline>> | null>(null);
  const [split, setSplit] = React.useState<Awaited<ReturnType<typeof getRevenueAnalyticsSplit>> | null>(null);
  const [topHolders, setTopHolders] = React.useState<Awaited<ReturnType<typeof getRevenueAnalyticsTopHolders>> | null>(null);
  const [failed, setFailed] = React.useState<Awaited<ReturnType<typeof getRevenueAnalyticsFailed>> | null>(null);
  const [reconciliation, setReconciliation] = React.useState<
    Awaited<ReturnType<typeof getRevenueAnalyticsReconciliation>> | null
  >(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      getRevenueAnalyticsSummary(query, client),
      getRevenueAnalyticsEvents(query, client),
      getRevenueAnalyticsDistributions(query, client),
      getRevenueAnalyticsByTrack(query, client),
      getRevenueAnalyticsPayouts(query, client),
      getRevenueAnalyticsPipeline(query, client),
      getRevenueAnalyticsSplit(query, client),
      getRevenueAnalyticsTopHolders(query, client),
      getRevenueAnalyticsFailed(query, client),
      getRevenueAnalyticsReconciliation(query, client),
    ])
      .then(([s, e, d, t, p, pipe, sp, h, f, rec]) => {
        setSummary(s);
        setEvents(e);
        setDistributions(d);
        setByTrack(t);
        setPayouts(p);
        setPipeline(pipe);
        setSplit(sp);
        setTopHolders(h);
        setFailed(f);
        setReconciliation(rec);
        setLastUpdated(new Date().toISOString());
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [client, query]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading && !summary) {
    return <AdminAnalyticsPageLoading label={a.t("admin.analytics.revenue.loading")} />;
  }

  if (error) {
    return <AdminAnalyticsPageError onRetry={load} />;
  }

  const s = pickRevenueSummary(summary as Record<string, unknown> | null);
  const hasActivity = s.revenueEventsCount > 0 || parseAnalyticsMoney(s.distributedUsdt) > 0;
  const issues: string[] = [];
  if (s.eventsWithoutDistribution > 0) issues.push("Есть события дохода без распределения.");
  if (s.failedDistributions > 0) issues.push("Есть ошибочные распределения, требуется повтор.");
  if (s.ledgerMismatchCount > 0) issues.push("Есть расхождение с журналом проводок кошелька.");

  const health = buildRevenueHealthSummary({
    hasActivity,
    eventsCount: s.revenueEventsCount,
    grossUsdt: s.grossRevenueUsdt,
    distributedUsdt: s.distributedUsdt,
    platformUsdt: s.platformShareUsdt,
    failedCount: s.failedDistributions,
    issues,
  });

  const insights = buildRevenueInsights({
    eventsWithoutDistribution: s.eventsWithoutDistribution,
    failedCount: s.failedDistributions,
    ledgerMismatch: s.ledgerMismatchCount,
    noActivity: !hasActivity,
  });

  const payoutPoints = (payouts?.items ?? []).map((i) => ({
    period: i.period,
    value: parseAnalyticsMoney(i.amountUsdt),
  }));

  const splitDonut = split
    ? [
        { label: "Держатели", value: split.holdersPct ?? 70, color: "#059669" },
        { label: "Артист", value: split.artistPct ?? 15, color: "#7c3aed" },
        { label: "Платформа", value: split.platformPct ?? 15, color: "#2563eb" },
      ]
    : [];

  const releaseCols: AdminColumn<{
    trackId: string;
    trackTitle: string;
    artistName: string;
    grossRevenueUsdt: string;
    holdersPayoutUsdt: string;
    failedItems: number;
    status: string;
  }>[] = [
    {
      key: "release",
      header: "Релиз",
      render: (r) => (
        <Link href={`${ROUTES.adminRevenue}?releaseId=${r.trackId}`} className="font-medium hover:underline">
          {r.trackTitle}
        </Link>
      ),
    },
    { key: "artist", header: "Артист", render: (r) => r.artistName },
    { key: "gross", header: a.t("admin.table.gross"), render: (r) => formatUsdtAmount(r.grossRevenueUsdt) },
    { key: "holders", header: "Держателям", render: (r) => formatUsdtAmount(r.holdersPayoutUsdt) },
    {
      key: "failed",
      header: a.t("admin.table.failed"),
      render: (r) =>
        r.failedItems > 0 ? (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-800">{r.failedItems}</span>
        ) : (
          "—"
        ),
    },
    { key: "status", header: "Статус", render: (r) => r.status },
  ];

  const holderCols: AdminColumn<{
    userId: string;
    email: string;
    totalPayoutUsdt: string;
    payoutCount: number;
  }>[] = [
    {
      key: "user",
      header: "Пользователь",
      render: (r) =>
        contentOnly ? (
          <span className="font-mono text-xs">{r.userId.slice(0, 8)}…</span>
        ) : (
          <Link href={`${ROUTES.adminUsers}/${r.userId}`} className="hover:underline">
            {r.email}
          </Link>
        ),
    },
    { key: "total", header: "Начислено", render: (r) => formatUsdtAmount(r.totalPayoutUsdt) },
    { key: "count", header: "Выплат", render: (r) => String(r.payoutCount) },
  ];

  const failedCols: AdminColumn<{
    payoutId: string;
    releaseTitle: string;
    amountUsdt: string;
    lastAttemptAt: string;
    retryAvailable: boolean;
  }>[] = [
    {
      key: "release",
      header: "Релиз",
      render: (r) => r.releaseTitle,
    },
    { key: "amount", header: "Сумма", render: (r) => formatUsdtAmount(r.amountUsdt) },
    { key: "date", header: "Попытка", render: (r) => formatAdminDateShort(r.lastAttemptAt) },
    {
      key: "action",
      header: "",
      render: (r) =>
        !analyst && r.retryAvailable ? (
          <Link href={ROUTES.adminRevenue} className="text-xs text-blue-600 hover:underline">
            {a.t("admin.common.retry")}
          </Link>
        ) : (
          <span className="text-zinc-400">—</span>
        ),
    },
  ];

  const healthBannerClass = adminAnalyticsHealthBannerSurface(health.tone);

  return (
    <AdminPageShell>
      {analyst ? <AdminReadOnlyBanner area="analytics" className="mb-2" /> : null}
      <AdminPageHeader
        title={a.t("admin.analytics.revenue.title")}
        description={a.t("admin.analytics.revenue.description")}
        breadcrumbs={a.adminSectionBreadcrumbs("analyticsRevenue")}
        actions={
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <AdminPeriodSelector value={period} onChange={setPeriod} customFrom={customFrom} customTo={customTo} onCustomDatesChange={setCustomDates} />
              <AdminSectionRefreshButton onClick={load} loading={loading} />
              <AdminAnalyticsExportButton
                reportType="revenue_distributions"
                label={a.t("admin.analytics.common.generateReport")}
                period={period}
                customFrom={customFrom}
                customTo={customTo}
              />
            </div>
            {lastUpdated ? (
              <p className="text-xs text-zinc-500">
                {a.t("admin.analytics.common.updatedAt")} {formatAdminDateShort(lastUpdated)}
              </p>
            ) : null}
          </div>
        }
      />

      <AdminAnalyticsLayout activeSection="analyticsRevenue">
        <div className={cn(ADMIN_SECTION_TILE, healthBannerClass)}>
          <h2 className={cn("text-sm font-semibold", adminAnalyticsHealthBannerTitleClass(health.tone))}>
            {health.title}
          </h2>
          <p className={cn("mt-2 text-sm leading-relaxed", adminAnalyticsHealthBannerBodyClass(health.tone))}>
            {health.body}
          </p>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.revenue.kpi.events")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.revenue.section.events")}
                value={String(s.revenueEventsCount)}
                deltaPct={s.deltas.eventsPct}
                tooltip={REVENUE_KPI_TOOLTIPS.events}
                href={ROUTES.adminRevenue}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.revenue.kpi.grossRevenue")}
                value={formatUsdtAmount(s.grossRevenueUsdt)}
                deltaPct={s.deltas.grossPct}
                tooltip={REVENUE_KPI_TOOLTIPS.gross}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.avgEvent")}
                value={formatAdminMetricUsdt(s.avgRevenueEventUsdt)}
                tooltip={REVENUE_KPI_TOOLTIPS.avgEvent}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.withoutDistribution")}
                value={String(s.eventsWithoutDistribution)}
                tooltip={REVENUE_KPI_TOOLTIPS.noDist}
                href={ROUTES.adminRevenue}
                activeTone={s.eventsWithoutDistribution > 0 ? "warning" : "neutral"}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.toHolders")}
                value={formatUsdtAmount(s.distributedUsdt)}
                deltaPct={s.deltas.distributedPct}
                tooltip={REVENUE_KPI_TOOLTIPS.distributed}
                href={ROUTES.adminHoldings}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.platformShare")}
                value={formatUsdtAmount(s.platformShareUsdt)}
                tooltip={REVENUE_KPI_TOOLTIPS.platform}
                href={ROUTES.adminPlatformRevenue}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.artistShare")}
                value={formatUsdtAmount(s.artistShareUsdt)}
                tooltip={REVENUE_KPI_TOOLTIPS.artist}
              />
              <AdminMetricTrendCard
                label={a.t("admin.table.failed")}
                value={String(s.failedDistributions)}
                tooltip={REVENUE_KPI_TOOLTIPS.failed}
                href={ROUTES.adminRevenue}
                activeTone={s.failedDistributions > 0 ? "danger" : "neutral"}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.recipients")}
                value={String(s.payoutHoldersCount)}
                tooltip={REVENUE_KPI_TOOLTIPS.holdersCount}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.avgPayout")}
                value={formatAdminMetricUsdt(s.avgPayoutPerHolderUsdt)}
                tooltip={REVENUE_KPI_TOOLTIPS.holdersCount}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.maxPayout")}
                value={formatAdminMetricUsdt(s.maxPayoutUsdt)}
              />
              <AdminMetricTrendCard label={a.t("admin.analytics.revenue.kpi.pending")} value={String(s.pendingPayouts)} tooltip={REVENUE_KPI_TOOLTIPS.pending} />
            </AdminAnalyticsKpiGroup>

            {!contentOnly ? (
              <AdminAnalyticsKpiGroup title={a.t("admin.analytics.revenue.kpi.quality")}>
                <AdminMetricTrendCard
                  label={a.t("admin.analytics.revenue.kpi.ledgerMismatch")}
                  value={String(s.ledgerMismatchCount)}
                  tooltip={REVENUE_KPI_TOOLTIPS.ledgerMismatch}
                  href={ROUTES.adminWallets}
                  activeTone={s.ledgerMismatchCount > 0 ? "danger" : "neutral"}
                />
                <AdminMetricTrendCard label={a.t("admin.kpi.completed")} value={String(s.completedDistributions)} />
                <AdminMetricTrendCard label={a.t("admin.kpi.processing")} value={String(s.processingDistributions)} />
              </AdminAnalyticsKpiGroup>
            ) : null}
          </div>

          <AdminAnalyticsInsightsPanel items={insights} className="xl:sticky xl:top-4 xl:self-start" />
        </div>

        <section className={cn(ADMIN_SECTION_TILE, "mt-6 p-5")}>
          <h2 className="text-base font-semibold text-zinc-100">{a.t("admin.analytics.revenue.pipelineTitle")}</h2>
          <p className="mt-1 text-sm text-zinc-500">От revenue event до wallet ledger и completed.</p>
          <div className="mt-4">
            {!pipeline?.stages?.some((st) => st.count > 0) ? (
              <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm">
                <p className="font-medium text-zinc-200">{REVENUE_CHART_EMPTY.pipeline.title}</p>
                <p className="mt-1 text-zinc-500">{REVENUE_CHART_EMPTY.pipeline.description}</p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(pipeline?.stages ?? []).map((st) => (
                  <Link
                    key={st.key}
                    href={ROUTES.adminRevenue}
                    className={cn(ADMIN_ANALYTICS_INLINE_STAT, "transition-colors hover:bg-zinc-900/70")}
                  >
                    <p className="text-xs text-zinc-500">{st.label}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{st.count}</p>
                    {st.amountUsdt ? (
                      <p className="text-xs text-zinc-400">{formatUsdtAmount(st.amountUsdt)} USDT</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <AdminChartCard
            title={a.t("admin.analytics.revenue.section.events")}
            empty={!events?.items?.length}
            emptyTitle={REVENUE_CHART_EMPTY.events.title}
            emptyDescription={REVENUE_CHART_EMPTY.events.description}
            drilldownHref={ROUTES.adminRevenue}
          >
            <AdminLineChart
              points={(events?.items ?? []).map((i) => ({
                period: i.period,
                value: parseAnalyticsMoney(i.amountUsdt ?? "0"),
              }))}
            />
          </AdminChartCard>

          <AdminChartCard
            title={a.t("admin.analytics.revenue.distributionsByStatus")}
            empty={!(distributions?.byStatus ?? distributions?.items)?.length}
            emptyTitle={REVENUE_CHART_EMPTY.distributions.title}
            emptyDescription={REVENUE_CHART_EMPTY.distributions.description}
          >
            <AdminBarChart
              items={(distributions?.byStatus ?? distributions?.items ?? []).map((i) => ({
                label: i.status,
                value: i.count,
              }))}
            />
          </AdminChartCard>
        </div>

        <section className={cn(ADMIN_SECTION_TILE, "mt-6 p-5")}>
          <h2 className="text-base font-semibold text-zinc-100">Распределение долей</h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {splitDonut.length > 0 ? (
              <AdminDonutChart
                items={splitDonut.map((d) => ({
                  label: d.label,
                  value: d.value,
                  color: d.color,
                }))}
              />
            ) : null}
            <div className="space-y-3 text-sm">
              <div className={cn(ADMIN_ANALYTICS_INLINE_STAT, "flex justify-between")}>
                <span className="text-zinc-400">Держатели ({split?.holdersPct ?? 70}%)</span>
                <span className="font-medium text-emerald-400">{formatUsdtAmount(split?.holdersShareUsdt ?? "0,00")}</span>
              </div>
              <div className={cn(ADMIN_ANALYTICS_INLINE_STAT, "flex justify-between")}>
                <span className="text-zinc-400">Артист ({split?.artistPct ?? 15}%)</span>
                <span className="font-medium text-violet-300">{formatUsdtAmount(split?.artistShareUsdt ?? "0,00")}</span>
              </div>
              <div className={cn(ADMIN_ANALYTICS_INLINE_STAT, "flex justify-between")}>
                <span className="text-zinc-400">Платформа ({split?.platformPct ?? 15}%)</span>
                <span className="font-medium text-blue-300">{formatUsdtAmount(split?.platformShareUsdt ?? "0,00")}</span>
              </div>
              <p className="text-xs text-zinc-500">
                Доли считаются из earning reports (70/15/15). Не включают покупку юнитов на первичном рынке.
              </p>
            </div>
          </div>
        </section>

        <section className={cn(ADMIN_SECTION_TILE, "mt-6 p-5")}>
          <h2 className="text-base font-semibold text-zinc-100">Начисления по релизам</h2>
          <AdminDataTable
            columns={releaseCols}
            rows={byTrack?.items ?? []}
            rowKey={(r) => r.trackId}
            emptyMessage={REVENUE_CHART_EMPTY.byRelease.description}
          />
        </section>

        <AdminChartCard
          title={a.t("admin.analytics.revenue.payoutsOverTime")}
          className="mt-6"
          empty={!payoutPoints.length}
          emptyTitle={REVENUE_CHART_EMPTY.overTime.title}
          emptyDescription={REVENUE_CHART_EMPTY.overTime.description}
          drilldownHref={ROUTES.adminWallets}
        >
          <AdminMultiLineChart
            series={[
              { key: "holders", label: "Держателям", color: "#059669", points: payoutPoints },
            ]}
          />
        </AdminChartCard>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <AdminChartCard title="Топ получателей начислений" empty={!topHolders?.items?.length} drilldownHref={ROUTES.adminHoldings}>
            <AdminDataTable columns={holderCols} rows={topHolders?.items ?? []} rowKey={(r) => r.userId} />
          </AdminChartCard>

          <section className={cn(ADMIN_SECTION_TILE, "p-5")}>
            <h2 className="text-base font-semibold text-zinc-100">Ошибки начислений и retry</h2>
            <div className="mt-4">
              {(failed?.items ?? []).length === 0 ? (
                <p className="text-sm text-zinc-500">{REVENUE_CHART_EMPTY.failed.description}</p>
              ) : (
                <AdminDataTable columns={failedCols} rows={failed?.items ?? []} rowKey={(r) => r.payoutId} />
              )}
            </div>
          </section>
        </div>

        <section className={cn(ADMIN_SECTION_TILE, "mt-6 p-5")}>
          <h2 className="text-base font-semibold text-zinc-100">Сверка с wallet ledger</h2>
          {!reconciliation ? (
            <p className="mt-2 text-sm text-zinc-500">{REVENUE_CHART_EMPTY.reconciliation.description}</p>
          ) : (
            <div className="mt-4 flex flex-wrap items-start gap-4">
              <div
                className={cn(
                  ADMIN_SECTION_NOTICE,
                  "text-sm",
                  reconciliation.matched ? "text-emerald-300" : "text-amber-300",
                )}
              >
                {reconciliation.matched ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <AlertTriangle className="size-5" />
                )}
                <span>{reconciliation.matched ? "Сверка совпала" : "Есть расхождение"}</span>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className={ADMIN_ANALYTICS_INLINE_STAT}>
                  <p className="text-xs text-zinc-500">Payout items</p>
                  <p className="font-semibold">{reconciliation.payoutItemsCount}</p>
                  <p className="text-xs">{formatUsdtAmount(reconciliation.payoutSumUsdt)}</p>
                </div>
                <div className={ADMIN_ANALYTICS_INLINE_STAT}>
                  <p className="text-xs text-zinc-500">Ledger PAYOUT tx</p>
                  <p className="font-semibold">{reconciliation.ledgerTxCount}</p>
                  <p className="text-xs">{formatUsdtAmount(reconciliation.ledgerSumUsdt)}</p>
                </div>
                <div className={ADMIN_ANALYTICS_INLINE_STAT}>
                  <p className="text-xs text-zinc-500">Без wallet tx</p>
                  <p className="font-semibold">{reconciliation.missingWalletTxCount}</p>
                </div>
                <div className={ADMIN_ANALYTICS_INLINE_STAT}>
                  <p className="text-xs text-zinc-500">Проверено</p>
                  <p className="text-xs">{formatAdminDateShort(reconciliation.lastCheckedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className={cn(ADMIN_SECTION_TILE, "mt-6 p-5")}>
          <h2 className="text-sm font-semibold text-zinc-100">Drill-down</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {drillLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={ADMIN_ANALYTICS_DRILL_LINK}
              >
                {link.label}
                <ArrowRight className="size-4 text-zinc-400" />
              </Link>
            ))}
          </div>
        </section>
      </AdminAnalyticsLayout>
    </AdminPageShell>
  );
}
