"use client";

import * as React from "react";
import Link from "next/link";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  ClipboardList,
  FileBarChart,
  Headphones,
  Layers,
  Music2,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
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
  adminAccentBg,
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

function SummaryCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const valueClass =
    tone === "danger"
      ? "text-rose-400"
      : tone === "warning"
        ? "text-amber-400"
        : "text-zinc-100";
  return (
    <div className={cn(TILE, "space-y-1")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>{value}</p>
      <p className="text-xs text-zinc-500">{hint}</p>
    </div>
  );
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
            <Button
              type="button"
              size="sm"
              className={cn("h-9 gap-1.5 rounded-xl px-4 text-xs font-semibold", adminAccentBg)}
              onClick={load}
            >
              <RefreshCw className="size-3.5" aria-hidden />
              {a.portal.refresh}
            </Button>
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

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label={a.t("admin.kpi.operatorTasks.totalQueued")}
            value={String(taskTotal)}
            hint={`${activeTasks.length} ${pluralTasks(activeTasks.length)} с ненулевым счётчиком`}
            tone={taskTotal > 0 ? "warning" : "neutral"}
          />
          <SummaryCard
            label={a.t("admin.kpi.operatorTasks.urgent")}
            value={String(highPriority)}
            hint={a.t("admin.kpi.operatorTasks.urgentHint")}
            tone={highPriority > 0 ? "danger" : "neutral"}
          />
          <SummaryCard
            label={a.t("admin.kpi.operatorTasks.treasury")}
            value={String(financeTotal)}
            hint={a.t("admin.kpi.operatorTasks.treasuryHint")}
            tone={financeTotal > 0 ? "warning" : "neutral"}
          />
          <SummaryCard
            label={a.t("admin.kpi.operatorTasks.support")}
            value={String(supportTotal)}
            hint={a.t("admin.kpi.operatorTasks.supportHint")}
            tone={supportTotal > 0 ? "warning" : "neutral"}
          />
        </section>

        {grouped.map((group) => {
          const GroupIcon = CATEGORY_ICONS[group.category] ?? Layers;
          const groupActive = group.items.filter((i) => i.count > 0).length;
          const groupTotal = group.items.reduce((s, i) => s + i.count, 0);

          return (
            <section key={group.category} className={cn(PANEL, "space-y-4")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={cn("size-11", adminIconTile)}>
                    <GroupIcon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className={adminEyebrow}>{group.label}</p>
                    <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                      Очереди раздела
                    </h2>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {groupActive > 0
                        ? `${groupTotal} позиций требуют внимания`
                        : "Активных позиций нет — раздел в норме"}
                    </p>
                  </div>
                </div>
                {groupTotal > 0 ? (
                  <span className={adminCountBadgeActive}>{groupTotal}</span>
                ) : null}
              </div>
              <ul className="space-y-2">
                {group.items.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </ul>
            </section>
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
