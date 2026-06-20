"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { AdminSectionRefreshButton } from "@/features/admin/components/admin-section-layout";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { AdminStyledSelect } from "@/features/admin/ui/admin-styled-select";
import { ROUTES } from "@/constants/routes";
import { AdminAnalyticsExportButton } from "@/features/admin/analytics/components/admin-analytics-export-button";
import { AdminAnalyticsInsightsPanel } from "@/features/admin/analytics/components/admin-analytics-insights-panel";
import { AdminAnalyticsKpiGroup } from "@/features/admin/analytics/components/admin-analytics-kpi-group";
import { ANALYTICS_MARKET_TABS } from "@/features/admin/analytics/config/analytics-page-tabs";
import { AdminAnalyticsPageShell, AdminAnalyticsPageError, AdminAnalyticsPageLoading } from "@/features/admin/analytics/ui/admin-analytics-page-shell";
import { AdminAnalyticsTabPanel } from "@/features/admin/analytics/ui/admin-analytics-tab-panel";
import { AdminChartCard } from "@/features/admin/analytics/components/admin-chart-card";
import { AdminBarChart, AdminLineChart, AdminMultiLineChart } from "@/features/admin/analytics/components/admin-charts.lazy";
import { AdminMetricTrendCard } from "@/features/admin/analytics/components/admin-metric-trend-card";
import { AdminPeriodSelector } from "@/features/admin/analytics/components/admin-period-selector";
import { parseAnalyticsMoney, useAnalyticsPeriod } from "@/features/admin/analytics/hooks/use-analytics-period";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDateShort, formatAdminMetricUsdt, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ADMIN_ANALYTICS_ATTENTION_ITEM, ADMIN_ANALYTICS_DRILL_LINK, ADMIN_ANALYTICS_INLINE_STAT, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import {
  buildMarketHealthSummary,
  buildMarketInsights,
  MARKET_CHART_EMPTY,
  MARKET_KPI_TOOLTIPS,
  marketFilterHref,
} from "@/features/admin/lib/admin-market-analytics-i18n";
import {
  getMarketAnalyticsDepth,
  getMarketAnalyticsFees,
  getMarketAnalyticsLiquidity,
  getMarketAnalyticsListings,
  getMarketAnalyticsPrices,
  getMarketAnalyticsRisk,
  getMarketAnalyticsSummary,
  getMarketAnalyticsTopUsers,
  getMarketAnalyticsTrades,
  getMarketAnalyticsVolume,
} from "@/services/admin/adminMarketAnalytics.service";
import {
  AdminDataTable,
  type AdminColumn,
} from "@/features/admin/ui";
import { cn } from "@/lib/utils";
import {
  adminAnalyticsHealthBannerBodyClass,
  adminAnalyticsHealthBannerSurface,
  adminAnalyticsHealthBannerTitleClass,
} from "@/features/admin/analytics/lib/admin-analytics-theme";

function pickMarketSummary(s: Record<string, unknown> | null) {
  return {
    activeListings: Number(s?.activeListings ?? 0),
    unitsListed: Number(s?.unitsListed ?? 0),
    listingsValueUsdt: String(s?.listingsValueUsdt ?? "0,00"),
    avgListingAgeDays: Number(s?.avgListingAgeDays ?? 0),
    staleListings: Number(s?.staleListings ?? 0),
    frozenListings: Number(s?.frozenListings ?? 0),
    completedTrades: Number(s?.completedTrades ?? s?.tradesCompleted ?? 0),
    volumeUsdt: String(s?.volumeUsdt ?? "0,00"),
    avgTradeSizeUsdt: String(s?.avgTradeSizeUsdt ?? "0,00"),
    avgPricePerUnitUsdt: s?.avgPricePerUnitUsdt != null ? String(s.avgPricePerUnitUsdt) : null,
    uniqueSellers: Number(s?.uniqueSellers ?? 0),
    uniqueBuyers: Number(s?.uniqueBuyers ?? 0),
    secondaryFeesUsdt: String(s?.secondaryFeesUsdt ?? s?.feesUsdt ?? "0,00"),
    avgFeePerTradeUsdt: s?.avgFeePerTradeUsdt != null ? String(s.avgFeePerTradeUsdt) : null,
    suspiciousTrades: Number(s?.suspiciousTrades ?? 0),
    deltas: (s?.deltas ?? {}) as { volumePct?: number | null; tradesPct?: number | null; feesPct?: number | null },
  };
}

function formatUnits(n: number): string {
  return `${n.toLocaleString("ru-RU")} юнитов`;
}

const DRILL_LINK_HREFS = [
  ROUTES.adminSecondaryMarket,
  ROUTES.adminCompliance,
  ROUTES.adminHoldings,
  ROUTES.adminPlatformRevenue,
  ROUTES.adminAnalyticsTracks,
] as const;

export function AnalyticsMarketSection() {
  const a = useAdminI18n();
  const drillLinks = React.useMemo(
    () => [
      { href: DRILL_LINK_HREFS[0], label: a.adminSectionLabel("secondaryMarket") },
      { href: DRILL_LINK_HREFS[1], label: a.t("admin.analytics.risk.link.compliance") },
      { href: DRILL_LINK_HREFS[2], label: a.adminSectionLabel("holdings") },
      { href: DRILL_LINK_HREFS[3], label: a.adminSectionLabel("platformRevenue") },
      { href: DRILL_LINK_HREFS[4], label: a.t("admin.analytics.overview.detailAnalytics") },
    ],
    [a],
  );
  const client = useAdminApi();
  const complianceFocus = false;

  const { period, setPeriod, query: baseQuery, customFrom, customTo, setCustomDates } = useAnalyticsPeriod("30d");
  const [releaseId, setReleaseId] = React.useState<string>("");
  const query = React.useMemo(
    () => ({ ...baseQuery, trackId: releaseId || undefined }),
    [baseQuery, releaseId],
  );

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getMarketAnalyticsSummary>> | null>(null);
  const [volume, setVolume] = React.useState<Awaited<ReturnType<typeof getMarketAnalyticsVolume>> | null>(null);
  const [listings, setListings] = React.useState<Awaited<ReturnType<typeof getMarketAnalyticsListings>> | null>(null);
  const [trades, setTrades] = React.useState<Awaited<ReturnType<typeof getMarketAnalyticsTrades>> | null>(null);
  const [topUsers, setTopUsers] = React.useState<Awaited<ReturnType<typeof getMarketAnalyticsTopUsers>> | null>(null);
  const [fees, setFees] = React.useState<Awaited<ReturnType<typeof getMarketAnalyticsFees>> | null>(null);
  const [depth, setDepth] = React.useState<Awaited<ReturnType<typeof getMarketAnalyticsDepth>> | null>(null);
  const [liquidity, setLiquidity] = React.useState<Awaited<ReturnType<typeof getMarketAnalyticsLiquidity>> | null>(null);
  const [prices, setPrices] = React.useState<Awaited<ReturnType<typeof getMarketAnalyticsPrices>> | null>(null);
  const [risk, setRisk] = React.useState<Awaited<ReturnType<typeof getMarketAnalyticsRisk>> | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      getMarketAnalyticsSummary(query, client),
      getMarketAnalyticsVolume(query, client),
      getMarketAnalyticsListings(query, client),
      getMarketAnalyticsTrades(query, client),
      getMarketAnalyticsTopUsers(query, client),
      getMarketAnalyticsFees(query, client),
      getMarketAnalyticsDepth(query, client),
      getMarketAnalyticsLiquidity(query, client),
      getMarketAnalyticsPrices(query, client),
      getMarketAnalyticsRisk(query, client),
    ])
      .then(([s, v, l, t, u, f, d, liq, p, r]) => {
        setSummary(s);
        setVolume(v);
        setListings(l);
        setTrades(t);
        setTopUsers(u);
        setFees(f);
        setDepth(d);
        setLiquidity(liq);
        setPrices(p);
        setRisk(r);
        setLastUpdated(new Date().toISOString());
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [client, query]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading && !summary) {
    return <AdminAnalyticsPageLoading label={a.t("admin.analytics.market.loading")} />;
  }

  if (error) {
    return <AdminAnalyticsPageError onRetry={load} />;
  }

  const s = pickMarketSummary(summary as Record<string, unknown> | null);
  const volumePoints = (volume?.items ?? []).map((i) => ({
    period: i.period,
    value: parseAnalyticsMoney(i.volumeUsdt),
  }));
  const tradeCountPoints = (volume?.items ?? []).map((i) => ({
    period: i.period,
    value: i.tradesCount,
  }));
  const hasActivity = s.completedTrades > 0 || s.activeListings > 0;
  const topRelease = liquidity?.items?.[0]?.releaseTitle;
  const issues: string[] = [];
  if (s.staleListings > 0) issues.push("Есть листинги старше 7 дней.");
  if (s.suspiciousTrades > 0) issues.push("Есть подозрительные сделки.");
  if (s.frozenListings > 0) issues.push("Есть замороженные листинги.");

  const health = buildMarketHealthSummary({
    hasActivity,
    completedTrades: s.completedTrades,
    volumeUsdt: s.volumeUsdt,
    topRelease,
    avgPrice: s.avgPricePerUnitUsdt,
    activeListings: s.activeListings,
    issues,
  });

  const insights = buildMarketInsights({
    staleListings: s.staleListings,
    suspiciousTrades: s.suspiciousTrades,
    frozenListings: s.frozenListings,
    noActivity: !hasActivity,
    outlierCount: prices?.outliers?.length ?? 0,
  });

  const completedTotal = (trades?.completed ?? []).reduce((acc, i) => acc + i.count, 0);
  const suspiciousTotal = (trades?.suspicious ?? []).reduce((acc, i) => acc + i.count, 0);

  const liquidityCols: AdminColumn<{
    releaseId: string;
    releaseTitle: string;
    artistName: string;
    activeListings: number;
    unitsListed: string;
    completedTrades: number;
    tradeVolumeUsdt: string;
    avgPriceUsdt: string;
    suspiciousCount: number;
    liquidityScore: number;
  }>[] = [
    {
      key: "release",
      header: "Релиз",
      render: (r) => (
        <button
          type="button"
          className="font-medium text-zinc-100 hover:underline text-left"
          onClick={() => setReleaseId(r.releaseId)}
        >
          {r.releaseTitle}
        </button>
      ),
    },
    { key: "artist", header: "Артист", render: (r) => r.artistName },
    { key: "listings", header: "Листинги", render: (r) => String(r.activeListings) },
    { key: "trades", header: "Сделки", render: (r) => String(r.completedTrades) },
    { key: "volume", header: "Объём", render: (r) => formatUsdtAmount(r.tradeVolumeUsdt) },
    {
      key: "score",
      header: "Ликвидность",
      render: (r) => <span className="tabular-nums font-medium">{r.liquidityScore}</span>,
    },
  ];

  const sellerCols: AdminColumn<{
    userId: string;
    email: string;
    tradesCount: number;
    listingsCount: number;
    volumeUsdt: string;
    riskStatus: string;
  }>[] = [
    {
      key: "user",
      header: "Продавец",
      render: (r) => (
        <Link href={`${ROUTES.adminUsers}/${r.userId}`} className="hover:underline">
          {r.email}
        </Link>
      ),
    },
    { key: "listings", header: "Листинги", render: (r) => String(r.listingsCount) },
    { key: "trades", header: "Продажи", render: (r) => String(r.tradesCount) },
    { key: "volume", header: "Объём", render: (r) => formatUsdtAmount(r.volumeUsdt) },
  ];

  const riskTradeCols: AdminColumn<{
    tradeId: string;
    releaseTitle: string;
    sellerEmail: string;
    buyerEmail: string;
    grossAmountUsdt: string;
    updatedAt: string;
  }>[] = [
    {
      key: "trade",
      header: "Сделка",
      render: (r) => (
        <Link href={`${ROUTES.adminSecondaryMarket}?tradeId=${r.tradeId}`} className="font-mono text-xs hover:underline">
          {r.tradeId.slice(0, 8)}…
        </Link>
      ),
    },
    { key: "release", header: "Релиз", render: (r) => r.releaseTitle },
    { key: "amount", header: "Сумма", render: (r) => formatUsdtAmount(r.grossAmountUsdt) },
    {
      key: "updated",
      header: "Дата",
      render: (r) => formatAdminDateShort(r.updatedAt),
    },
    {
      key: "action",
      header: "",
      render: (r) => (
        <Link href={ROUTES.adminCompliance} className="text-xs text-blue-600 hover:underline">
          {a.t("admin.analytics.risk.link.compliance")}
        </Link>
      ),
    },
  ];

  const healthBannerClass = adminAnalyticsHealthBannerSurface(health.tone);

  type ReleaseOption = { releaseId: string; releaseTitle: string; listingsCount?: number };
  const topReleases = (depth?.topReleases ?? []) as ReleaseOption[];
  const releaseOptions = [
    ...topReleases,
    ...(liquidity?.items ?? []).map((i) => ({
      releaseId: i.releaseId,
      releaseTitle: i.releaseTitle,
    })),
  ].filter((v, idx, arr) => arr.findIndex((x) => x.releaseId === v.releaseId) === idx);

  const releaseFilter =
    releaseOptions.length > 0 ? (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-500">Релиз для стакана:</span>
        <AdminStyledSelect
          size="sm"
          value={releaseId}
          options={[
            { value: "", label: "Все / топ релизы" },
            ...releaseOptions.map((r) => ({ value: r.releaseId, label: r.releaseTitle })),
          ]}
          onChange={setReleaseId}
        />
      </div>
    ) : null;

  return (
    <AdminAnalyticsPageShell
      activeSection="analyticsMarket"
      title={a.t("admin.analytics.market.title")}
      description={a.t("admin.analytics.market.description")}
      breadcrumbs={a.adminSectionBreadcrumbs("analyticsMarket")}
      pageTabs={ANALYTICS_MARKET_TABS}
      filters={releaseFilter}
      actions={
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <AdminPeriodSelector value={period} onChange={setPeriod} customFrom={customFrom} customTo={customTo} onCustomDatesChange={setCustomDates} />
            <AdminSectionRefreshButton onClick={load} loading={loading} />
            <AdminAnalyticsExportButton
              reportType="market_volume"
              label={a.t("admin.analytics.common.report")}
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
    >
      {(tab) => (
        <>
          <AdminAnalyticsTabPanel activeTab={tab} tabId="overview">
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
            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.market.liquidity")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.tracks.kpi.activeListings")}
                value={String(s.activeListings)}
                tooltip={MARKET_KPI_TOOLTIPS.activeListings}
                href={marketFilterHref({ marketFilter: "active" })}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.unitsForSale")}
                value={formatUnits(s.unitsListed)}
                tooltip={MARKET_KPI_TOOLTIPS.unitsListed}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.listingsValue")}
                value={formatUsdtAmount(s.listingsValueUsdt)}
                tooltip={MARKET_KPI_TOOLTIPS.listingsValue}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.staleListings7d")}
                value={String(s.staleListings)}
                tooltip={MARKET_KPI_TOOLTIPS.staleListings}
                href={marketFilterHref({ tab: "listings" })}
                activeTone={s.staleListings > 0 ? "warning" : "neutral"}
              />
            </AdminAnalyticsKpiGroup>

            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.market.trades")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.completedTrades")}
                value={String(s.completedTrades)}
                deltaPct={s.deltas.tradesPct}
                tooltip={MARKET_KPI_TOOLTIPS.completedTrades}
                href={ROUTES.adminSecondaryMarket}
                activeTone={s.completedTrades > 0 ? "info" : "neutral"}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.tradeVolume")}
                value={formatUsdtAmount(s.volumeUsdt)}
                deltaPct={s.deltas.volumePct}
                tooltip={MARKET_KPI_TOOLTIPS.volume}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.avgTradeSize")}
                value={formatUsdtAmount(s.avgTradeSizeUsdt)}
                tooltip={MARKET_KPI_TOOLTIPS.avgTradeSize}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.avgPricePerUnit")}
                value={formatAdminMetricUsdt(s.avgPricePerUnitUsdt)}
                tooltip={MARKET_KPI_TOOLTIPS.avgPrice}
              />
              <AdminMetricTrendCard label={a.t("admin.analytics.metric.uniqueSellers")} value={String(s.uniqueSellers)} tooltip={MARKET_KPI_TOOLTIPS.uniqueSellers} />
              <AdminMetricTrendCard label={a.t("admin.analytics.metric.uniqueBuyers")} value={String(s.uniqueBuyers)} tooltip={MARKET_KPI_TOOLTIPS.uniqueBuyers} />
            </AdminAnalyticsKpiGroup>

            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.market.fees")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.secondaryFee")}
                value={formatUsdtAmount(s.secondaryFeesUsdt)}
                deltaPct={s.deltas.feesPct}
                tooltip={MARKET_KPI_TOOLTIPS.secondaryFees}
                href={ROUTES.adminPlatformRevenue}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.avgFee")}
                value={formatUsdtAmount(s.avgFeePerTradeUsdt ?? "0,00")}
                href={ROUTES.adminPlatformRevenue}
              />
            </AdminAnalyticsKpiGroup>

            <AdminAnalyticsKpiGroup title={a.t("admin.analytics.market.risk")}>
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.suspiciousTrades")}
                value={String(s.suspiciousTrades)}
                tooltip={MARKET_KPI_TOOLTIPS.suspicious}
                href={ROUTES.adminCompliance}
                activeTone={s.suspiciousTrades > 0 ? "danger" : "neutral"}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.frozenListings")}
                value={String(s.frozenListings)}
                tooltip={MARKET_KPI_TOOLTIPS.frozenListings}
                href={marketFilterHref({ marketFilter: "frozen" })}
                activeTone={s.frozenListings > 0 ? "warning" : "neutral"}
              />
              <AdminMetricTrendCard
                label={a.t("admin.analytics.metric.priceOutliers")}
                value={String(prices?.outliers?.length ?? 0)}
                href={ROUTES.adminAnalyticsMarket}
                activeTone={(prices?.outliers?.length ?? 0) > 0 ? "warning" : "neutral"}
              />
            </AdminAnalyticsKpiGroup>
          </div>

          <AdminAnalyticsInsightsPanel items={insights} className="xl:sticky xl:top-4 xl:self-start" />
        </div>
            <div className="mt-6">
              <AdminChartCard
                title={a.t("admin.analytics.market.volumeAndTrades")}
                description={a.t("admin.analytics.market.volumeAndTradesDesc")}
                empty={!volumePoints.length}
                emptyTitle={MARKET_CHART_EMPTY.volume.title}
                emptyDescription={MARKET_CHART_EMPTY.volume.description}
                drilldownHref={ROUTES.adminSecondaryMarket}
              >
                <AdminMultiLineChart
                  series={[
                    { key: "volume", label: "Объём USDT", color: "#2563eb", points: volumePoints },
                    { key: "trades", label: "Сделки", color: "#059669", points: tradeCountPoints },
                  ]}
                />
              </AdminChartCard>
            </div>
            <section className={cn(ADMIN_SECTION_TILE, "mt-6 p-5")}>
              <h2 className="text-sm font-semibold text-zinc-100">Переходы</h2>
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
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="orderbook">
        <section className={cn(ADMIN_SECTION_TILE, "p-5")}>
          <h2 className="text-base font-semibold text-zinc-100">Стакан листингов</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Агрегированный стакан активных листингов на продажу (не биржевой стакан ценных бумаг).
          </p>
          {depth?.hint ? <p className="mt-2 text-xs text-zinc-400">{depth.hint}</p> : null}
          <div className="mt-4">
            {!depth?.levels?.length && !depth?.topReleases?.length ? (
              <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm">
                <p className="font-medium text-zinc-200">{MARKET_CHART_EMPTY.depth.title}</p>
                <p className="mt-1 text-zinc-500">{MARKET_CHART_EMPTY.depth.description}</p>
              </div>
            ) : !depth?.levels?.length ? (
              <ul className="space-y-2">
                {topReleases.map((r) => (
                  <li key={r.releaseId}>
                    <button
                      type="button"
                      className="flex w-full justify-between rounded-lg border border-zinc-800 px-3 py-2 text-sm hover:bg-zinc-800/60"
                      onClick={() => setReleaseId(r.releaseId)}
                    >
                      <span>{r.releaseTitle}</span>
                      <span className="text-zinc-500">{r.listingsCount} листингов</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap gap-4 text-sm">
                  <span>
                    <strong>{depth.releaseTitle}</strong>
                    {depth.bestAskUsdt ? ` · лучший ask ${formatUsdtAmount(depth.bestAskUsdt)}` : null}
                    {depth.spreadPct != null ? ` · спред ${depth.spreadPct}%` : null}
                  </span>
                </div>
                <div className="space-y-2">
                  {(depth.levels ?? []).map((lvl) => {
                    const maxUnits = Math.max(...(depth.levels ?? []).map((l) => parseFloat(l.totalUnits)), 1);
                    const w = (parseFloat(lvl.totalUnits) / maxUnits) * 100;
                    return (
                      <div key={lvl.pricePerUnitUsdt} className="flex items-center gap-3 text-sm">
                        <span className="w-24 tabular-nums">{formatUsdtAmount(lvl.pricePerUnitUsdt)}</span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${w}%` }} />
                        </div>
                        <span className="w-28 text-right tabular-nums text-zinc-400">
                          {lvl.totalUnits} юн. · {lvl.listingsCount} лист.
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="trades">
        <div className="grid gap-4 xl:grid-cols-2">
          <AdminChartCard
            title={a.t("admin.analytics.market.completedVsSuspicious")}
            empty={completedTotal === 0 && suspiciousTotal === 0}
            emptyTitle={MARKET_CHART_EMPTY.tradesCompare.title}
            emptyDescription={MARKET_CHART_EMPTY.tradesCompare.description}
            drilldownHref={ROUTES.adminCompliance}
          >
            <AdminBarChart
              items={[
                { label: "Завершённые", value: completedTotal, color: "#059669" },
                { label: "Подозрительные", value: suspiciousTotal, color: "#e11d48" },
                { label: "Ошибки", value: trades?.failedCount ?? 0, color: "#71717a" },
              ]}
            />
          </AdminChartCard>

          <AdminChartCard
            title={a.t("admin.analytics.market.listingsByRelease")}
            empty={!listings?.byTrack?.length}
            emptyTitle={MARKET_CHART_EMPTY.listings.title}
            emptyDescription={MARKET_CHART_EMPTY.listings.description}
            drilldownHref={ROUTES.adminSecondaryMarket}
          >
            <AdminBarChart items={(listings?.byTrack ?? []).map((i) => ({ label: i.trackTitle.slice(0, 14), value: i.count }))} />
          </AdminChartCard>
        </div>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="prices">
        <section className={cn(ADMIN_SECTION_TILE, "p-5", complianceFocus && "ring-2 ring-amber-200/80")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Цены и спред</h2>
              <p className="mt-1 text-sm text-zinc-500">Средние цены листингов и сделок, выбросы относительно primary.</p>
            </div>
            <Link href={ROUTES.adminSecondaryMarket} className="text-sm text-blue-600 hover:underline">
              Рынок
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className={ADMIN_ANALYTICS_INLINE_STAT}>
              <p className="text-xs text-zinc-500">Ср. цена листинга</p>
              <p className="font-semibold">{formatAdminMetricUsdt(prices?.avgListingPriceUsdt)}</p>
            </div>
            <div className={ADMIN_ANALYTICS_INLINE_STAT}>
              <p className="text-xs text-zinc-500">Ср. цена сделки</p>
              <p className="font-semibold">{formatAdminMetricUsdt(prices?.avgTradePriceUsdt)}</p>
            </div>
            <div className={ADMIN_ANALYTICS_INLINE_STAT}>
              <p className="text-xs text-zinc-500">Min / max сделки</p>
              <p className="font-semibold text-xs">
                {formatAdminMetricUsdt(prices?.minTradePriceUsdt)} · {formatAdminMetricUsdt(prices?.maxTradePriceUsdt)}
              </p>
            </div>
          </div>
          {(prices?.outliers ?? []).length > 0 ? (
            <ul className="mt-4 space-y-2">
              {(prices?.outliers ?? []).map((o) => (
                <li key={o.releaseId} className={ADMIN_ANALYTICS_ATTENTION_ITEM}>
                  <span>
                    {o.releaseTitle} — {formatUsdtAmount(o.tradePriceUsdt)}
                    {o.premiumPct != null ? ` (+${o.premiumPct}% к primary)` : null}
                  </span>
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">выброс</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">{MARKET_CHART_EMPTY.prices.description}</p>
          )}
        </section>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="liquidity">
        <section className={cn(ADMIN_SECTION_TILE, "p-5")}>
          <h2 className="text-base font-semibold text-zinc-100">Ликвидность по релизам</h2>
          <AdminDataTable
            columns={liquidityCols}
            rows={liquidity?.items ?? []}
            rowKey={(r) => r.releaseId}
            emptyMessage={MARKET_CHART_EMPTY.listings.description}
          />
        </section>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="participants">
            <AdminChartCard
              title={a.t("admin.analytics.market.topSellers")}
              empty={!topUsers?.sellers?.length && !topUsers?.listingSellers?.length}
              emptyTitle={MARKET_CHART_EMPTY.sellers.title}
              emptyDescription={MARKET_CHART_EMPTY.sellers.description}
            >
              <AdminDataTable
                columns={sellerCols}
                rows={[...(topUsers?.sellers ?? []), ...(topUsers?.listingSellers ?? [])].slice(0, 8)}
                rowKey={(r) => r.userId}
              />
            </AdminChartCard>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="fees">
        <AdminChartCard title="Комиссии вторичного рынка" empty={!fees?.items?.length} emptyTitle={MARKET_CHART_EMPTY.fees.title} emptyDescription={MARKET_CHART_EMPTY.fees.description} drilldownHref={ROUTES.adminPlatformRevenue}>
          <AdminLineChart
            points={(fees?.items ?? []).map((i) => ({
              period: i.period,
              value: parseAnalyticsMoney(i.amountUsdt),
            }))}
          />
        </AdminChartCard>
          </AdminAnalyticsTabPanel>

          <AdminAnalyticsTabPanel activeTab={tab} tabId="risk">
        <section className={cn(ADMIN_SECTION_TILE, "p-5", complianceFocus && "border-amber-300")}>
          <h2 className="text-base font-semibold text-zinc-100">Подозрительная активность</h2>
          <div className="mt-4">
            {(risk?.suspiciousTrades ?? []).length === 0 && (risk?.frozenListings ?? []).length === 0 ? (
              <p className="text-sm text-zinc-500">{MARKET_CHART_EMPTY.risk.description}</p>
            ) : (
              <AdminDataTable columns={riskTradeCols} rows={risk?.suspiciousTrades ?? []} rowKey={(r) => r.tradeId} />
            )}
          </div>
        </section>
          </AdminAnalyticsTabPanel>
        </>
      )}
    </AdminAnalyticsPageShell>
  );
}
