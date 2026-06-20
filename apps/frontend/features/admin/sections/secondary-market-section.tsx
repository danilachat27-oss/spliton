"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, Info } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { AdminBarChart, AdminColumnChart, AdminLineChart } from "@/features/admin/analytics/components/admin-charts.lazy";
import { AdminChartCard } from "@/features/admin/analytics/components/admin-chart-card";
import { AdminMetricTrendCard } from "@/features/admin/analytics/components/admin-metric-trend-card";
import { AdminPeriodSelector } from "@/features/admin/analytics/components/admin-period-selector";
import { parseAnalyticsMoney, useAnalyticsPeriod } from "@/features/admin/analytics/hooks/use-analytics-period";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSecondaryMarketListingDrawer,
  type ListingPendingAction,
} from "@/features/admin/components/admin-secondary-market-listing-drawer";
import { AdminSecondaryMarketTradeDrawer } from "@/features/admin/components/admin-secondary-market-trade-drawer";
import {
  AdminSectionDataArea,
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
  SECONDARY_MARKET_FIELD_TOOLTIPS,
  listingStatusLabel,
  listingStatusTone,
  tradeStatusLabel,
  tradeStatusTone,
} from "@/features/admin/lib/admin-secondary-market-i18n";
import { formatAdminDate, formatAdminMetricUsdt, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_KPI_GRID, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { adminBtnGhost } from "@/features/admin/lib/admin-ui";
import type {
  AdminListingDetail,
  AdminListingListItem,
  AdminSecondaryMarketFees,
  AdminSecondaryMarketLiquidity,
  AdminSecondaryMarketSummary,
  AdminTradeDetail,
  AdminTradeListItem,
} from "@/features/admin/mocks/admin-secondary-market.mock";
import {
  AdminActionMenu,
  AdminDataTable,
  AdminErrorState,
  AdminFilterBar,
  AdminPagination,
  AdminReadOnlyBanner,
  AdminRiskBadge,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import {
  cancelAdminListing,
  freezeAdminListing,
  getAdminListing,
  getAdminSecondaryMarketFees,
  getAdminSecondaryMarketLiquidity,
  getAdminSecondaryMarketSummary,
  getAdminTrade,
  listAdminListingsPaginated,
  listAdminTradesPaginated,
  markAdminTradeSuspicious,
  releaseAdminListing,
  type SecondaryMarketQuery,
} from "@/services/admin/adminSecondaryMarket.service";
import { statusLabel } from "@/lib/i18n/status-labels";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Обзор" },
  { id: "listings", label: "Листинги" },
  { id: "trades", label: "Сделки" },
  { id: "suspicious", label: "Подозрительные операции" },
  { id: "cancelled", label: "Замороженные / отменённые" },
  { id: "liquidity", label: "Ликвидность" },
  { id: "fees", label: "Комиссии" },
] as const;

type MarketTab = (typeof TABS)[number]["id"];

const adminTableLink =
  "text-sm font-medium text-zinc-100 transition-colors hover:text-[#B7F500]";
const listingsTableClass = "[&_table]:min-w-[1280px]";
const tradesTableClass = "[&_table]:min-w-[1120px]";

function SectionTableTitle({ title, total }: { title: string; total: number }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      <span className="text-sm tabular-nums text-zinc-500">{total}</span>
    </div>
  );
}

export function SecondaryMarketSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const readOnly = perms.readOnly("Secondary Market");
  const canMutate = perms.can("Secondary Market", "update");
  const { period, setPeriod } = useAnalyticsPeriod("30d");
  const [tab, setTab] = useAdminSectionTab<MarketTab>(
    TABS.map((t) => t.id),
    "overview",
  );

  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [summaryError, setSummaryError] = React.useState(false);
  const [summary, setSummary] = React.useState<AdminSecondaryMarketSummary | null>(null);
  const [liquidity, setLiquidity] = React.useState<AdminSecondaryMarketLiquidity | null>(null);
  const [fees, setFees] = React.useState<AdminSecondaryMarketFees | null>(null);

  const [search, setSearch] = React.useState("");
  const [minAmount, setMinAmount] = React.useState("");
  const [maxAmount, setMaxAmount] = React.useState("");
  const [minUnits, setMinUnits] = React.useState("");

  const baseQuery = React.useMemo<SecondaryMarketQuery>(
    () => ({
      period,
      search: search || undefined,
      minAmount: minAmount || undefined,
      maxAmount: maxAmount || undefined,
      minUnits: minUnits || undefined,
    }),
    [period, search, minAmount, maxAmount, minUnits],
  );

  const listingQuery = React.useMemo<SecondaryMarketQuery>(() => {
    if (tab === "cancelled") return { ...baseQuery, marketFilter: "frozen_cancelled" };
    if (tab === "listings") return { ...baseQuery, marketFilter: "active" };
    return baseQuery;
  }, [baseQuery, tab]);

  const tradeQuery = React.useMemo<SecondaryMarketQuery>(() => {
    if (tab === "suspicious") return { ...baseQuery, marketFilter: "suspicious" };
    return baseQuery;
  }, [baseQuery, tab]);

  const listingLoader = React.useCallback(
    (q: SecondaryMarketQuery) => listAdminListingsPaginated({ ...listingQuery, ...q }, client),
    [client, listingQuery],
  );
  const tradeLoader = React.useCallback(
    (q: SecondaryMarketQuery) => listAdminTradesPaginated({ ...tradeQuery, ...q }, client),
    [client, tradeQuery],
  );

  const listings = useAdminPaginatedList(listingLoader);
  const trades = useAdminPaginatedList(tradeLoader);

  const [listingDrawerOpen, setListingDrawerOpen] = React.useState(false);
  const [listingDetail, setListingDetail] = React.useState<AdminListingDetail | null>(null);
  const [listingDetailLoading, setListingDetailLoading] = React.useState(false);

  const [tradeDrawerOpen, setTradeDrawerOpen] = React.useState(false);
  const [tradeDetail, setTradeDetail] = React.useState<AdminTradeDetail | null>(null);
  const [tradeDetailLoading, setTradeDetailLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const loadOverview = React.useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(false);
    try {
      const [s, liq, f] = await Promise.all([
        getAdminSecondaryMarketSummary(baseQuery, client),
        getAdminSecondaryMarketLiquidity(baseQuery, client),
        getAdminSecondaryMarketFees(baseQuery, client),
      ]);
      setSummary(s);
      setLiquidity(liq);
      setFees(f);
    } catch {
      setSummaryError(true);
    } finally {
      setSummaryLoading(false);
    }
  }, [baseQuery, client]);

  React.useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  React.useEffect(() => {
    if (tab === "listings" || tab === "cancelled") listings.reload();
    if (tab === "trades" || tab === "suspicious") trades.reload();
  }, [tab, listingQuery, tradeQuery]);

  async function openListing(row: AdminListingListItem) {
    setListingDrawerOpen(true);
    setListingDetailLoading(true);
    setListingDetail(null);
    try {
      const d = await getAdminListing(row.id, undefined, client);
      if (d) setListingDetail(d);
    } finally {
      setListingDetailLoading(false);
    }
  }

  async function openTrade(row: AdminTradeListItem) {
    setTradeDrawerOpen(true);
    setTradeDetailLoading(true);
    setTradeDetail(null);
    try {
      const d = await getAdminTrade(row.id, undefined, client);
      if (d) setTradeDetail(d);
    } finally {
      setTradeDetailLoading(false);
    }
  }

  async function handleListingAction(action: ListingPendingAction, note: string) {
    if (!listingDetail) return;
    setActionError(null);
    try {
      if (action.action === "freeze") await freezeAdminListing(listingDetail.id, note, client);
      else if (action.action === "release") await releaseAdminListing(listingDetail.id, note, client);
      else if (action.action === "cancel") await cancelAdminListing(listingDetail.id, note, client);
      listings.reload();
      trades.reload();
      await loadOverview();
      const refreshed = await getAdminListing(listingDetail.id, undefined, client);
      if (refreshed) setListingDetail(refreshed);
    } catch (e) {
      setActionError(localizedAdminError(e));
      throw e;
    }
  }

  async function handleMarkSuspicious(note: string) {
    if (!tradeDetail) return;
    setActionError(null);
    try {
      await markAdminTradeSuspicious(tradeDetail.id, note, client);
      trades.reload();
      await loadOverview();
      const refreshed = await getAdminTrade(tradeDetail.id, undefined, client);
      if (refreshed) setTradeDetail(refreshed);
    } catch (e) {
      setActionError(localizedAdminError(e));
      throw e;
    }
  }

  function goToTab(target: MarketTab) {
    setTab(target);
  }

  const listingCols: AdminColumn<AdminListingListItem>[] = [
    {
      key: "id",
      header: a.t("admin.table.id"),
      render: (r) => (
        <button type="button" className={cn(adminTableLink, "inline-flex items-center gap-1 font-mono text-xs")} onClick={() => openListing(r)}>
          {r.id.slice(0, 10)}…
          <AdminCopyButton value={r.id} />
        </button>
      ),
    },
    {
      key: "seller",
      header: a.table.seller,
      render: (r) => (
        <div className="space-y-0.5">
          <Link href={`${ROUTES.adminUsers}/${r.sellerId}`} className={adminTableLink}>
            {r.sellerEmail}
          </Link>
          <AdminStatusBadge tone="neutral" label={a.formatAdminStatus(r.sellerStatus)} />
        </div>
      ),
    },
    {
      key: "release",
      header: a.table.track,
      render: (r) => (
        <div>
          <p className="font-medium">{r.trackTitle}</p>
          {r.artistName ? <p className="text-xs text-zinc-500">{r.artistName}</p> : null}
        </div>
      ),
    },
    { key: "units", header: a.table.units, render: (r) => `${r.units} юн.` },
    { key: "ppu", header: a.table.pricePerUnit, render: (r) => formatUsdtAmount(r.pricePerUnitUsdt) },
    { key: "total", header: a.table.total, render: (r) => (
      <span className="font-medium tabular-nums text-emerald-400">{formatUsdtAmount(r.totalPriceUsdt)}</span>
    ) },
    { key: "fee", header: a.table.fee, render: (r) => formatUsdtAmount(r.platformFeeEstimateUsdt) },
    {
      key: "status",
      header: a.table.status,
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1">
          <AdminStatusBadge tone={listingStatusTone(r.status)} label={listingStatusLabel(r.status)} />
          {r.isLocked ? <AdminStatusBadge tone="warning" label="Заблокировано" /> : null}
          {r.hasRisk ? <AdminRiskBadge score={75} /> : null}
        </div>
      ),
    },
    { key: "locked", header: "Заблок.", render: (r) => r.lockedUnits },
    { key: "created", header: a.table.created, render: (r) => formatAdminDate(r.createdAt) },
    { key: "updated", header: "Обновлено", render: (r) => formatAdminDate(r.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <AdminActionMenu
          items={[
            { id: "view", label: "Подробнее", onClick: () => openListing(r) },
            ...(canMutate && r.status === "active"
              ? [{ id: "freeze", label: "Заморозить", onClick: () => openListing(r) }]
              : []),
            ...(canMutate && r.status !== "cancelled"
              ? [{ id: "user", label: "Открыть пользователя", onClick: () => window.open(`${ROUTES.adminUsers}/${r.sellerId}`, "_blank") }]
              : []),
          ]}
        />
      ),
    },
  ];

  const tradeCols: AdminColumn<AdminTradeListItem>[] = [
    {
      key: "id",
      header: a.t("admin.table.tradeId"),
      render: (r) => (
        <button type="button" className={cn(adminTableLink, "inline-flex items-center gap-1 font-mono text-xs")} onClick={() => openTrade(r)}>
          {r.id.slice(0, 10)}…
          <AdminCopyButton value={r.id} />
        </button>
      ),
    },
    { key: "seller", header: a.table.seller, render: (r) => r.sellerEmail },
    { key: "buyer", header: a.table.buyer, render: (r) => r.buyerEmail },
    { key: "track", header: a.table.track, render: (r) => r.trackTitle },
    { key: "units", header: a.table.units, render: (r) => r.units },
    { key: "ppu", header: a.table.pricePerUnit, render: (r) => formatUsdtAmount(r.pricePerUnitUsdt) },
    { key: "amount", header: a.table.amount, render: (r) => formatUsdtAmount(r.priceUsdt) },
    { key: "fee", header: a.table.fee, render: (r) => formatUsdtAmount(r.feeUsdt) },
    {
      key: "status",
      header: a.table.status,
      render: (r) => (
        <div className="flex items-center gap-1">
          <AdminStatusBadge tone={tradeStatusTone(r.status)} label={tradeStatusLabel(r.status)} />
          {r.suspicious ? <AdminRiskBadge score={90} /> : null}
        </div>
      ),
    },
    { key: "settlement", header: a.t("admin.table.settlement"), render: (r) => statusLabel("trade", r.settlementStatus, a.locale) },
    { key: "at", header: "Завершено", render: (r) => formatAdminDate(r.completedAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <AdminActionMenu
          items={[
            { id: "view", label: a.actions.view, onClick: () => openTrade(r) },
            ...(canMutate && !r.suspicious
              ? [{ id: "flag", label: "Пометить подозрительной", onClick: () => openTrade(r) }]
              : []),
          ]}
        />
      ),
    },
  ];

  const volumeChartPoints = (liquidity?.volumeByDay ?? []).map((p) => ({
    period: p.period,
    value: parseAnalyticsMoney(p.volumeUsdt),
  }));

  return (
    <AdminSectionShell
      sectionId="secondaryMarket"
      title={a.adminSectionLabel("secondaryMarket")}
      infoHint={
        <>
          Контроль листингов, сделок, ликвидности, заблокированных юнитов, комиссий и риск-операций на вторичном
          рынке Spliton.
        </>
      }
      actions={
        <>
          <AdminPeriodSelector value={period} onChange={setPeriod} />
          <AdminSectionRefreshButton
            onClick={() => {
              void loadOverview();
              listings.reload();
              trades.reload();
            }}
          />
        </>
      }
    >
      {readOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("secondaryMarket")} /> : null}

      <AdminSectionPanel>
        <AdminFilterBar
          className="!rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
          panelWidthClassName="w-[min(100vw-1rem,520px)]"
          fields={[
            {
              id: "search",
              label: "Поиск",
              type: "search",
              value: search,
              onChange: setSearch,
              placeholder: "ID, email, релиз…",
            },
            {
              id: "minAmount",
              label: a.t("admin.filters.minAmount"),
              type: "number",
              value: minAmount,
              onChange: setMinAmount,
              placeholder: "0",
            },
            {
              id: "maxAmount",
              label: a.t("admin.filters.maxAmount"),
              type: "number",
              value: maxAmount,
              onChange: setMaxAmount,
              placeholder: "∞",
            },
            {
              id: "minUnits",
              label: a.t("admin.filters.minUnits"),
              type: "number",
              value: minUnits,
              onChange: setMinUnits,
              placeholder: "0",
            },
          ]}
        />

        {summary && !summaryLoading ? (
          <div className={ADMIN_SECTION_KPI_GRID}>
            <AdminMetricTrendCard
              label={a.t("admin.kpi.market.activeListings")}
              value={String(summary.activeListingsCount)}
              tooltip={SECONDARY_MARKET_FIELD_TOOLTIPS.activeListings}
              onClick={() => goToTab("listings")}
            />
            <AdminMetricTrendCard
              label={a.t("admin.kpi.market.unitsForSale")}
              value={summary.unitsListed}
              tooltip={SECONDARY_MARKET_FIELD_TOOLTIPS.unitsListed}
              onClick={() => goToTab("listings")}
            />
            <AdminMetricTrendCard
              label={a.t("admin.kpi.market.unitsLocked")}
              value={summary.lockedUnits}
              tooltip={SECONDARY_MARKET_FIELD_TOOLTIPS.lockedUnits}
              onClick={() => goToTab("listings")}
            />
            <AdminMetricTrendCard
              label={a.t("admin.kpi.market.tradeVolume")}
              value={formatUsdtAmount(summary.tradeVolumeUsdt)}
              deltaPct={summary.deltaVolumePct}
              tooltip={SECONDARY_MARKET_FIELD_TOOLTIPS.tradeVolume}
              onClick={() => goToTab("trades")}
            />
            <AdminMetricTrendCard
              label={a.t("admin.kpi.market.platformFee")}
              value={formatUsdtAmount(summary.platformFeesUsdt)}
              tooltip={SECONDARY_MARKET_FIELD_TOOLTIPS.platformFees}
              onClick={() => goToTab("fees")}
            />
            <AdminMetricTrendCard
              label={a.t("admin.kpi.market.tradesCompleted")}
              value={String(summary.completedTradesCount)}
              tooltip={SECONDARY_MARKET_FIELD_TOOLTIPS.completedTrades}
              onClick={() => goToTab("trades")}
            />
            <AdminMetricTrendCard
              label={a.t("admin.kpi.market.avgPricePerUnit")}
              value={formatAdminMetricUsdt(summary.avgPricePerUnitUsdt)}
              tooltip={SECONDARY_MARKET_FIELD_TOOLTIPS.avgPrice}
              onClick={() => goToTab("liquidity")}
            />
            <AdminMetricTrendCard
              label={a.t("admin.kpi.market.suspicious")}
              value={String(summary.suspiciousCount)}
              tooltip={SECONDARY_MARKET_FIELD_TOOLTIPS.suspicious}
              onClick={() => goToTab("suspicious")}
              activeTone={summary.suspiciousCount > 0 ? "warning" : "neutral"}
            />
            <AdminMetricTrendCard
              label={a.t("admin.kpi.market.frozen")}
              value={String(summary.frozenListingsCount)}
              tooltip={SECONDARY_MARKET_FIELD_TOOLTIPS.frozen}
              onClick={() => goToTab("cancelled")}
            />
            <AdminMetricTrendCard
              label={a.t("admin.kpi.market.cancelledListings")}
              value={String(summary.cancelledListingsCount)}
              tooltip={SECONDARY_MARKET_FIELD_TOOLTIPS.cancelled}
              onClick={() => goToTab("cancelled")}
            />
          </div>
        ) : summaryLoading ? (
          <div className={ADMIN_SECTION_KPI_GRID}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn(ADMIN_SECTION_TILE, "h-28 animate-pulse bg-zinc-800/50")} />
            ))}
          </div>
        ) : summaryError ? (
          <div className={cn(ADMIN_SECTION_TILE, "space-y-3")}>
            <p className="text-sm text-rose-300">Не удалось загрузить KPI. Попробуйте обновить.</p>
            <Button size="sm" variant="ghost" className={adminBtnGhost} onClick={() => void loadOverview()}>
              Повторить
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-zinc-900/25 px-4 py-3 text-sm">
          <Link
            href={ROUTES.adminAnalyticsMarket}
            className="inline-flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-[#B7F500]"
          >
            <BarChart3 className="size-3.5 shrink-0" />
            Открыть аналитику рынка
          </Link>
          <Link
            href={ROUTES.adminPlatformRevenue}
            className="inline-flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-[#B7F500]"
          >
            <Info className="size-3.5 shrink-0" />
            Открыть доход платформы
          </Link>
        </div>

        <AdminSectionTabBar tabs={[...TABS]} activeId={tab} onChange={(id) => setTab(id as MarketTab)} />

        <AdminSectionDataArea>
          {tab === "overview" ? (
            <div className="space-y-5">
              {summary?.topReleases.length ? (
                <div className={cn(ADMIN_SECTION_TILE, "space-y-3")}>
                  <h3 className="text-sm font-semibold text-zinc-100">Топ релизы по активности</h3>
                  <ul className="space-y-2 text-sm">
                    {summary.topReleases.map((r) => (
                      <li
                        key={r.releaseId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-900/35 px-3 py-2.5"
                      >
                        <span className="font-medium text-zinc-200">{r.releaseTitle}</span>
                        <span className="text-zinc-500">
                          {r.tradeCount} сделок ·{" "}
                          <span className="tabular-nums text-emerald-400">{formatUsdtAmount(r.volumeUsdt)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className={cn(ADMIN_SECTION_TILE, "py-8 text-center text-sm text-zinc-500")}>
                  Активных листингов пока нет
                </div>
              )}
              {volumeChartPoints.length ? (
                <AdminChartCard title={a.t("admin.kpi.market.volumeByDay")} empty={!volumeChartPoints.length}>
                  <AdminColumnChart
                    points={volumeChartPoints}
                    barColor="#B7F500"
                    barHoverColor="#9ECC00"
                    formatValue={(v) => formatUsdtAmount(String(v))}
                  />
                </AdminChartCard>
              ) : null}
            </div>
          ) : null}

          {tab === "listings" || tab === "cancelled" ? (
            <div className="space-y-4">
              <SectionTableTitle
                title={tab === "cancelled" ? "Замороженные / отменённые" : "Листинги"}
                total={listings.data.total}
              />
              {listings.loading ? (
                <p className="py-12 text-center text-sm text-zinc-500">Загрузка…</p>
              ) : listings.error ? (
                <AdminErrorState message={listings.error} onRetry={listings.reload} />
              ) : (
                <>
                  <AdminDataTable
                    flat
                    borderless
                    className={listingsTableClass}
                    columns={listingCols}
                    rows={listings.data.items}
                    rowKey={(r) => r.id}
                    emptyMessage={
                      tab === "cancelled"
                        ? "Замороженных и отменённых листингов нет"
                        : "Активных листингов пока нет"
                    }
                    onRowClick={openListing}
                  />
                  <AdminPagination
                    page={listings.query.page ?? 1}
                    pageSize={listings.query.pageSize ?? 20}
                    total={listings.data.total}
                    onPageChange={(p) => listings.setQuery({ page: p })}
                  />
                </>
              )}
            </div>
          ) : null}

          {tab === "trades" || tab === "suspicious" ? (
            <div className="space-y-4">
              <SectionTableTitle
                title={tab === "suspicious" ? "Подозрительные операции" : "Сделки"}
                total={trades.data.total}
              />
              {trades.loading ? (
                <p className="py-12 text-center text-sm text-zinc-500">Загрузка…</p>
              ) : trades.error ? (
                <AdminErrorState message={trades.error} onRetry={trades.reload} />
              ) : (
                <>
                  <AdminDataTable
                    flat
                    borderless
                    className={tradesTableClass}
                    columns={tradeCols}
                    rows={trades.data.items}
                    rowKey={(r) => r.id}
                    emptyMessage={tab === "suspicious" ? "Подозрительных сделок нет" : "Сделок пока нет"}
                    onRowClick={openTrade}
                  />
                  <AdminPagination
                    page={trades.query.page ?? 1}
                    pageSize={trades.query.pageSize ?? 20}
                    total={trades.data.total}
                    onPageChange={(p) => trades.setQuery({ page: p })}
                  />
                </>
              )}
            </div>
          ) : null}

          {tab === "liquidity" && liquidity ? (
            <div className="space-y-5">
              <AdminChartCard title={a.t("admin.kpi.market.volumeByDay")} empty={!volumeChartPoints.length}>
                <AdminLineChart
                  points={volumeChartPoints}
                  strokeColor="#B7F500"
                  formatValue={(v) => formatUsdtAmount(String(v))}
                />
              </AdminChartCard>
              <div className="space-y-4">
                <SectionTableTitle title="Активные листинги по релизам" total={liquidity.activeListingsByRelease.length} />
                <AdminDataTable
                  flat
                  borderless
                  className="[&_table]:min-w-[760px]"
                  columns={[
                    { key: "release", header: "Релиз", render: (r) => r.releaseTitle },
                    { key: "listings", header: "Листингов", render: (r) => r.listingCount },
                    { key: "listed", header: "Юнитов в продаже", render: (r) => r.unitsListed },
                    { key: "pct", header: "Доля в обращении", render: (r) => (r.listedPct != null ? `${r.listedPct}%` : "—") },
                    {
                      key: "avg",
                      header: "Ср. цена",
                      render: (r) => (r.avgPricePerUnitUsdt ? formatUsdtAmount(r.avgPricePerUnitUsdt) : "—"),
                    },
                  ]}
                  rows={liquidity.activeListingsByRelease}
                  rowKey={(r) => r.releaseId}
                  emptyMessage="Нет данных по ликвидности"
                />
              </div>
            </div>
          ) : null}

          {tab === "fees" && fees ? (
            <div className="space-y-5">
              <div className={cn(ADMIN_SECTION_TILE, "inline-flex min-w-[12rem] flex-col gap-2")}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Всего комиссий</p>
                <p className="text-2xl font-semibold tabular-nums text-emerald-400">
                  {formatUsdtAmount(fees.totalFeesUsdt)}
                </p>
              </div>
              <div className="space-y-4">
                <SectionTableTitle title="Комиссии по релизам" total={fees.byRelease.length} />
                <AdminDataTable
                  flat
                  borderless
                  className="[&_table]:min-w-[480px]"
                  columns={[
                    { key: "release", header: "Релиз", render: (r) => r.releaseTitle },
                    {
                      key: "fee",
                      header: a.table.fee,
                      render: (r) => (
                        <span className="tabular-nums text-emerald-400">{formatUsdtAmount(r.feeUsdt)}</span>
                      ),
                    },
                  ]}
                  rows={fees.byRelease}
                  rowKey={(r) => r.releaseId}
                  emptyMessage="Комиссий за период нет"
                />
              </div>
              <div className="space-y-4">
                <SectionTableTitle title="Транзакции комиссий" total={fees.transactions.length} />
                <AdminDataTable
                  flat
                  borderless
                  className="[&_table]:min-w-[520px]"
                  columns={[
                    {
                      key: "id",
                      header: a.t("admin.table.feeId"),
                      render: (r) => <span className="font-mono text-xs">{r.id.slice(0, 8)}…</span>,
                    },
                    {
                      key: "amount",
                      header: a.table.amount,
                      render: (r) => formatUsdtAmount(r.amountUsdt),
                    },
                    { key: "at", header: a.table.created, render: (r) => formatAdminDate(r.createdAt) },
                  ]}
                  rows={fees.transactions}
                  rowKey={(r) => r.id}
                  emptyMessage="Транзакций комиссий нет"
                />
              </div>
            </div>
          ) : null}
        </AdminSectionDataArea>
      </AdminSectionPanel>

      {actionError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      <AdminSecondaryMarketListingDrawer
        open={listingDrawerOpen}
        onOpenChange={setListingDrawerOpen}
        listing={listingDetail}
        loading={listingDetailLoading}
        canMutate={canMutate}
        onAction={handleListingAction}
      />

      <AdminSecondaryMarketTradeDrawer
        open={tradeDrawerOpen}
        onOpenChange={setTradeDrawerOpen}
        trade={tradeDetail}
        loading={tradeDetailLoading}
        canMutate={canMutate}
        onMarkSuspicious={handleMarkSuspicious}
      />
    </AdminSectionShell>
  );
}
