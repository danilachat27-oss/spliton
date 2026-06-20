"use client";

import * as React from "react";
import Link from "next/link";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  ChevronDown,
  CircleDollarSign,
  FileChartColumn,
  Handshake,
  Music2,
  Store,
  Users,
  Wallet,
} from "@/lib/lucide";
import type { LucideIcon } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { AdminSectionRefreshButton } from "@/features/admin/components/admin-section-layout";
import { ROUTES } from "@/constants/routes";
import { AdminMultiLineChart } from "@/features/admin/analytics/components/admin-charts.lazy";
import { AdminPeriodSelector } from "@/features/admin/analytics/components/admin-period-selector";
import { AdminKpiTooltip } from "@/features/admin/analytics/components/admin-kpi-tooltip";
import {
  countPointsToValues,
  moneyPointsToValues,
} from "@/features/admin/analytics/hooks/use-analytics-period";
import { buildLinePath } from "@/lib/analytics/chart-path";
import type { AnalyticsDashboardTrends, AnalyticsPeriodKey } from "@/features/admin/analytics/types";
import type { AdminDashboardAlert } from "@/features/admin/mocks/admin-dashboard.mock";
import type { AdminRecentAction } from "@/features/admin/mocks/admin-dashboard.mock";
import type { AdminDashboardKpis } from "@/features/admin/mocks/admin-dashboard.mock";
import type { AdminDepositListItem } from "@/features/admin/mocks/admin-finance.mock";
import type { AdminWithdrawalListItem } from "@/features/admin/mocks/admin-finance.mock";
import { formatUsdtAmount } from "@/features/admin/lib/admin-format";
import {
  AdminDataTable,
  AdminLocalizedStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import {
  DASHBOARD_BY_PERSONA,
  type DashboardLayout,
} from "@/features/admin/config/admin-dashboard-layout";
import type { DashboardPersona } from "@/features/admin/config/admin-rbac";
import { adminCountBadgeActive, adminEyebrow, adminPanel, adminTile } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";
function hasPositiveUsdt(value: string): boolean {
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0;
}

type TaskItem = { id: string; label: string; count: number; href: string };

const TASKS_PREVIEW_LIMIT = 5;

function TasksQueueList({
  tasks,
  emptyLabel,
  showMoreLabel,
  showLessLabel,
}: {
  tasks: TaskItem[];
  emptyLabel: string;
  showMoreLabel: (hiddenCount: number) => string;
  showLessLabel: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const sortedTasks = React.useMemo(
    () => [...tasks].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ru")),
    [tasks],
  );

  const hiddenCount = Math.max(sortedTasks.length - TASKS_PREVIEW_LIMIT, 0);
  const visibleTasks = expanded ? sortedTasks : sortedTasks.slice(0, TASKS_PREVIEW_LIMIT);

  if (tasks.length === 0) {
    return (
      <li className={cn(adminTile, "text-center text-sm text-zinc-500")}>{emptyLabel}</li>
    );
  }

  return (
    <>
      {visibleTasks.map((task) => (
        <li key={task.id}>
          <Link
            href={task.href}
            className={cn(adminTile, "flex items-center justify-between gap-3 transition-colors hover:bg-zinc-800/50")}
          >
            <span className="min-w-0 text-sm text-zinc-200">{task.label}</span>
            <span className={cn("shrink-0 text-xs font-semibold tabular-nums", adminCountBadgeActive)}>
              {task.count}
            </span>
          </Link>
        </li>
      ))}
      {hiddenCount > 0 ? (
        <li>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900/40 px-3 py-2.5 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200"
          >
            {expanded ? showLessLabel : showMoreLabel(hiddenCount)}
            <ChevronDown
              className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
              aria-hidden
            />
          </button>
        </li>
      ) : null}
    </>
  );
}

type AdminDashboardOverviewProps = {
  title: string;
  persona: DashboardPersona;
  period: AnalyticsPeriodKey;
  onPeriodChange: (p: AnalyticsPeriodKey) => void;
  customFrom?: string;
  customTo?: string;
  onCustomDatesChange?: (from: string, to: string) => void;
  onRefresh: () => void;
  kpis: AdminDashboardKpis;
  trends: AnalyticsDashboardTrends | null;
  tasks: TaskItem[];
  alerts: AdminDashboardAlert[];
  actions: AdminRecentAction[];
  deposits: AdminDepositListItem[];
  withdrawals: AdminWithdrawalListItem[];
};

type QuickAction = { labelKey: string; descKey: string; href: string; icon: LucideIcon };

const QUICK_ACTION_DEFS: Array<QuickAction & { href: string }> = [
  { labelKey: "admin.dashboard.quick.withdrawals", descKey: "admin.dashboard.quick.withdrawalsDesc", href: ROUTES.adminWithdrawals, icon: ArrowUpFromLine },
  { labelKey: "admin.dashboard.quick.deposits", descKey: "admin.dashboard.quick.depositsDesc", href: ROUTES.adminDeposits, icon: ArrowDownToLine },
  { labelKey: "admin.dashboard.quick.tracks", descKey: "admin.dashboard.quick.tracksDesc", href: ROUTES.adminTracks, icon: Music2 },
  { labelKey: "admin.dashboard.quick.revenue", descKey: "admin.dashboard.quick.revenueDesc", href: ROUTES.adminRevenue, icon: CircleDollarSign },
  { labelKey: "admin.dashboard.quick.risk", descKey: "admin.dashboard.quick.riskDesc", href: ROUTES.adminCompliance, icon: AlertTriangle },
  { labelKey: "admin.dashboard.quick.reports", descKey: "admin.dashboard.quick.reportsDesc", href: ROUTES.adminReports, icon: FileChartColumn },
];

function SectionIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className={adminEyebrow}>{eyebrow}</p>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100 sm:text-xl">{title}</h2>
        {description ? <p className="max-w-2xl text-sm text-zinc-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function StatTile({
  label,
  value,
  href,
  tooltip,
  deltaPct,
  trend,
  valueTone,
  deltaLabelTemplate,
}: {
  label: string;
  value: string;
  href?: string;
  tooltip?: string;
  deltaPct?: number | null;
  trend?: number[];
  valueTone?: string;
  deltaLabelTemplate: string;
}) {
  const deltaLabel =
    deltaPct === null || deltaPct === undefined
      ? null
      : deltaLabelTemplate.replace(
          "{pct}",
          `${deltaPct >= 0 ? "+" : ""}${deltaPct.toLocaleString("ru-RU")}`,
        );

  const spark =
    trend && trend.length >= 2
      ? buildLinePath(trend, 56, 22, 0, 2, { min: Math.min(...trend), max: Math.max(...trend) })
      : null;

  const inner = (
    <div className={cn(adminTile, "flex h-full flex-col", href && "transition-colors hover:bg-zinc-800/50")}>
      <div className="flex min-h-10 items-start justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {label}
          {tooltip ? <AdminKpiTooltip text={tooltip} /> : null}
        </p>
        {spark ? (
          <svg viewBox="0 0 56 22" className="h-5 w-14 shrink-0 opacity-60" aria-hidden>
            <polyline points={spark} fill="none" stroke="#B7F500" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <span className="h-5 w-14 shrink-0" aria-hidden />
        )}
      </div>
      <p
        className={cn(
          "mt-3 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl",
          valueTone ?? "text-zinc-100",
        )}
      >
        {value}
      </p>
      {deltaLabel ? (
        <p
          className={cn(
            "mt-2 text-xs font-medium tabular-nums",
            (deltaPct ?? 0) >= 0 ? "text-[#B7F500]" : "text-zinc-400",
          )}
        >
          {deltaLabel}
        </p>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F500]/25 rounded-2xl">
        {inner}
      </Link>
    );
  }
  return inner;
}

function PriorityTile({
  label,
  value,
  href,
  tone = "neutral",
  openLabel,
}: {
  label: string;
  value: string;
  href: string;
  tone?: "neutral" | "warning" | "danger" | "accent";
  openLabel: string;
}) {
  const hasAttention =
    tone === "warning" || tone === "danger"
      ? value.includes("USDT")
        ? hasPositiveUsdt(value)
        : Number.isFinite(Number(value.replace(/\s/g, ""))) && Number(value.replace(/\s/g, "")) > 0
      : false;
  const forceAccent =
    tone === "accent" &&
    (value.includes("USDT")
      ? hasPositiveUsdt(value)
      : Number.isFinite(Number(value.replace(/\s/g, ""))) && Number(value.replace(/\s/g, "")) > 0);

  const valueTone = forceAccent
    ? "text-sky-400"
    : !hasAttention
      ? "text-zinc-100"
      : tone === "danger"
        ? "text-rose-400"
        : tone === "warning"
          ? "text-amber-400"
          : "text-zinc-100";

  return (
    <Link
      href={href}
      className={cn(adminTile, "group block h-full min-w-0 transition-colors hover:bg-zinc-800/50")}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className={cn("mt-2 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl", valueTone)}>
        {value}
      </p>
      <span className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-semibold text-zinc-500 group-hover:text-zinc-200">
        {openLabel}
        <ChevronRight className="size-3" aria-hidden />
      </span>
    </Link>
  );
}

function alertSurface(level: AdminDashboardAlert["level"]) {
  if (level === "danger") return "bg-rose-50/90 text-rose-950";
  if (level === "warning") return "bg-amber-50/90 text-amber-950";
  return "bg-sky-50/80 text-sky-950";
}

const PRIORITY_TILE_KEYS = {
  withdrawals: {
    labelKey: "admin.dashboard.priority.withdrawals",
    value: (kpis: AdminDashboardKpis) => formatUsdtAmount(kpis.pendingWithdrawalsUsdt),
    href: `${ROUTES.adminWithdrawals}?status=requested`,
    tone: (kpis: AdminDashboardKpis): "neutral" | "warning" | "danger" | "accent" =>
      hasPositiveUsdt(kpis.pendingWithdrawalsUsdt) ? "warning" : "neutral",
  },
  risk: {
    labelKey: "admin.dashboard.priority.risk",
    value: (kpis: AdminDashboardKpis) => String(kpis.openRiskFlags ?? 0),
    href: ROUTES.adminCompliance,
    tone: (kpis: AdminDashboardKpis): "neutral" | "warning" | "danger" | "accent" =>
      (kpis.openRiskFlags ?? 0) > 0 ? "danger" : "neutral",
  },
  support: {
    labelKey: "admin.dashboard.priority.support",
    value: (kpis: AdminDashboardKpis) => String(kpis.openSupportTickets ?? 0),
    href: ROUTES.adminSupport,
    tone: (kpis: AdminDashboardKpis): "neutral" | "warning" | "danger" | "accent" =>
      (kpis.openSupportTickets ?? 0) > 0 ? "warning" : "neutral",
  },
  listings: {
    labelKey: "admin.dashboard.priority.listings",
    value: (kpis: AdminDashboardKpis) => String(kpis.activeListings),
    href: ROUTES.adminSecondaryMarket,
    tone: (): "accent" => "accent",
  },
} as const;

export function AdminDashboardOverview({
  title,
  persona,
  period,
  onPeriodChange,
  customFrom,
  customTo,
  onCustomDatesChange,
  onRefresh,
  kpis,
  trends,
  tasks,
  alerts,
  actions,
  deposits,
  withdrawals,
}: AdminDashboardOverviewProps) {
  const a = useAdminI18n();
  const layout: DashboardLayout = DASHBOARD_BY_PERSONA[persona];
  const quickActions = QUICK_ACTION_DEFS.filter((item) => layout.quickActionHrefs.includes(item.href));
  const deltaLabelTemplate = a.t("admin.dashboard.deltaVsPrev");
  const priorityOpenLabel = a.t("admin.dashboard.priority.open");
  const depositCols: AdminColumn<AdminDepositListItem>[] = [
    { key: "id", header: a.table.id, render: (r) => <span className="font-mono text-xs">{r.id.slice(0, 8)}</span> },
    { key: "user", header: a.table.user, render: (r) => r.userEmail },
    { key: "amt", header: a.table.amount, render: (r) => formatUsdtAmount(r.amountUsdt) },
    {
      key: "st",
      header: a.table.status,
      render: (r) => {
        const { status: rowStatus } = r;
        return <AdminLocalizedStatusBadge status={rowStatus} domain="deposit" />;
      },
    },
  ];

  const wdCols: AdminColumn<AdminWithdrawalListItem>[] = [
    { key: "id", header: a.table.id, render: (r) => <span className="font-mono text-xs">{r.id.slice(0, 8)}</span> },
    { key: "user", header: a.table.user, render: (r) => r.userEmail },
    { key: "amt", header: a.table.amount, render: (r) => formatUsdtAmount(r.amountUsdt) },
    {
      key: "st",
      header: a.table.status,
      render: (r) => {
        const { status: rowStatus } = r;
        return <AdminLocalizedStatusBadge status={rowStatus} domain="withdrawal" />;
      },
    },
  ];

  const taskTotal = tasks.reduce((s, t) => s + t.count, 0);

  return (
    <div className="space-y-8 pb-6 sm:space-y-10">
      <header className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-[1.75rem]">{title}</h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <AdminPeriodSelector
              value={period}
              onChange={onPeriodChange}
              customFrom={customFrom}
              customTo={customTo}
              onCustomDatesChange={onCustomDatesChange}
            />
            {layout.showAnalyticsButton ? (
              <Link href={ROUTES.adminAnalytics}>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 rounded-lg bg-zinc-900/80 px-4 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                >
                  {a.t("admin.dashboard.analytics")}
                </Button>
              </Link>
            ) : null}
            <AdminSectionRefreshButton onClick={onRefresh} variant="primary" />
          </div>
        </div>

        <section className={cn(adminPanel, "space-y-5")}>
          <div className="flex items-center justify-between gap-3">
            <p className={adminEyebrow}>{a.t("admin.dashboard.attention.eyebrow")}</p>
            {taskTotal > 0 ? (
              <span className={cn("shrink-0 text-[11px] font-semibold", adminCountBadgeActive)}>
                {a.t("admin.dashboard.attention.inQueue").replace("{count}", String(taskTotal))}
              </span>
            ) : (
              <span className="shrink-0 text-xs text-zinc-500">{a.t("admin.dashboard.attention.queuesEmpty")}</span>
            )}
          </div>
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {layout.priorityTiles.map((key) => {
              const tile = PRIORITY_TILE_KEYS[key];
              return (
                <PriorityTile
                  key={key}
                  label={a.t(tile.labelKey)}
                  value={tile.value(kpis)}
                  href={tile.href}
                  tone={tile.tone(kpis)}
                  openLabel={priorityOpenLabel}
                />
              );
            })}
          </div>
        </section>
      </header>

      {layout.showUsersSection ? (
      <section className={cn(adminPanel, "space-y-5")}>
        <SectionIntro eyebrow={a.t("admin.dashboard.audience.eyebrow")} title={a.t("admin.section.users")} description={a.t("admin.dashboard.audience.desc")} />
        <div className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label={a.t("admin.analytics.metric.totalUsers")}
            value={String(kpis.totalUsers)}
            tooltip={a.t("admin.dashboard.kpi.totalUsersTooltip")}
            href={ROUTES.adminUsers}
            trend={trends?.newUsers ? countPointsToValues(trends.newUsers).map((p) => p.value) : []}
            deltaLabelTemplate={deltaLabelTemplate}
          />
          <StatTile label={a.t("admin.analytics.metric.active")} value={String(kpis.activeUsers)} href={ROUTES.adminAnalyticsUsers} deltaLabelTemplate={deltaLabelTemplate} />
          <StatTile
            label={a.t("admin.analytics.metric.newInPeriod")}
            value={String(kpis.newUsers ?? 0)}
            deltaPct={kpis.deltas?.newUsersPct}
            href={ROUTES.adminAnalyticsUsers}
            deltaLabelTemplate={deltaLabelTemplate}
          />
          <StatTile
            label={a.t("admin.analytics.finance.availableBalance")}
            value={formatUsdtAmount(kpis.availableBalanceUsdt ?? "0")}
            href={ROUTES.adminWallets}
            deltaLabelTemplate={deltaLabelTemplate}
          />
        </div>
      </section>
      ) : null}

      {layout.showFinanceSection ? (
      <section className={cn(adminPanel, "space-y-5")}>
        <SectionIntro
          eyebrow={a.t("admin.dashboard.treasury.eyebrow")}
          title={a.t("admin.dashboard.treasury.title")}
          description={a.t("admin.dashboard.treasury.desc")}
        />
        <div className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label={a.t("admin.analytics.operations.kpi.deposits")}
            value={formatUsdtAmount(kpis.totalDepositsUsdt)}
            deltaPct={kpis.deltas?.depositsPct}
            href={ROUTES.adminDeposits}
            trend={trends?.deposits ? moneyPointsToValues(trends.deposits).map((p) => p.value) : []}
            valueTone="text-blue-800"
            deltaLabelTemplate={deltaLabelTemplate}
          />
          <StatTile
            label={a.t("admin.analytics.operations.kpi.withdrawals")}
            value={formatUsdtAmount(kpis.totalWithdrawalsUsdt ?? "0")}
            deltaPct={kpis.deltas?.withdrawalsPct}
            href={ROUTES.adminWithdrawals}
            deltaLabelTemplate={deltaLabelTemplate}
          />
          <StatTile
            label={a.t("admin.analytics.finance.locked")}
            value={formatUsdtAmount(kpis.lockedBalanceUsdt ?? "0")}
            tooltip={a.t("admin.dashboard.kpi.lockedTooltip")}
            deltaLabelTemplate={deltaLabelTemplate}
          />
          <StatTile
            label={a.t("admin.analytics.metric.holderPayouts")}
            value={formatUsdtAmount(kpis.totalPayoutsUsdt)}
            href={ROUTES.adminRevenue}
            deltaLabelTemplate={deltaLabelTemplate}
          />
        </div>
      </section>
      ) : null}

      {layout.showContentSection ? (
      <section className={cn(adminPanel, "space-y-5")}>
        <SectionIntro eyebrow={a.t("admin.dashboard.contentMarket.eyebrow")} title={a.t("admin.dashboard.contentMarket.title")} />
        <div className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label={a.t("admin.analytics.tracks.kpi.published")} value={String(kpis.totalTracks)} href={ROUTES.adminTracks} deltaLabelTemplate={deltaLabelTemplate} />
          <StatTile label={a.t("admin.analytics.tracks.kpi.liveRounds")} value={String(kpis.activeRounds)} href={ROUTES.adminRounds} deltaLabelTemplate={deltaLabelTemplate} />
          <StatTile label={a.t("admin.analytics.market.trades")} value={String(kpis.completedTrades)} href={ROUTES.adminAnalyticsMarket} deltaLabelTemplate={deltaLabelTemplate} />
          <StatTile
            label={a.t("admin.analytics.tracks.platformRevenue")}
            value={formatUsdtAmount(kpis.platformRevenueUsdt)}
            href={ROUTES.adminPlatformRevenue}
            valueTone="text-blue-800"
            deltaLabelTemplate={deltaLabelTemplate}
          />
        </div>
      </section>
      ) : null}

      {layout.showTrends && trends ? (
        <section className={cn(adminPanel, "space-y-6")}>
          <SectionIntro eyebrow={a.t("admin.dashboard.trends.eyebrow")} title={a.t("admin.dashboard.trends.title")} />
          <div className="grid gap-4 xl:grid-cols-2">
            {[
              {
                title: a.t("admin.dashboard.trends.depositsWithdrawals"),
                href: ROUTES.adminAnalyticsFinance,
                empty: !trends.deposits.length && !trends.withdrawals.length,
                chart: (
                  <AdminMultiLineChart
                    series={[
                      { key: "dep", label: a.t("admin.dashboard.trends.deposits"), color: "#059669", points: moneyPointsToValues(trends.deposits) },
                      { key: "wd", label: a.t("admin.dashboard.trends.withdrawals"), color: "#e11d48", points: moneyPointsToValues(trends.withdrawals) },
                    ]}
                  />
                ),
              },
              {
                title: a.t("admin.dashboard.trends.platformRevenue"),
                href: ROUTES.adminPlatformRevenue,
                empty: !trends.platformRevenue.length,
                chart: (
                  <AdminMultiLineChart
                    series={[{ key: "rev", label: a.t("admin.dashboard.trends.revenue"), color: "#171717", points: moneyPointsToValues(trends.platformRevenue) }]}
                  />
                ),
              },
              {
                title: a.t("admin.dashboard.trends.newUsers"),
                href: ROUTES.adminAnalyticsUsers,
                empty: !trends.newUsers.length,
                chart: (
                  <AdminMultiLineChart
                    series={[{ key: "users", label: a.t("admin.dashboard.trends.newUsersShort"), color: "#2563eb", points: countPointsToValues(trends.newUsers) }]}
                  />
                ),
              },
              {
                title: a.t("admin.dashboard.trends.riskSupport"),
                href: ROUTES.adminAnalyticsRisk,
                empty: !trends.riskFlags.length && !trends.supportTickets.length,
                chart: (
                  <AdminMultiLineChart
                    series={[
                      { key: "risk", label: a.t("admin.dashboard.trends.riskFlags"), color: "#dc2626", points: countPointsToValues(trends.riskFlags) },
                      { key: "support", label: a.t("admin.dashboard.trends.tickets"), color: "#d97706", points: countPointsToValues(trends.supportTickets) },
                    ]}
                  />
                ),
              },
            ].map((block) => (
              <div key={block.title} className={cn(adminTile, "space-y-4")}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-zinc-100">{block.title}</h3>
                  <Link href={block.href} className="shrink-0 text-xs font-semibold text-zinc-500 hover:text-zinc-100">
                    {a.actions.detail}
                  </Link>
                </div>
                {block.empty ? (
                  <p className="py-8 text-center text-sm text-zinc-500">{a.t("admin.dashboard.trends.noData")}</p>
                ) : (
                  block.chart
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {layout.showTasks || layout.showAlerts ? (
      <div className="grid gap-6 lg:grid-cols-12">
        {layout.showTasks ? (
        <section className={cn(adminPanel, "space-y-4 lg:col-span-4")}>
          <SectionIntro
            eyebrow={a.t("admin.dashboard.tasks.queueEyebrow")}
            title={a.t("admin.dashboard.tasks.title")}
            action={
              <Link href={ROUTES.adminOperatorTasks} className="text-xs font-semibold text-zinc-500 hover:text-zinc-100">
                {a.t("admin.dashboard.tasks.allTasks")}
              </Link>
            }
          />
          <ul className="space-y-2">
            <TasksQueueList
              tasks={tasks}
              emptyLabel={a.t("admin.dashboard.tasks.none")}
              showMoreLabel={(count) =>
                a.t("admin.dashboard.tasks.showMore").replace("{count}", String(count))
              }
              showLessLabel={a.t("admin.dashboard.tasks.showLess")}
            />
          </ul>
        </section>
        ) : null}

        {layout.showAlerts ? (
        <section className={cn(adminPanel, "space-y-4", layout.showTasks ? "lg:col-span-8" : "lg:col-span-12")}>
          <SectionIntro eyebrow={a.t("admin.dashboard.risk.eyebrow")} title={a.t("admin.dashboard.risk.signals")} />
          <ul className="space-y-2">
            {alerts.length === 0 ? (
              <li className={cn(adminTile, "text-center text-sm text-zinc-500")}>{a.t("admin.dashboard.alerts.none")}</li>
            ) : (
              alerts.map((a) => (
                <li
                  key={a.id}
                  className={cn(adminTile, "flex items-start justify-between gap-3 text-sm", alertSurface(a.level))}
                >
                  <span>{a.message}</span>
                  <AdminLocalizedStatusBadge
                    status={a.level}
                    tone={a.level === "danger" ? "danger" : a.level === "warning" ? "warning" : "info"}
                  />
                </li>
              ))
            )}
          </ul>
        </section>
        ) : null}
      </div>
      ) : null}

      {layout.showQuickActions && quickActions.length > 0 ? (
      <section className={cn(adminPanel, "space-y-5")}>
        <SectionIntro eyebrow={a.t("admin.dashboard.actions.eyebrow")} title={a.t("admin.dashboard.actions.quickNav")} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(adminTile, "group flex items-start gap-3 transition-colors hover:bg-zinc-800/50")}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-zinc-900/80 text-zinc-300">
                  <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-zinc-100">{a.t(item.labelKey)}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{a.t(item.descKey)}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-neutral-300 group-hover:text-zinc-400" aria-hidden />
              </Link>
            );
          })}
        </div>
      </section>
      ) : null}

      {layout.showStaffActions || layout.showNavShortcuts ? (
      <div className="grid gap-6 lg:grid-cols-2">
        {layout.showStaffActions ? (
        <section className={cn(adminPanel, "space-y-4")}>
          <SectionIntro eyebrow={a.t("admin.dashboard.team.eyebrow")} title={a.t("admin.dashboard.team.recentActions")} />
          <ul className={cn(adminTile, "divide-y divide-zinc-800/60 space-y-0 p-0")}>
            {actions.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-zinc-500">{a.t("admin.dashboard.team.noRecords")}</li>
            ) : (
              actions.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                  <span className="text-zinc-200">{a.formatAuditAction(item.action)}</span>
                  <span className="shrink-0 text-xs text-zinc-500">{item.adminEmail}</span>
                </li>
              ))
            )}
          </ul>
        </section>
        ) : null}

        {layout.showNavShortcuts ? (
        <section className={cn(adminPanel, "space-y-4")}>
          <SectionIntro eyebrow={a.t("admin.dashboard.nav.eyebrow")} title={a.t("admin.dashboard.nav.keySections")} />
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              { labelKey: "admin.dashboard.nav.wallets", href: ROUTES.adminWallets, icon: Wallet },
              { labelKey: "admin.dashboard.nav.rounds", href: ROUTES.adminRounds, icon: Handshake },
              { labelKey: "admin.dashboard.nav.secondaryMarket", href: ROUTES.adminSecondaryMarket, icon: Store },
              { labelKey: "admin.dashboard.nav.users", href: ROUTES.adminUsers, icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(adminTile, "flex items-center gap-2 py-3 transition-colors hover:bg-zinc-800/50")}
                  >
                    <Icon className="size-4 text-zinc-500" aria-hidden />
                    <span className="text-sm font-semibold text-zinc-200">{a.t(item.labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
        ) : null}
      </div>
      ) : null}

      {layout.showDepositsFeed || layout.showWithdrawalsFeed ? (
      <div className="grid gap-6 xl:grid-cols-2">
        {layout.showDepositsFeed ? (
        <section className={cn(adminPanel, "space-y-4")}>
          <SectionIntro
            eyebrow={a.t("admin.dashboard.feed.eyebrow")}
            title={a.t("admin.dashboard.feed.recentDeposits")}
            action={
              <Link href={ROUTES.adminDeposits} className="text-xs font-semibold text-zinc-500 hover:text-zinc-100">
                {a.portal.viewAll}
              </Link>
            }
          />
          <AdminDataTable flat columns={depositCols} rows={deposits} rowKey={(r) => r.id} />
        </section>
        ) : null}
        {layout.showWithdrawalsFeed ? (
        <section className={cn(adminPanel, "space-y-4")}>
          <SectionIntro
            eyebrow={a.t("admin.dashboard.feed.eyebrow")}
            title={a.t("admin.dashboard.feed.recentWithdrawals")}
            action={
              <Link href={ROUTES.adminWithdrawals} className="text-xs font-semibold text-zinc-500 hover:text-zinc-100">
                {a.portal.viewAll}
              </Link>
            }
          />
          <AdminDataTable flat columns={wdCols} rows={withdrawals} rowKey={(r) => r.id} />
        </section>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
