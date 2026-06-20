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
import { AdminBarChart } from "@/features/admin/analytics/components/admin-charts.lazy";
import { AdminMetricTrendCard } from "@/features/admin/analytics/components/admin-metric-trend-card";
import { AdminPeriodSelector } from "@/features/admin/analytics/components/admin-period-selector";
import { parseAnalyticsMoney, useAnalyticsPeriod } from "@/features/admin/analytics/hooks/use-analytics-period";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDateShort, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { isBusinessAnalyst } from "@/features/admin/config/admin-rbac";
import {
  buildTrackHealthSummary,
  buildTrackInsights,
  MISSING_FIELD_LABELS,
  ROUND_WARNING_LABELS,
  TRACK_CHART_EMPTY,
  TRACK_KPI_TOOLTIPS,
  tracksFilterHref,
} from "@/features/admin/lib/admin-track-analytics-i18n";
import {
  getTrackAnalyticsHolders,
  getTrackAnalyticsReadiness,
  getTrackAnalyticsRevenue,
  getTrackAnalyticsRoundProgress,
  getTrackAnalyticsSecondaryActivity,
  getTrackAnalyticsSummary,
  getTrackAnalyticsTop,
  getTrackAnalyticsUnits,
} from "@/services/admin/adminTrackAnalytics.service";
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

function pickTrackSummary(s: Record<string, unknown> | null) {
  return {
    totalReleases: Number(s?.totalReleases ?? s?.totalTracks ?? 0),
    publishedReleases: Number(s?.publishedReleases ?? s?.activeTracks ?? 0),
    draftReleases: Number(s?.draftReleases ?? 0),
    reviewReleases: Number(s?.reviewReleases ?? 0),
    incompleteReleases: Number(s?.incompleteReleases ?? 0),
    liveRounds: Number(s?.liveRounds ?? s?.liveRoundsLegacy ?? 0),
    completedRounds: Number(s?.completedRounds ?? 0),
    roundsWithoutSales: Number(s?.roundsWithoutSales ?? 0),
    averageRoundProgressPct: Number(s?.averageRoundProgressPct ?? 0),
    totalUnits: Number(s?.totalUnits ?? 0),
    soldUnits: Number(s?.soldUnits ?? 0),
    availableUnits: Number(s?.availableUnits ?? 0),
    totalRaisedUsdt: String(s?.totalRaisedUsdt ?? "0,00"),
    activeListings: Number(s?.activeListings ?? 0),
    secondaryTrades: Number(s?.secondaryTrades ?? 0),
    secondaryVolumeUsdt: String(s?.secondaryVolumeUsdt ?? "0,00"),
    deltas: (s?.deltas ?? {}) as { raisedPct?: number | null },
  };
}

type RoundRow = {
  roundId: string;
  trackId: string;
  trackTitle: string;
  artistName: string;
  status: string;
  raisedUsdt: string;
  targetUsdt: string;
  hardCapUsdt: string;
  progressPct: number;
  soldUnits: string;
  availableUnits: string;
  holdersCount: number;
  daysLeft: number | null;
  warnings: string[];
};

const DRILL_LINK_KEYS = [
  { href: ROUTES.adminTracks, section: "tracks" },
  { href: ROUTES.adminRounds, section: "rounds" },
  { href: ROUTES.adminHoldings, section: "holdings" },
  { href: ROUTES.adminRevenue, section: "revenue" },
  { href: ROUTES.adminSecondaryMarket, section: "secondaryMarket" },
  { href: ROUTES.adminPlatformRevenue, section: "platformRevenue" },
] as const;

function formatUnits(n: number | string, unitsLabel: string): string {
  const v = typeof n === "string" ? parseInt(n.replace(/\s/g, ""), 10) : n;
  return unitsLabel.replace("{count}", String(Number.isFinite(v) ? v.toLocaleString("ru-RU") : n));
}

function StatusBadge({ status, kind = "round" }: { status: string; kind?: "round" | "track" }) {
  const a = useAdminI18n();
  const map: Record<string, string> = {
    live: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    draft: "bg-zinc-100 text-zinc-300 ring-zinc-200",
    paused: "bg-amber-50 text-amber-900 ring-amber-200",
    completed: "bg-blue-50 text-blue-900 ring-blue-200",
    closed: "bg-zinc-100 text-zinc-400 ring-zinc-200",
  };
  const label = kind === "track" ? a.formatTrackStatus(status) : a.formatRoundStatus(status);
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium uppercase ring-1", map[status] ?? map.draft)}>
      {label}
    </span>
  );
}

export function AnalyticsTracksSection() {
  const a = useAdminI18n();
  const tr = React.useCallback((key: string) => a.t(`admin.analytics.tracks.${key}`), [a]);
  const drillLinks = React.useMemo(
    () => DRILL_LINK_KEYS.map((item) => ({ href: item.href, label: a.adminSectionLabel(item.section) })),
    [a],
  );
  const formatUnitsLocalized = React.useCallback(
    (n: number | string) => formatUnits(n, tr("unitsLabel")),
    [tr],
  );
  const client = useAdminApi();
  const { user } = useAuth();
  const analyst = isBusinessAnalyst(user?.roles);
  const contentOnly =
    (user?.roles?.includes("CONTENT_MANAGER") ?? false) &&
    !(user?.roles?.some((r) => ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "BUSINESS_ANALYST"].includes(r)) ?? false);

  const { period, setPeriod, query, customFrom, customTo, setCustomDates } = useAnalyticsPeriod("30d");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getTrackAnalyticsSummary>> | null>(null);
  const [rounds, setRounds] = React.useState<Awaited<ReturnType<typeof getTrackAnalyticsRoundProgress>> | null>(null);
  const [units, setUnits] = React.useState<Awaited<ReturnType<typeof getTrackAnalyticsUnits>> | null>(null);
  const [holders, setHolders] = React.useState<Awaited<ReturnType<typeof getTrackAnalyticsHolders>> | null>(null);
  const [revenue, setRevenue] = React.useState<Awaited<ReturnType<typeof getTrackAnalyticsRevenue>> | null>(null);
  const [market, setMarket] = React.useState<Awaited<ReturnType<typeof getTrackAnalyticsSecondaryActivity>> | null>(null);
  const [readiness, setReadiness] = React.useState<Awaited<ReturnType<typeof getTrackAnalyticsReadiness>> | null>(null);
  const [top, setTop] = React.useState<Awaited<ReturnType<typeof getTrackAnalyticsTop>> | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      getTrackAnalyticsSummary(query, client),
      getTrackAnalyticsRoundProgress(query, client),
      getTrackAnalyticsUnits(query, client),
      getTrackAnalyticsHolders(query, client),
      getTrackAnalyticsRevenue(query, client),
      getTrackAnalyticsSecondaryActivity(query, client),
      getTrackAnalyticsReadiness(query, client),
      getTrackAnalyticsTop(query, client),
    ])
      .then(([s, r, u, h, rev, m, ready, t]) => {
        setSummary(s);
        setRounds(r);
        setUnits(u);
        setHolders(h);
        setRevenue(rev);
        setMarket(m);
        setReadiness(ready);
        setTop(t);
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
        <AdminLoadingState label={a.t("admin.analytics.tracks.loading")} centered />
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

  const s = pickTrackSummary(summary as Record<string, unknown> | null);
  const roundItems = (rounds?.items ?? []) as RoundRow[];
  const bestRound = [...roundItems].sort((a, b) => b.progressPct - a.progressPct)[0];
  const lowProgressCount = roundItems.filter((r) => r.progressPct < 10 && r.status === "live").length;
  const highConcentrationCount = (holders?.items ?? []).filter(
    (h: { highConcentration?: boolean }) => h.highConcentration,
  ).length;
  const hasActivity =
    s.totalReleases > 0 || s.secondaryTrades > 0 || roundItems.length > 0 || (units?.soldUnits ?? 0) > 0;

  const health = buildTrackHealthSummary({
    hasActivity,
    totalReleases: s.totalReleases,
    publishedReleases: s.publishedReleases,
    liveRounds: s.liveRounds,
    bestRelease: bestRound?.trackTitle,
    attentionCount: top?.attention?.length ?? 0,
  });

  const insights = buildTrackInsights({
    incompleteReleases: s.incompleteReleases,
    roundsWithoutSales: s.roundsWithoutSales,
    liveRounds: s.liveRounds,
    lowProgressCount,
    highConcentrationCount,
    noLiveRounds: s.liveRounds === 0 && s.totalReleases > 0,
  });

  const roundCols: AdminColumn<RoundRow>[] = [
    {
      key: "release",
      header: tr("col.release"),
      render: (r) => (
        <Link href={tracksFilterHref({ id: r.trackId })} className="font-medium text-zinc-100 hover:underline">
          {r.trackTitle}
        </Link>
      ),
    },
    { key: "artist", header: tr("col.artist"), render: (r) => r.artistName },
    { key: "status", header: tr("col.round"), render: (trackRow) => <StatusBadge status={trackRow.status} /> },
    {
      key: "progress",
      header: a.t("admin.table.progress"),
      render: (r) => (
        <div className="min-w-[120px]">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{r.progressPct}%</span>
            <span>{formatUsdtAmount(r.raisedUsdt)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn(
                "h-full rounded-full",
                r.progressPct >= 75 ? "bg-emerald-500" : r.progressPct >= 25 ? "bg-blue-500" : "bg-amber-500",
              )}
              style={{ width: `${Math.min(100, r.progressPct)}%` }}
            />
          </div>
        </div>
      ),
    },
    { key: "units", header: tr("col.units"), render: (r) => `${r.soldUnits} / ${r.availableUnits}` },
    { key: "holders", header: tr("col.holders"), render: (r) => String(r.holdersCount) },
    {
      key: "warnings",
      header: tr("col.signals"),
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.warnings.length === 0 ? (
            <span className="text-zinc-400">—</span>
          ) : (
            r.warnings.map((w) => (
              <span key={w} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-900">
                {ROUND_WARNING_LABELS[w] ?? w}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: "action",
      header: "",
      render: (r) => (
        <Link href={`${ROUTES.adminRounds}?releaseId=${r.trackId}`} className="text-xs text-blue-600 hover:underline">
          {tr("col.round")}
        </Link>
      ),
    },
  ];

  const holderCols: AdminColumn<{
    trackId: string;
    trackTitle: string;
    holdersCount: number;
    totalUnits: string;
    averageUnitsPerHolder: string;
    topHolderSharePct: number;
    highConcentration?: boolean;
  }>[] = [
    {
      key: "track",
      header: tr("col.release"),
      render: (r) => (
        <Link href={`${ROUTES.adminHoldings}?releaseId=${r.trackId}`} className="hover:underline">
          {r.trackTitle}
        </Link>
      ),
    },
    { key: "holders", header: tr("col.holdersCount"), render: (r) => String(r.holdersCount) },
    { key: "units", header: tr("col.units"), render: (r) => r.totalUnits },
    { key: "avg", header: tr("col.avgUnits"), render: (r) => r.averageUnitsPerHolder },
    {
      key: "conc",
      header: a.t("admin.table.topShare"),
      render: (r) => (
        <span className={cn(r.highConcentration && "font-medium text-amber-800")}>{r.topHolderSharePct}%</span>
      ),
    },
  ];

  const readinessCols: AdminColumn<{
    trackId: string;
    trackTitle: string;
    status: string;
    readinessScore: number;
    missingFields: string[];
  }>[] = [
    {
      key: "track",
      header: tr("col.release"),
      render: (r) => (
        <Link href={tracksFilterHref({ id: r.trackId })} className="font-medium hover:underline">
          {r.trackTitle}
        </Link>
      ),
    },
    {
      key: "score",
      header: tr("col.readiness"),
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn(
                "h-full rounded-full",
                r.readinessScore >= 80 ? "bg-emerald-500" : r.readinessScore >= 50 ? "bg-amber-500" : "bg-rose-500",
              )}
              style={{ width: `${r.readinessScore}%` }}
            />
          </div>
          <span className="text-sm tabular-nums">{r.readinessScore}%</span>
        </div>
      ),
    },
    {
      key: "missing",
      header: tr("col.missing"),
      render: (r) =>
        r.missingFields.length ? (
          <span className="text-xs text-zinc-400">
            {r.missingFields.map((f) => MISSING_FIELD_LABELS[f] ?? f).join(", ")}
          </span>
        ) : (
          <span className="text-emerald-600">{tr("ready")}</span>
        ),
    },
    { key: "status", header: a.table.status, render: (trackRow) => <StatusBadge status={trackRow.status} kind="track" /> },
    {
      key: "actions",
      header: tr("col.actions"),
      render: (r) =>
        !analyst ? (
          <div className="flex gap-2 text-xs">
            <Link href={tracksFilterHref({ id: r.trackId })} className="text-blue-600 hover:underline">
              {tr("col.release")}
            </Link>
            <Link href={`${ROUTES.adminRounds}?releaseId=${r.trackId}`} className="text-blue-600 hover:underline">
              {tr("col.round")}
            </Link>
          </div>
        ) : (
          <span className="text-zinc-400">—</span>
        ),
    },
  ];

  const healthBannerClass = adminAnalyticsHealthBannerSurface(health.tone);

  const raisedDelta = s.deltas.raisedPct;

  return (
    <AdminPageShell>
      {analyst ? <AdminReadOnlyBanner area="analytics" className="mb-2" /> : null}
      <AdminPageHeader
        title={a.t("admin.analytics.tracks.title")}
        description={a.t("admin.analytics.tracks.description")}
        breadcrumbs={a.adminSectionBreadcrumbs("analyticsTracks")}
        actions={
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <AdminPeriodSelector value={period} onChange={setPeriod} customFrom={customFrom} customTo={customTo} onCustomDatesChange={setCustomDates} />
              <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={load} disabled={loading}>
                {loading ? a.t("admin.analytics.common.refreshing") : a.t("admin.analytics.common.refresh")}
              </Button>
              <AdminAnalyticsExportButton reportType="tracks_round_progress" label={a.t("admin.analytics.common.report")} />
            </div>
            {lastUpdated ? (
              <p className="text-xs text-zinc-500">
                {a.t("admin.analytics.common.updatedAt")} {formatAdminDateShort(lastUpdated)}
              </p>
            ) : null}
          </div>
        }
      />

      <AdminAnalyticsLayout activeSection="analyticsTracks">
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
            <AdminAnalyticsKpiGroup title={tr("kpiGroup.releases")}>
              <AdminMetricTrendCard
                label={tr("kpi.totalReleases")}
                value={String(s.totalReleases)}
                tooltip={TRACK_KPI_TOOLTIPS.totalReleases}
                href={ROUTES.adminTracks}
              />
              <AdminMetricTrendCard
                label={tr("kpi.published")}
                value={String(s.publishedReleases)}
                tooltip={TRACK_KPI_TOOLTIPS.published}
                href={tracksFilterHref({ status: "published" })}
              />
              <AdminMetricTrendCard label={tr("kpi.drafts")} value={String(s.draftReleases)} tooltip={TRACK_KPI_TOOLTIPS.drafts} />
              <AdminMetricTrendCard label={tr("kpi.review")} value={String(s.reviewReleases)} tooltip={TRACK_KPI_TOOLTIPS.review} />
              <AdminMetricTrendCard
                label={tr("kpi.noCover")}
                value={String(s.incompleteReleases)}
                tooltip={TRACK_KPI_TOOLTIPS.incomplete}
                href={tracksFilterHref({ missing: "cover" })}
              />
            </AdminAnalyticsKpiGroup>

            <AdminAnalyticsKpiGroup title={tr("kpiGroup.rounds")}>
              <AdminMetricTrendCard
                label={tr("kpi.liveRounds")}
                value={String(s.liveRounds)}
                tooltip={TRACK_KPI_TOOLTIPS.liveRounds}
                href={ROUTES.adminRounds}
              />
              <AdminMetricTrendCard label={tr("kpi.completedRounds")} value={String(s.completedRounds)} tooltip={TRACK_KPI_TOOLTIPS.completedRounds} />
              <AdminMetricTrendCard
                label={tr("kpi.noSales")}
                value={String(s.roundsWithoutSales)}
                tooltip={TRACK_KPI_TOOLTIPS.roundsNoSales}
                href={ROUTES.adminRounds}
              />
              <AdminMetricTrendCard
                label={tr("kpi.avgProgress")}
                value={`${s.averageRoundProgressPct}%`}
                tooltip={TRACK_KPI_TOOLTIPS.avgProgress}
              />
            </AdminAnalyticsKpiGroup>

            <AdminAnalyticsKpiGroup title={tr("kpiGroup.units")}>
              <AdminMetricTrendCard label={tr("kpi.totalUnits")} value={formatUnitsLocalized(s.totalUnits)} tooltip={TRACK_KPI_TOOLTIPS.totalUnits} />
              <AdminMetricTrendCard label={tr("kpi.sold")} value={formatUnitsLocalized(s.soldUnits)} tooltip={TRACK_KPI_TOOLTIPS.soldUnits} />
              <AdminMetricTrendCard label={tr("kpi.available")} value={formatUnitsLocalized(s.availableUnits)} tooltip={TRACK_KPI_TOOLTIPS.availableUnits} />
              <AdminMetricTrendCard
                label={tr("kpi.inListings")}
                value={formatUnitsLocalized(units?.lockedInListings ?? 0)}
                href={ROUTES.adminSecondaryMarket}
              />
            </AdminAnalyticsKpiGroup>

            {!contentOnly ? (
              <AdminAnalyticsKpiGroup title={tr("kpiGroup.finance")}>
                <AdminMetricTrendCard
                  label={tr("kpi.raisedInRounds")}
                  value={formatUsdtAmount(s.totalRaisedUsdt)}
                  deltaPct={raisedDelta}
                  tooltip={TRACK_KPI_TOOLTIPS.raised}
                  href={ROUTES.adminRounds}
                />
                <AdminMetricTrendCard
                  label={tr("kpi.secondaryVolume")}
                  value={formatUsdtAmount(s.secondaryVolumeUsdt)}
                  tooltip={TRACK_KPI_TOOLTIPS.secondaryVolume}
                  href={ROUTES.adminSecondaryMarket}
                />
              </AdminAnalyticsKpiGroup>
            ) : null}

            <AdminAnalyticsKpiGroup title={tr("kpiGroup.market")}>
              <AdminMetricTrendCard
                label={tr("kpi.activeListings")}
                value={String(s.activeListings)}
                tooltip={TRACK_KPI_TOOLTIPS.activeListings}
                href={ROUTES.adminSecondaryMarket}
              />
              <AdminMetricTrendCard
                label={tr("kpi.secondaryTrades")}
                value={String(s.secondaryTrades)}
                tooltip={TRACK_KPI_TOOLTIPS.secondaryTrades}
                href={ROUTES.adminSecondaryMarket}
              />
            </AdminAnalyticsKpiGroup>
          </div>

          <AdminAnalyticsInsightsPanel items={insights} className="xl:sticky xl:top-4 xl:self-start" />
        </div>

        <section className={cn(ADMIN_SECTION_TILE, "mt-6 p-5")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">{tr("roundProgressTitle")}</h2>
              <p className="mt-1 text-sm text-zinc-500">{tr("roundProgressDesc")}</p>
            </div>
            <Link href={ROUTES.adminRounds} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
              {tr("allRounds")} <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-4">
            {roundItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm">
                <p className="font-medium text-zinc-200">{TRACK_CHART_EMPTY.rounds.title}</p>
                <p className="mt-1 text-zinc-500">{TRACK_CHART_EMPTY.rounds.description}</p>
              </div>
            ) : (
              <>
                <div className="mb-4 grid gap-4 lg:grid-cols-2">
                  <AdminBarChart
                    items={roundItems.map((r) => ({ label: r.trackTitle.slice(0, 18), value: r.progressPct }))}
                    formatValue={(v) => `${v}%`}
                  />
                  <AdminBarChart
                    items={roundItems.map((r) => ({
                      label: r.trackTitle.slice(0, 18),
                      value: parseAnalyticsMoney(r.raisedUsdt),
                    }))}
                    formatValue={(v) => `${v.toLocaleString("ru-RU")} USDT`}
                  />
                </div>
                <AdminDataTable columns={roundCols} rows={roundItems} rowKey={(r) => r.roundId} />
              </>
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <AdminChartCard
            title={tr("unitsTitle")}
            description={tr("unitsDesc")}
            empty={!units?.byRelease?.length && !units?.soldUnits}
            emptyTitle={TRACK_CHART_EMPTY.units.title}
            emptyDescription={TRACK_CHART_EMPTY.units.description}
            drilldownHref={ROUTES.adminTracks}
          >
            <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-emerald-50 px-2 py-3">
                <p className="text-xs text-zinc-500">{tr("sold")}</p>
                <p className="font-semibold tabular-nums">{formatUnitsLocalized(units?.soldUnits ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-blue-50 px-2 py-3">
                <p className="text-xs text-zinc-500">{tr("available")}</p>
                <p className="font-semibold tabular-nums">{formatUnitsLocalized(units?.availableUnits ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-violet-50 px-2 py-3">
                <p className="text-xs text-zinc-500">{tr("inListings")}</p>
                <p className="font-semibold tabular-nums">{formatUnitsLocalized(units?.lockedInListings ?? 0)}</p>
              </div>
            </div>
            <AdminBarChart
              items={(units?.byRelease ?? []).map((b) => ({
                label: b.trackTitle.slice(0, 16),
                value: parseInt(b.soldUnits, 10) || 0,
                color: "#059669",
              }))}
            />
          </AdminChartCard>

          <AdminChartCard
            title={tr("holdersTitle")}
            empty={!holders?.items?.length}
            emptyTitle={TRACK_CHART_EMPTY.holders.title}
            emptyDescription={TRACK_CHART_EMPTY.holders.description}
            drilldownHref={ROUTES.adminHoldings}
          >
            <AdminDataTable
              columns={holderCols}
              rows={holders?.items ?? []}
              rowKey={(r) => r.trackId}
              emptyMessage={TRACK_CHART_EMPTY.holders.description}
            />
          </AdminChartCard>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {!contentOnly ? (
            <AdminChartCard
              title={tr("revenueByRelease")}
              empty={!revenue?.items?.length}
              emptyTitle={TRACK_CHART_EMPTY.revenue.title}
              emptyDescription={TRACK_CHART_EMPTY.revenue.description}
              drilldownHref={ROUTES.adminRevenue}
            >
              <AdminBarChart
                items={(revenue?.items ?? []).map((r) => ({
                  label: r.trackTitle.slice(0, 16),
                  value: parseAnalyticsMoney(r.grossRevenueUsdt ?? (r as { revenueUsdt?: string }).revenueUsdt ?? "0"),
                }))}
                formatValue={(v) => `${v.toLocaleString("ru-RU")} USDT`}
              />
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Link href={ROUTES.adminRevenue} className="text-blue-600 hover:underline">
                  {tr("distributions")}
                </Link>
                <Link href={ROUTES.adminPlatformRevenue} className="text-blue-600 hover:underline">
                  {tr("platformRevenue")}
                </Link>
              </div>
            </AdminChartCard>
          ) : null}

          <AdminChartCard
            title={tr("secondaryActivity")}
            empty={!market?.items?.length}
            emptyTitle={TRACK_CHART_EMPTY.secondary.title}
            emptyDescription={TRACK_CHART_EMPTY.secondary.description}
            emptyVariant="market"
            drilldownHref={ROUTES.adminSecondaryMarket}
            className={contentOnly ? "xl:col-span-2" : undefined}
          >
            <AdminBarChart
              items={(market?.items ?? []).map((m) => ({
                label: m.trackTitle.slice(0, 16),
                value: parseAnalyticsMoney(m.volumeUsdt),
              }))}
              formatValue={(v) => `${v.toLocaleString("ru-RU")} USDT`}
            />
          </AdminChartCard>
        </div>

        <section className={cn(ADMIN_SECTION_TILE, "mt-6 p-5")}>
          <h2 className="text-base font-semibold text-zinc-100">{tr("readinessTitle")}</h2>
          <p className="mt-1 text-sm text-zinc-500">{tr("readinessDesc")}</p>
          <div className="mt-4">
            {!readiness?.items?.length ? (
              <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm">
                <p className="font-medium text-zinc-200">{TRACK_CHART_EMPTY.readiness.title}</p>
                <p className="mt-1 text-zinc-500">{TRACK_CHART_EMPTY.readiness.description}</p>
              </div>
            ) : (
              <AdminDataTable columns={readinessCols} rows={readiness.items} rowKey={(r) => r.trackId} />
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className={cn(ADMIN_SECTION_TILE, "p-5")}>
            <h2 className="text-base font-semibold text-zinc-100">{tr("topReleases")}</h2>
            <ul className="mt-4 space-y-2">
              {(top?.topByRaised ?? []).map((t) => (
                <li key={t.trackId}>
                  <Link
                    href={tracksFilterHref({ id: t.trackId })}
                    className="flex justify-between rounded-lg border border-zinc-800 px-3 py-2 text-sm hover:bg-zinc-800/60"
                  >
                    <span>{t.trackTitle}</span>
                    <span className="font-medium tabular-nums">{t.valueUsdt}</span>
                  </Link>
                </li>
              ))}
              {(top?.topByHolders ?? []).length > 0 ? (
                <li className="pt-2 text-xs font-medium uppercase text-zinc-400">{tr("byHolders")}</li>
              ) : null}
              {(top?.topByHolders ?? []).map((t) => (
                <li key={`h-${t.trackId}`}>
                  <Link
                    href={`${ROUTES.adminHoldings}?releaseId=${t.trackId}`}
                    className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm hover:bg-zinc-100"
                  >
                    <span>{t.trackTitle}</span>
                    <span className="tabular-nums">{tr("holdersShort").replace("{count}", String(t.holdersCount))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={cn(ADMIN_SECTION_TILE, "p-5")}>
            <h2 className="text-base font-semibold text-zinc-100">{tr("needsAttention")}</h2>
            <ul className="mt-4 space-y-2">
              {(top?.attention ?? []).length === 0 ? (
                <p className="text-sm text-zinc-500">{tr("noCriticalSignals")}</p>
              ) : (
                (top?.attention ?? []).map((a, i) => (
                  <li key={`${a.trackId}-${a.reason}-${i}`}>
                    <Link
                      href={
                        a.reason === "missing_cover"
                          ? tracksFilterHref({ id: a.trackId })
                          : a.reason === "live_round_no_sales"
                            ? `${ROUTES.adminRounds}?releaseId=${a.trackId}`
                            : `${ROUTES.adminHoldings}?releaseId=${a.trackId}`
                      }
                      className="flex justify-between rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-sm"
                    >
                      <span>
                        {a.trackTitle} — {a.label}
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-amber-700" />
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <section className={cn(ADMIN_SECTION_TILE, "mt-6 p-5")}>
          <h2 className="text-sm font-semibold text-zinc-100">Drill-down</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {drillLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2.5 text-sm hover:bg-zinc-800/60"
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
