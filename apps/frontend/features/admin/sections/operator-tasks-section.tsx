"use client";

import * as React from "react";
import Link from "next/link";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  Headphones,
  Layers,
  Music2,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminSectionRefreshButton } from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { ANALYTICS_CHART } from "@/features/admin/analytics/lib/admin-analytics-theme";
import { buildLinePath } from "@/lib/analytics/chart-path";
import {
  OPERATOR_TASK_CATEGORY_LABELS,
  OPERATOR_TASK_CATEGORY_ORDER,
  type AdminOperatorTask,
  type OperatorTaskCategory,
} from "@/features/admin/lib/operator-tasks.types";
import { getAdminDataSource } from "@/features/admin/api/admin-api.config";
import {
  getAdminDashboardAlerts,
  getAdminDashboardTasks,
  getAdminRecentActions,
} from "@/services/admin/adminDashboard.service";
import {
  fetchAdminSafetyConsole,
  type AdminSafetyConsole,
} from "@/services/admin/adminSafety.service";
import {
  fetchAdminOperatorSlaTasks,
  type AdminOperatorSlaTask,
} from "@/services/admin/adminOperatorSla.service";
import type { AdminDashboardAlert, AdminRecentAction } from "@/features/admin/mocks/admin-dashboard.mock";
import {
  AdminErrorState,
  AdminLoadingState,
  AdminLocalizedStatusBadge,
} from "@/features/admin/ui";
import {
  adminAlertSurface,
  adminCountBadge,
  adminCountBadgeActive,
  adminIconTile,
  adminIconTileActive,
  adminPanel,
  adminTile,
  adminEyebrow,
  adminBtnGhost,
} from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

const PANEL = adminPanel;
const TILE = cn(adminTile, "hover:bg-zinc-800/50");

const CATEGORY_ICONS: Record<OperatorTaskCategory, React.ComponentType<{ className?: string }>> = {
  finance: Wallet,
  support: Headphones,
  compliance: ShieldAlert,
  content: Music2,
  market: TrendingUp,
  operations: FileBarChart,
};

function alertSurface(level: AdminDashboardAlert["level"]) {
  return adminAlertSurface(level);
}

function pluralTasks(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "задача";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "задачи";
  return "задач";
}

function groupTasksByCategory(tasks: AdminOperatorTask[]) {
  const map = new Map<OperatorTaskCategory, AdminOperatorTask[]>();
  for (const cat of OPERATOR_TASK_CATEGORY_ORDER) {
    map.set(cat, []);
  }
  for (const task of tasks) {
    const list = map.get(task.category) ?? [];
    list.push(task);
    map.set(task.category, list);
  }
  return OPERATOR_TASK_CATEGORY_ORDER.map((category) => ({
    category,
    label: OPERATOR_TASK_CATEGORY_LABELS[category],
    items: (map.get(category) ?? []).sort((a, b) => {
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (b.priority === "high" && a.priority !== "high") return 1;
      return b.count - a.count;
    }),
  })).filter((g) => g.items.length > 0);
}

function buildSparkSeries(values: number[]): number[] {
  if (values.length >= 2) return values;
  const peak = values[0] ?? 0;
  if (peak <= 0) return [0, 0];
  return [0, peak];
}

function OperatorTaskKpiCard({
  label,
  value,
  hint,
  activeTone = "warning",
  trend = [],
  href,
}: {
  label: string;
  value: number;
  hint: string;
  activeTone?: "warning" | "danger" | "info";
  trend?: number[];
  href?: string;
}) {
  const hasAttention = value > 0;
  const valueTone = !hasAttention
    ? "text-zinc-100"
    : activeTone === "danger"
      ? "text-rose-400"
      : activeTone === "info"
        ? "text-sky-400"
        : "text-amber-400";

  const sparkColor = !hasAttention
    ? ANALYTICS_CHART.neutral
    : activeTone === "danger"
      ? ANALYTICS_CHART.negative
      : activeTone === "info"
        ? "#38bdf8"
        : "#fbbf24";

  const series = buildSparkSeries(trend.length > 0 ? trend : [value]);
  const spark = buildLinePath(series, 64, 24, 0, 2, {
    min: Math.min(...series),
    max: Math.max(...series),
  });

  const inner = (
    <div className={cn(TILE, "flex h-full flex-col", href && "transition-colors hover:bg-zinc-800/50")}>
      <div className="flex min-h-10 items-start justify-between gap-2">
        <p className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
        <svg viewBox="0 0 64 24" className="h-6 w-16 shrink-0 opacity-70" aria-hidden>
          <polyline
            points={spark}
            fill="none"
            stroke={sparkColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className={cn("mt-3 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl", valueTone)}>
        {value}
      </p>
      <p className="mt-2 text-xs text-zinc-500">{hint}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F500]/25">
        {inner}
      </Link>
    );
  }

  return inner;
}

function TaskRow({ task }: { task: AdminOperatorTask }) {
  const hasWork = task.count > 0;
  const Icon = CATEGORY_ICONS[task.category] ?? ClipboardList;

  return (
    <li>
      <Link
        href={task.href}
        className={cn(
          TILE,
          "flex gap-4",
          !hasWork && "opacity-60 hover:opacity-80",
        )}
      >
        <span
          className={cn(
            "size-10 shrink-0",
            hasWork ? adminIconTileActive : adminIconTile,
          )}
        >
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">{task.label}</span>
            {task.priority === "high" && hasWork ? (
              <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                Срочно
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">{task.description}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 self-center">
          <span
            className={cn(
              "min-w-[2rem] text-center",
              hasWork ? adminCountBadgeActive : adminCountBadge,
            )}
          >
            {task.count}
          </span>
          <ChevronRight className="size-4 text-zinc-500" aria-hidden />
        </span>
      </Link>
    </li>
  );
}

const CATEGORY_ACCENT: Record<
  OperatorTaskCategory,
  { iconActive: string; titleActive: string }
> = {
  finance: {
    iconActive: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
    titleActive: "text-amber-50",
  },
  compliance: {
    iconActive: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25",
    titleActive: "text-rose-50",
  },
  support: {
    iconActive: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",
    titleActive: "text-sky-50",
  },
  content: {
    iconActive: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25",
    titleActive: "text-violet-50",
  },
  market: {
    iconActive: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
    titleActive: "text-emerald-50",
  },
  operations: {
    iconActive: "bg-zinc-500/15 text-zinc-200 ring-1 ring-zinc-500/25",
    titleActive: "text-zinc-50",
  },
};

function TaskCategorySection({
  group,
  defaultExpanded,
  expandLabel,
  collapseLabel,
}: {
  group: {
    category: OperatorTaskCategory;
    label: string;
    items: AdminOperatorTask[];
  };
  defaultExpanded: boolean;
  expandLabel: string;
  collapseLabel: string;
}) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const GroupIcon = CATEGORY_ICONS[group.category] ?? Layers;
  const accent = CATEGORY_ACCENT[group.category];
  const groupActive = group.items.filter((i) => i.count > 0).length;
  const groupTotal = group.items.reduce((s, i) => s + i.count, 0);
  const hasWork = groupTotal > 0;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl bg-zinc-900/45 sm:rounded-3xl",
        expanded ? "space-y-0" : "",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={expanded ? collapseLabel : expandLabel}
        className={cn(
          "flex w-full flex-wrap items-start justify-between gap-3 px-4 py-5 text-left transition-colors hover:bg-zinc-800/30 sm:px-8 sm:py-6",
          expanded ? "pb-3 sm:pb-4" : "pb-6 sm:pb-8",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "size-11 shrink-0",
              hasWork ? cn(adminIconTile, accent.iconActive) : adminIconTile,
            )}
          >
            <GroupIcon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2
              className={cn(
                "text-xl font-semibold tracking-tight sm:text-[1.35rem]",
                hasWork ? accent.titleActive : "text-zinc-100",
              )}
            >
              {group.label}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {groupActive > 0
                ? `${groupTotal} позиций требуют внимания`
                : "Активных позиций нет — раздел в норме"}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-2 self-center">
          {groupTotal > 0 ? <span className={adminCountBadgeActive}>{groupTotal}</span> : null}
          <ChevronDown
            className={cn("size-4 text-zinc-500 transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
        </span>
      </button>
      {expanded ? (
        <ul className="space-y-2 px-4 pb-6 sm:px-8 sm:pb-8">
          {group.items.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function OperatorTasksSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [tasks, setTasks] = React.useState<AdminOperatorTask[]>([]);
  const [alerts, setAlerts] = React.useState<AdminDashboardAlert[]>([]);
  const [recentActions, setRecentActions] = React.useState<AdminRecentAction[]>([]);
  const [safety, setSafety] = React.useState<AdminSafetyConsole | null>(null);
  const [slaTasks, setSlaTasks] = React.useState<AdminOperatorSlaTask[]>([]);
  const [optionalWidgetError, setOptionalWidgetError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    setLoading(true);
    setOptionalWidgetError(false);
    const timeoutPromise = new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("OPERATOR_TASKS_TIMEOUT")), 20_000);
    });

    const corePromise = Promise.all([
      getAdminDashboardTasks(client),
      getAdminDashboardAlerts(client),
      getAdminRecentActions(client),
    ]).then(async ([t, alertsRes, r]) => {
      setTasks(t);
      setAlerts(alertsRes);
      setRecentActions(r.slice(0, 6));

      if (getAdminDataSource() !== "live" || !client) {
        setSafety(null);
        setSlaTasks([]);
        return;
      }

      const [safetyResult, slaResult] = await Promise.allSettled([
        fetchAdminSafetyConsole(client),
        fetchAdminOperatorSlaTasks(client),
      ]);
      let optionalFailed = false;
      if (safetyResult.status === "fulfilled") {
        setSafety(safetyResult.value);
      } else {
        setSafety(null);
        optionalFailed = true;
      }
      if (slaResult.status === "fulfilled") {
        setSlaTasks(slaResult.value);
      } else {
        setSlaTasks([]);
        optionalFailed = true;
      }
      setOptionalWidgetError(optionalFailed);
    });

    Promise.race([corePromise, timeoutPromise])
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [client]);

  React.useEffect(() => {
    load();
  }, [load]);

  const activeTasks = tasks.filter((t) => t.count > 0);
  const taskTotal = activeTasks.reduce((s, item) => s + item.count, 0);
  const highPriority = activeTasks.filter((t) => t.priority === "high").length;
  const financeTotal = activeTasks
    .filter((t) => t.category === "finance")
    .reduce((s, t) => s + t.count, 0);
  const supportTotal = activeTasks
    .filter((t) => t.category === "support")
    .reduce((s, t) => s + t.count, 0);
  const grouped = groupTasksByCategory(tasks);
  const title = a.adminSectionLabel("operatorTasks");
  const queueTrend = activeTasks.map((t) => t.count);
  const urgentTrend = activeTasks.filter((t) => t.priority === "high").map((t) => t.count);
  const financeTrend = tasks.filter((t) => t.category === "finance").map((t) => t.count);
  const supportTrend = tasks.filter((t) => t.category === "support").map((t) => t.count);

  if (loading) {
    return (
      <AdminPageShell contained className="min-h-full">
        <AdminLoadingState label={a.t("admin.loading.operatorTasks")} centered />
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell contained className="min-h-full">
        <AdminErrorState onRetry={load} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell contained className="min-h-full">
      <div className="space-y-8 pb-6 sm:space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-[1.75rem]">
              {title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={ROUTES.admin}>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn("h-9 rounded-xl px-4 text-xs font-semibold", adminBtnGhost)}
              >
                К обзору
              </Button>
            </Link>
            <AdminSectionRefreshButton onClick={load} variant="primary" />
          </div>
        </header>

        {optionalWidgetError ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {a.t("admin.ui.widgetUnavailable")}
          </p>
        ) : null}

        {safety ? (
          <div
            className={cn(
              PANEL,
              "flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between",
              safety.readiness.dataQualityGreen && safety.readiness.outboxHealthy
                ? "bg-emerald-500/10"
                : "bg-amber-500/10",
            )}
          >
            <p className="font-medium text-zinc-100">Консоль безопасности Spliton</p>
            <p className="text-zinc-400">
              Data quality: {safety.dataQuality.passed ? "OK" : `${safety.dataQuality.findings.length} находок`}
              {" · "}
              Outbox DLQ: {safety.outbox.deadLetter}
              {" · "}
              Tron: {String(safety.liveMode.tronProvider)}
            </p>
          </div>
        ) : null}

        <section className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OperatorTaskKpiCard
            label={a.t("admin.kpi.operatorTasks.totalQueued")}
            value={taskTotal}
            hint={`${activeTasks.length} ${pluralTasks(activeTasks.length)} с ненулевым счётчиком`}
            activeTone="warning"
            trend={queueTrend}
            href={ROUTES.adminOperatorTasks}
          />
          <OperatorTaskKpiCard
            label={a.t("admin.kpi.operatorTasks.urgent")}
            value={highPriority}
            hint={a.t("admin.kpi.operatorTasks.urgentHint")}
            activeTone="danger"
            trend={urgentTrend}
            href={ROUTES.adminOperatorTasks}
          />
          <OperatorTaskKpiCard
            label={a.t("admin.kpi.operatorTasks.treasury")}
            value={financeTotal}
            hint={a.t("admin.kpi.operatorTasks.treasuryHint")}
            activeTone="warning"
            trend={financeTrend}
            href={ROUTES.adminDeposits}
          />
          <OperatorTaskKpiCard
            label={a.t("admin.kpi.operatorTasks.support")}
            value={supportTotal}
            hint={a.t("admin.kpi.operatorTasks.supportHint")}
            activeTone="info"
            trend={supportTrend}
            href={ROUTES.adminSupport}
          />
        </section>

        {grouped.map((group) => {
          const groupTotal = group.items.reduce((s, i) => s + i.count, 0);

          return (
            <TaskCategorySection
              key={group.category}
              group={group}
              defaultExpanded={groupTotal > 0}
              expandLabel={a.t("admin.operatorTasks.category.expand")}
              collapseLabel={a.t("admin.operatorTasks.category.collapse")}
            />
          );
        })}

        {tasks.length === 0 ? (
          <section className={cn(PANEL, "text-center")}>
            <p className="text-sm font-medium text-zinc-200">Нет настроенных очередей</p>
            <p className="mt-1 text-xs text-zinc-500">Проверьте подключение к API админки.</p>
          </section>
        ) : null}

        {slaTasks.length > 0 ? (
          <section className={cn(PANEL, "space-y-4")}>
            <div className="flex items-start gap-3">
              <span className={cn("size-11 bg-sky-500/10 text-sky-300", adminIconTile)}>
                <ClipboardList className="size-5" aria-hidden />
              </span>
              <div>
                <p className={adminEyebrow}>SLA</p>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Операторские SLA-задачи</h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Выводы, KYC, споры и другие кейсы с дедлайном из `operator_sla_tasks`.
                </p>
              </div>
            </div>
            <ul className="space-y-2">
              {slaTasks.slice(0, 12).map((task) => (
                <li key={task.id}>
                  {task.href ? (
                    <Link href={task.href} className={cn(TILE, "flex items-center justify-between gap-3")}>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-zinc-100">{task.title}</span>
                        <span className="text-xs text-zinc-500">
                          {task.taskType} · до {new Date(task.dueAt).toLocaleString("ru-RU")}
                        </span>
                      </span>
                      <AdminLocalizedStatusBadge
                        status={task.status}
                        tone={task.status === "overdue" ? "danger" : task.status === "due_soon" ? "warning" : "neutral"}
                      />
                    </Link>
                  ) : (
                    <div className={cn(TILE, "flex items-center justify-between gap-3")}>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-zinc-100">{task.title}</span>
                        <span className="text-xs text-zinc-500">
                          {task.taskType} · до {new Date(task.dueAt).toLocaleString("ru-RU")}
                        </span>
                      </span>
                      <AdminLocalizedStatusBadge
                        status={task.status}
                        tone={task.status === "overdue" ? "danger" : task.status === "due_soon" ? "warning" : "neutral"}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={cn(PANEL, "space-y-4")}>
          <div className="flex items-start gap-3">
            <span className={cn("size-11 bg-amber-500/10 text-amber-300", adminIconTile)}>
              <AlertTriangle className="size-5" aria-hidden />
            </span>
            <div>
              <p className={adminEyebrow}>Риск</p>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                Сигналы и отклонения
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Автоматические предупреждения по SLA выводов, риск-флагам и заморозкам.
              </p>
            </div>
          </div>
          {alerts.length === 0 ? (
            <p className={cn(TILE, "text-center text-sm text-zinc-500")}>
              Критичных сигналов нет — можно сосредоточиться на очередях выше.
            </p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => {
                const inner = (
                  <>
                    <span className="min-w-0 flex-1 text-sm font-medium leading-snug">{a.message}</span>
                    <AdminLocalizedStatusBadge
                      status={a.level}
                      tone={a.level === "danger" ? "danger" : a.level === "warning" ? "warning" : "info"}
                    />
                    {a.href ? (
                      <ArrowUpRight className="size-4 shrink-0 text-current/50" aria-hidden />
                    ) : null}
                  </>
                );
                return (
                  <li key={a.id}>
                    {a.href ? (
                      <Link
                        href={a.href}
                        className={cn(TILE, "flex items-start justify-between gap-3", alertSurface(a.level))}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div
                        className={cn(TILE, "flex items-start justify-between gap-3", alertSurface(a.level))}
                      >
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href={ROUTES.adminCompliance}
            className="inline-flex text-xs font-semibold text-zinc-500 hover:text-zinc-100"
          >
            Все риск-сигналы →
          </Link>
        </section>

        <section className={cn(PANEL, "space-y-4")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className={cn("size-11", adminIconTile)}>
                <Banknote className="size-5" aria-hidden />
              </span>
              <div>
                <p className={adminEyebrow}>Аудит</p>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                  Последние действия операторов
                </h2>
              </div>
            </div>
            <Link
              href={ROUTES.adminAudit}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-100"
            >
              Полный журнал →
            </Link>
          </div>
          {recentActions.length === 0 ? (
            <p className={cn(TILE, "text-sm text-zinc-500")}>Записей в журнале пока нет.</p>
          ) : (
            <ul className="divide-y divide-zinc-800/60 overflow-hidden rounded-2xl bg-zinc-900/50">
              {recentActions.map((action) => (
                <li
                  key={action.id}
                  className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm text-zinc-200">{a.formatAuditAction(action.action)}</span>
                  <span className="text-[11px] text-zinc-500">
                    {action.adminEmail} · {new Date(action.createdAt).toLocaleString("ru-RU")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminPageShell>
  );
}
