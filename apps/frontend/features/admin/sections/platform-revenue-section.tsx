"use client";

import * as React from "react";
import Link from "next/link";
import { Settings } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { Input } from "@/components/ui/input";
import { AdminStyledSelect } from "@/features/admin/ui/admin-styled-select";
import { Label } from "@/components/ui/label";
import { AdminAnalyticsExportButton } from "@/features/admin/analytics/components/admin-analytics-export-button";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminBarChart,
  AdminColumnChart,
  AdminDonutChart,
  AdminLineChart,
  AdminMultiLineChart,
} from "@/features/admin/analytics/components/admin-charts.lazy";
import { AdminChartCard } from "@/features/admin/analytics/components/admin-chart-card";
import { AdminMetricTrendCard } from "@/features/admin/analytics/components/admin-metric-trend-card";
import { AdminPeriodSelector } from "@/features/admin/analytics/components/admin-period-selector";
import { parseAnalyticsMoney, useAnalyticsPeriod } from "@/features/admin/analytics/hooks/use-analytics-period";
import { AdminPlatformRevenueDrawer } from "@/features/admin/components/admin-platform-revenue-drawer";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
  AdminSectionTabBar,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import { useAdminSectionTab } from "@/features/admin/hooks/use-admin-section-tab";
import {
  PLATFORM_REVENUE_FIELD_TOOLTIPS,
  PLATFORM_REVENUE_GROUP_OPTIONS,
  PLATFORM_REVENUE_CHART,
  PLATFORM_REVENUE_SOURCE_OPTIONS,
  platformRevenueSourceColor,
  platformRevenueSourceLabel,
} from "@/features/admin/lib/admin-platform-revenue-i18n";
import { formatAdminDate, formatAdminMetricUsdt, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import type {
  AdminPlatformRevenueTransaction,
  AdminPlatformRevenueTransactionDetail,
  PlatformFeeHistoryRow,
  PlatformFeeSettings,
  PlatformRevenuePeriodPoint,
  PlatformRevenueReleaseRow,
  PlatformRevenueSourceRow,
  PlatformRevenueSummary,
} from "@/features/admin/mocks/admin-platform-revenue.mock";
import {
  AdminConfirmDialog,
  AdminPhraseConfirmDialog,
  AdminDataTable,
  AdminFilterBar,
  AdminPagination,
  AdminLocalizedStatusBadge,
  AdminReadOnlyBanner,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import { DANGEROUS_ACTION_PHRASES } from "@/features/admin/config/admin-role-matrix";
import {
  getAdminPlatformFeeSettings,
  getAdminPlatformFeeSettingsHistory,
  getAdminPlatformRevenueByPeriod,
  getAdminPlatformRevenueByRelease,
  getAdminPlatformRevenueBySource,
  getAdminPlatformRevenueSummary,
  getAdminPlatformRevenueTransaction,
  listAdminPlatformRevenueTransactions,
  patchAdminPlatformFees,
  type PlatformRevenueQuery,
} from "@/services/admin/adminPlatformRevenue.service";

const TABS = [
  { id: "overview", label: "Обзор" },
  { id: "sources", label: "Источники дохода" },
  { id: "dynamics", label: "Динамика" },
  { id: "transactions", label: "Транзакции" },
  { id: "fees", label: "Комиссии" },
  { id: "releases", label: "Релизы и раунды" },
  { id: "export", label: "Экспорт" },
  { id: "settings", label: "Настройки комиссий" },
] as const;

type PlatformTab = (typeof TABS)[number]["id"];

export function PlatformRevenueSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const readOnly = perms.readOnly("Platform Revenue");
  const canEditFees = perms.canPatchPlatformFees();
  const { period, setPeriod, customFrom, customTo } = useAnalyticsPeriod("30d");
  const [tab, setTab] = useAdminSectionTab<PlatformTab>(
    TABS.map((t) => t.id),
    "overview",
  );

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [summary, setSummary] = React.useState<PlatformRevenueSummary | null>(null);
  const [bySource, setBySource] = React.useState<PlatformRevenueSourceRow[]>([]);
  const [periods, setPeriods] = React.useState<PlatformRevenuePeriodPoint[]>([]);
  const [releases, setReleases] = React.useState<PlatformRevenueReleaseRow[]>([]);
  const [transactions, setTransactions] = React.useState<AdminPlatformRevenueTransaction[]>([]);
  const [txTotal, setTxTotal] = React.useState(0);
  const [txPage, setTxPage] = React.useState(1);
  const [feeSettings, setFeeSettings] = React.useState<PlatformFeeSettings | null>(null);
  const [feeHistory, setFeeHistory] = React.useState<PlatformFeeHistoryRow[]>([]);

  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [groupBy, setGroupBy] = React.useState("day");
  const [txSearch, setTxSearch] = React.useState("");

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<AdminPlatformRevenueTransactionDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const [feeForm, setFeeForm] = React.useState({
    primaryPurchaseFeePct: "",
    withdrawalFeeUsdt: "",
    secondaryMarketFeePct: "",
  });
  const [feeConfirm, setFeeConfirm] = React.useState(false);
  const [feeSaving, setFeeSaving] = React.useState(false);

  const baseQuery = React.useMemo<PlatformRevenueQuery>(
    () => ({
      period,
      source: sourceFilter === "all" ? undefined : sourceFilter,
      groupBy: groupBy as PlatformRevenueQuery["groupBy"],
    }),
    [period, sourceFilter, groupBy],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [s, src, p, rel, tx, fees, hist] = await Promise.all([
        getAdminPlatformRevenueSummary(baseQuery, client),
        getAdminPlatformRevenueBySource(baseQuery, client),
        getAdminPlatformRevenueByPeriod(baseQuery, client),
        getAdminPlatformRevenueByRelease(baseQuery, client),
        listAdminPlatformRevenueTransactions(
          { ...baseQuery, page: txPage, pageSize: 20, search: txSearch || undefined },
          client,
        ),
        getAdminPlatformFeeSettings(client),
        getAdminPlatformFeeSettingsHistory(client),
      ]);
      setSummary(s);
      setBySource(src.items);
      setPeriods(p.items);
      setReleases(rel.items);
      setTransactions(tx.items);
      setTxTotal(tx.total);
      setFeeSettings(fees);
      setFeeHistory(hist.items);
      setFeeForm({
        primaryPurchaseFeePct: fees.primaryPurchaseFeePct,
        withdrawalFeeUsdt: fees.withdrawalFeeUsdt,
        secondaryMarketFeePct: fees.secondaryMarketFeePct,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [baseQuery, client, txPage, txSearch]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function openTx(row: AdminPlatformRevenueTransaction) {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetail({ ...row, rate: null, fixedAmount: null });
    try {
      const loaded = await getAdminPlatformRevenueTransaction(row.id, client);
      if (loaded) setDetail(loaded);
    } finally {
      setDetailLoading(false);
    }
  }

  async function saveFees() {
    setFeeSaving(true);
    try {
      await patchAdminPlatformFees(feeForm, client);
      setFeeConfirm(false);
      await load();
    } finally {
      setFeeSaving(false);
    }
  }

  const periodPoints = periods.map((p) => ({
    period: p.period,
    value:
      sourceFilter === "all"
        ? parseAnalyticsMoney(p.amountUsdt)
        : parseAnalyticsMoney(p.bySource?.[sourceFilter] ?? "0"),
  }));

  const trendSpark = periodPoints.map((p) => p.value);
  const formatChartValue = (v: number) => formatUsdtAmount(String(v));

  const sourceChartFilter = (
    <AdminStyledSelect
      size="sm"
      value={sourceFilter}
      options={PLATFORM_REVENUE_SOURCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
      onChange={setSourceFilter}
      aria-label={a.t("admin.ui.incomeSourceAria")}
      className="min-w-[220px] sm:min-w-[240px]"
    />
  );

  const sourceSeries = React.useMemo(() => {
    const keys = [...new Set(bySource.map((s) => s.source))];
    return keys.map((key) => ({
      key,
      label: platformRevenueSourceLabel(key),
      color: platformRevenueSourceColor(key),
      points: periods.map((p) => ({
        period: p.period,
        value: parseAnalyticsMoney(p.bySource?.[key] ?? "0"),
      })),
    }));
  }, [bySource, periods]);

  const txColumns: AdminColumn<AdminPlatformRevenueTransaction>[] = [
    {
      key: "id",
      header: a.table.id,
      render: (r) => (
        <span className="inline-flex items-center gap-1 font-mono text-[10px]">
          {r.id.slice(0, 10)}…
          <AdminCopyButton value={r.id} />
        </span>
      ),
    },
    {
      key: "at",
      header: a.table.created,
      render: (r) => formatAdminDate(r.createdAt),
    },
    {
      key: "source",
      header: "Источник",
      render: (r) => (
        <span style={{ color: platformRevenueSourceColor(r.source) }}>
          {platformRevenueSourceLabel(r.source)}
        </span>
      ),
    },
    {
      key: "amount",
      header: a.table.amount,
      render: (r) => <span className="tabular-nums font-medium">{formatUsdtAmount(r.amountUsdt)}</span>,
    },
    {
      key: "user",
      header: a.table.user,
      render: (r) => r.userEmail ?? "—",
    },
    {
      key: "release",
      header: "Релиз",
      render: (r) => r.releaseTitle ?? "—",
    },
    {
      key: "status",
      header: a.table.status,
      render: (txRow) => <AdminLocalizedStatusBadge status={txRow.status} tone="success" />,
    },
    {
      key: "open",
      header: "",
      render: (r) => (
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-lg border border-zinc-800 px-3 text-sm hover:bg-zinc-800/60"
          onClick={(e) => {
            e.stopPropagation();
            void openTx(r);
          }}
        >
          {a.actions.detail}
        </button>
      ),
    },
  ];

  const sourceTableColumns: AdminColumn<PlatformRevenueSourceRow>[] = [
    {
      key: "source",
      header: "Источник",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: platformRevenueSourceColor(r.source) }} />
          {platformRevenueSourceLabel(r.source)}
        </span>
      ),
    },
    { key: "amount", header: "Сумма", render: (r) => formatUsdtAmount(r.amountUsdt) },
    { key: "share", header: "Доля", render: (r) => `${r.sharePct}%` },
    { key: "ops", header: "Операций", render: (r) => r.operationCount },
    { key: "avg", header: "Средний чек", render: (r) => formatUsdtAmount(r.avgAmountUsdt) },
    {
      key: "delta",
      header: "Δ период",
      render: (r) =>
        r.deltaPct === null ? (
          "—"
        ) : (
          <span className={r.deltaPct >= 0 ? "text-emerald-700" : "text-rose-700"}>
            {r.deltaPct >= 0 ? "+" : ""}
            {r.deltaPct}%
          </span>
        ),
    },
  ];

  return (
    <AdminSectionShell
      sectionId="platformRevenue"
      title={a.adminSectionLabel("platformRevenue")}
      infoHint={
        <>
          Финансовый центр Spliton: комиссии первичных покупок, выводов и вторичного рынка. Данные из таблицы{" "}
          <code className="text-xs">fees</code> и wallet ledger.
        </>
      }
      actions={
        <>
          <AdminPeriodSelector value={period} onChange={setPeriod} />
          <AdminSectionRefreshButton onClick={() => void load()} />
        </>
      }
    >
      {readOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("platformRevenue")} /> : null}

      <AdminSectionPanel>
        <AdminFilterBar
          className="!rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
          fields={[
            {
              id: "source",
              label: "Источник",
              type: "select",
              value: sourceFilter,
              onChange: setSourceFilter,
              options: PLATFORM_REVENUE_SOURCE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            },
            {
              id: "groupBy",
              label: "Группировка",
              type: "select",
              value: groupBy,
              onChange: setGroupBy,
              options: PLATFORM_REVENUE_GROUP_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            },
            {
              id: "txSearch",
              label: "Поиск (транзакции)",
              type: "search",
              value: txSearch,
              onChange: setTxSearch,
              placeholder: "ID, email, релиз…",
            },
          ]}
        />

        <AdminSectionTabBar
          tabs={TABS.map((t) => ({
            id: t.id,
            label: t.label,
            count: t.id === "transactions" ? transactions.length : undefined,
          }))}
          activeId={tab}
          onChange={(id) => setTab(id as PlatformTab)}
        />

        <AdminSectionDataArea
          loading={loading && !summary}
          error={error}
          onRetry={() => void load()}
          loadingLabel="Загрузка дохода платформы…"
        >
          {tab === "overview" && summary ? (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AdminMetricTrendCard
                  label={a.t("admin.kpi.platformRevenue.totalIncome")}
                  value={formatUsdtAmount(summary.totalUsdt)}
                  tooltip={PLATFORM_REVENUE_FIELD_TOOLTIPS.totalRevenue}
                  trend={trendSpark}
                  href={ROUTES.adminAnalyticsFinance}
                />
                <AdminMetricTrendCard
                  label={a.t("admin.kpi.platformRevenue.forPeriod")}
                  value={formatUsdtAmount(summary.periodUsdt)}
                  deltaPct={summary.deltaPct}
                  tooltip={PLATFORM_REVENUE_FIELD_TOOLTIPS.periodRevenue}
                  trend={trendSpark}
                />
                <AdminMetricTrendCard
                  label={a.t("admin.kpi.platformRevenue.transactions")}
                  value={String(summary.transactionCount)}
                  tooltip="Количество комиссионных записей за период"
                />
                <AdminMetricTrendCard
                  label={a.t("admin.kpi.platformRevenue.avgFee")}
                  value={formatAdminMetricUsdt(summary.avgFeeUsdt)}
                  tooltip={PLATFORM_REVENUE_FIELD_TOOLTIPS.avgFee}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {summary.bySource.slice(0, 3).map((s) => (
                  <AdminMetricTrendCard
                    key={s.source}
                    label={platformRevenueSourceLabel(s.source)}
                    value={formatUsdtAmount(s.amountUsdt)}
                    deltaPct={s.deltaPct}
                    tooltip={PLATFORM_REVENUE_FIELD_TOOLTIPS.primaryFee}
                  />
                ))}
              </div>
              {summary.lastUpdatedAt ? (
                <p className="text-xs text-zinc-500">
                  Последнее обновление: {formatAdminDate(summary.lastUpdatedAt)}
                </p>
              ) : null}
              <div className="grid gap-6">
                <AdminChartCard
                  title={PLATFORM_REVENUE_CHART.incomeTrendTitle}
                  description={PLATFORM_REVENUE_CHART.incomeTrendDescription}
                  empty={!periodPoints.length}
                  headerAction={sourceChartFilter}
                >
                  <AdminLineChart
                    points={periodPoints}
                    strokeColor={PLATFORM_REVENUE_CHART.accent}
                    areaColor={PLATFORM_REVENUE_CHART.accent}
                    showArea
                    showPoints
                    formatValue={formatChartValue}
                  />
                </AdminChartCard>
                <AdminChartCard
                  title={PLATFORM_REVENUE_CHART.incomeByDayTitle}
                  description={PLATFORM_REVENUE_CHART.incomeByDayDescription}
                  empty={!periodPoints.length}
                >
                  <AdminColumnChart
                    points={periodPoints}
                    barColor={PLATFORM_REVENUE_CHART.accent}
                    barHoverColor={PLATFORM_REVENUE_CHART.accentHover}
                    formatValue={formatChartValue}
                  />
                </AdminChartCard>
              </div>
            </div>
          ) : null}

          {tab === "sources" ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <AdminChartCard title={a.t("admin.kpi.platformRevenue.shareBySource")} empty={!bySource.length}>
                <AdminDonutChart
                  items={bySource.map((s) => ({
                    label: platformRevenueSourceLabel(s.source),
                    value: parseAnalyticsMoney(s.amountUsdt),
                    color: platformRevenueSourceColor(s.source),
                  }))}
                  formatValue={(v) => formatUsdtAmount(String(v))}
                />
              </AdminChartCard>
              <AdminChartCard title={a.t("admin.kpi.platformRevenue.sourceComparison")} empty={!bySource.length}>
                <AdminBarChart
                  items={bySource.map((s) => ({
                    label: platformRevenueSourceLabel(s.source),
                    value: parseAnalyticsMoney(s.amountUsdt),
                    color: platformRevenueSourceColor(s.source),
                  }))}
                  formatValue={(v) => formatUsdtAmount(String(v))}
                />
              </AdminChartCard>
              <div className="xl:col-span-2">
                <AdminDataTable flat columns={sourceTableColumns} rows={bySource} rowKey={(r) => r.source} />
              </div>
            </div>
          ) : null}

          {tab === "dynamics" ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <AdminChartCard
                title={PLATFORM_REVENUE_CHART.incomeTrendTitle}
                description={PLATFORM_REVENUE_CHART.incomeTrendDescription}
                empty={!periodPoints.length}
                headerAction={sourceChartFilter}
              >
                <AdminLineChart
                  points={periodPoints}
                  strokeColor={PLATFORM_REVENUE_CHART.accent}
                  areaColor={PLATFORM_REVENUE_CHART.accent}
                  showArea
                  showPoints
                  formatValue={formatChartValue}
                />
              </AdminChartCard>
              <AdminChartCard
                title={PLATFORM_REVENUE_CHART.incomeByDayTitle}
                description={PLATFORM_REVENUE_CHART.incomeByDayDescription}
                empty={!periodPoints.length}
              >
                <AdminColumnChart
                  points={periodPoints}
                  barColor={PLATFORM_REVENUE_CHART.accent}
                  barHoverColor={PLATFORM_REVENUE_CHART.accentHover}
                  formatValue={formatChartValue}
                />
              </AdminChartCard>
              <div className="xl:col-span-2">
                <AdminChartCard title={a.t("admin.kpi.platformRevenue.bySources")} empty={!sourceSeries.some((s) => s.points.some((p) => p.value > 0))}>
                  <AdminMultiLineChart series={sourceSeries} formatValue={formatChartValue} />
                </AdminChartCard>
              </div>
            </div>
          ) : null}

          {tab === "transactions" ? (
            <>
              <AdminDataTable
                flat
                columns={txColumns}
                rows={transactions}
                rowKey={(r) => r.id}
                onRowClick={(r) => void openTx(r)}
                emptyMessage={
                  !loading && transactions.length === 0
                    ? "Комиссий платформы за период пока нет"
                    : a.empty.noData
                }
              />
              <AdminPagination page={txPage} pageSize={20} total={txTotal} onPageChange={setTxPage} />
            </>
          ) : null}

          {tab === "fees" && feeSettings ? (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label={a.t("admin.platformRevenue.primaryPurchase")} value={`${feeSettings.primaryPurchaseFeePct}%`} />
                <Metric label={a.t("admin.ledger.withdrawal_fee")} value={formatUsdtAmount(feeSettings.withdrawalFeeUsdt)} />
                <Metric label={a.t("admin.platformRevenue.secondaryMarket")} value={`${feeSettings.secondaryMarketFeePct}%`} />
                <Metric label="Premium / мес." value={formatUsdtAmount(feeSettings.premiumMonthlyUsdt)} />
              </div>
              <p className="text-xs text-zinc-500">
                Effective from: {formatAdminDate(feeSettings.effectiveFrom)}
                {feeSettings.updatedByEmail ? ` · ${feeSettings.updatedByEmail}` : null}
              </p>
              <AdminDataTable
                flat
                rowKey={(r) => r.id}
                columns={[
                  { key: "from", header: "С", render: (r) => formatAdminDate(r.effectiveFrom) },
                  { key: "primary", header: a.t("admin.table.primaryPct"), render: (r) => r.primaryPurchaseFeePct },
                  { key: "wd", header: a.t("admin.ledger.withdrawal_fee"), render: (r) => formatUsdtAmount(r.withdrawalFeeUsdt) },
                  { key: "sec", header: a.t("admin.table.secondaryPct"), render: (r) => r.secondaryMarketFeePct },
                  {
                    key: "by",
                    header: "Кто",
                    render: (r) => r.updatedByEmail ?? r.createdByEmail ?? "—",
                  },
                  {
                    key: "active",
                    header: "Статус",
                    render: (r) => (
                      <AdminStatusBadge label={r.isActive ? "Активно" : "Архив"} tone={r.isActive ? "success" : "neutral"} />
                    ),
                  },
                ]}
                rows={feeHistory}
              />
              <Link href={ROUTES.adminAudit} className="text-sm text-sky-700 hover:underline">
                Журнал изменений комиссий →
              </Link>
            </div>
          ) : null}

          {tab === "releases" ? (
            <div className="space-y-6">
              <AdminChartCard title={a.t("admin.platformRevenue.topByRevenue")} empty={!releases.length}>
                <AdminBarChart
                  items={releases.slice(0, 8).map((r) => ({
                    label: r.releaseTitle,
                    value: parseAnalyticsMoney(r.totalFeeUsdt),
                    color: platformRevenueSourceColor("primary_purchase_fee"),
                  }))}
                  formatValue={(v) => formatUsdtAmount(String(v))}
                />
              </AdminChartCard>
              <AdminDataTable
                flat
                rowKey={(r) => r.releaseId}
                columns={[
                  { key: "release", header: "Релиз", render: (r) => r.releaseTitle },
                  { key: "artist", header: "Артист", render: (r) => r.artistName ?? "—" },
                  { key: "primary", header: a.t("admin.table.primaryFee"), render: (r) => formatUsdtAmount(r.primaryFeeUsdt) },
                  { key: "secondary", header: a.t("admin.table.secondaryFee"), render: (r) => formatUsdtAmount(r.secondaryFeeUsdt) },
                  { key: "total", header: a.table.total, render: (r) => formatUsdtAmount(r.totalFeeUsdt) },
                  { key: "buys", header: "Покупок", render: (r) => r.purchaseCount },
                  { key: "trades", header: "Сделок", render: (r) => r.tradeCount },
                ]}
                rows={releases}
              />
            </div>
          ) : null}

          {tab === "export" ? (
            <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-50/50 p-6">
              <p className="text-sm text-zinc-400">
                Экспорт через async report jobs — без синхронной нагрузки на frontend.
              </p>
              <div className="flex flex-wrap gap-2">
                <AdminAnalyticsExportButton
                  reportType="platform_revenue_transactions"
                  period={period}
                  customFrom={customFrom}
                  customTo={customTo}
                />
                <AdminAnalyticsExportButton
                  reportType="platform_revenue"
                  label={a.t("admin.ui.csvSummary")}
                  period={period}
                  customFrom={customFrom}
                  customTo={customTo}
                />
              </div>
              <Link href={ROUTES.adminReports} className="inline-block text-sm text-sky-700 hover:underline">
                Открыть раздел «Отчёты» →
              </Link>
            </div>
          ) : null}

          {tab === "settings" && feeSettings ? (
            <div className="space-y-4 max-w-lg">
              <p className="text-sm text-zinc-400">
                Редактирование доступно только SUPER_ADMIN. Изменения пишутся в audit log.
              </p>
              <div>
                <Label htmlFor="primary-fee">Primary purchase fee (%)</Label>
                <Input
                  id="primary-fee"
                  value={feeForm.primaryPurchaseFeePct}
                  onChange={(e) => setFeeForm({ ...feeForm, primaryPurchaseFeePct: e.target.value })}
                  disabled={!canEditFees}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="wd-fee">Withdrawal fee (USDT)</Label>
                <Input
                  id="wd-fee"
                  value={feeForm.withdrawalFeeUsdt}
                  onChange={(e) => setFeeForm({ ...feeForm, withdrawalFeeUsdt: e.target.value })}
                  disabled={!canEditFees}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sec-fee">Secondary market fee (%)</Label>
                <Input
                  id="sec-fee"
                  value={feeForm.secondaryMarketFeePct}
                  onChange={(e) => setFeeForm({ ...feeForm, secondaryMarketFeePct: e.target.value })}
                  disabled={!canEditFees}
                  className="mt-1"
                />
              </div>
              {canEditFees ? (
                <Button type="button" size="sm" onClick={() => setFeeConfirm(true)}>
                  Сохранить комиссии
                </Button>
              ) : (
                <Link href={ROUTES.adminSettings}>
                  <Button type="button" size="sm" variant="ghost" className={adminBtnOutline}>
                    <Settings className="mr-1.5 size-3.5" />
                    Открыть настройки
                  </Button>
                </Link>
              )}
            </div>
          ) : null}
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminPlatformRevenueDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        tx={detail}
        loading={detailLoading}
      />

      <AdminPhraseConfirmDialog
        open={feeConfirm}
        onOpenChange={setFeeConfirm}
        title={a.t("admin.kpi.platformRevenue.updateFeesTitle")}
        description="Новые значения вступят в силу немедленно. Действие записывается в журнал аудита."
        confirmPhrase={DANGEROUS_ACTION_PHRASES.platformFees}
        confirmLabel="Сохранить"
        onConfirm={() => void saveFees()}
      />
    </AdminSectionShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
