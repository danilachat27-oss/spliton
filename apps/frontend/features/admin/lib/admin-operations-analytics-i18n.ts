import { ROUTES } from "@/constants/routes";
import { ADMIN_METRIC_NA_LABEL } from "@/features/admin/lib/admin-format";
import type { AnalyticsInsightItem } from "@/features/admin/analytics/components/admin-analytics-insights-panel";

export const OPS_CHART_EMPTY = {
  status: {
    title: "Обращений за период нет",
    description: "Если пользователи не создавали тикеты, это нормальное состояние.",
  },
  category: {
    title: "Нет данных по категориям обращений",
    description: "Категории появятся после первых тикетов.",
  },
  response: {
    title: "Недостаточно данных для расчёта времени ответа",
    description: "Метрика появится после обработки обращений поддержкой.",
  },
  manager: {
    title: "Нет назначенных обращений",
    description: "Назначьте ответственных, чтобы видеть нагрузку менеджеров.",
  },
  finance: {
    title: "Финансовых обращений нет",
    description: "Обращения появятся здесь, если пользователи сообщат о пополнениях, выводах или операциях кошелька.",
  },
  queue: {
    title: "Очередь поддержки пуста",
    description: "Открытых обращений нет — это нормальное состояние.",
  },
  escalations: {
    title: "Эскалаций нет",
    description: "Эскалированные тикеты появятся при передаче в finance/compliance/technical.",
  },
  pain: {
    title: "Недостаточно данных по темам",
    description: "Статистика появится после накопления обращений.",
  },
} as const;

export const OPS_KPI_TOOLTIPS = {
  open: "Тикеты в статусах: открыт, в работе, ожидает пользователя, эскалирован.",
  inProgress: "Статус IN_PROGRESS.",
  waiting: "Ожидают ответа пользователя.",
  unassigned: "OPEN-очередь без assignedTo.",
  escalated: "Статус ESCALATED.",
  overdue: "OPEN дольше SLA (priority/status).",
  firstResponse: "От первой staff-заметки до createdAt (notes).",
  resolution: "CLOSED: updatedAt − createdAt.",
  finance: "Категории deposit, withdrawal, payouts, secondary_market.",
  slaCompliance: "Доля CLOSED в пределах SLA за период.",
} as const;

export const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-50 text-blue-800",
  in_progress: "bg-violet-50 text-violet-900",
  waiting_user: "bg-amber-50 text-amber-900",
  escalated: "bg-rose-50 text-rose-900",
  closed: "bg-zinc-100 text-zinc-300",
};

export const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-400",
  medium: "bg-blue-50 text-blue-800",
  high: "bg-rose-50 text-rose-900",
  critical: "bg-rose-100 text-rose-950",
};

export function supportTicketHref(ticketId: string): string {
  return `${ROUTES.adminSupport}?ticketId=${ticketId}`;
}

export function financeEntityHref(category: string, entityId: string | null | undefined): string {
  const c = category.toLowerCase();
  if (c === "deposit" && entityId) return `${ROUTES.adminDeposits}?id=${entityId}`;
  if (c === "withdrawal" && entityId) return `${ROUTES.adminWithdrawals}?id=${entityId}`;
  if (c === "secondary_market") return ROUTES.adminSecondaryMarket;
  if (c === "payouts") return ROUTES.adminRevenue;
  return ROUTES.adminWallets;
}

export function formatDurationRu(minutes: number | null | undefined): string {
  if (minutes == null) return ADMIN_METRIC_NA_LABEL;
  if (minutes < 60) return `${Math.round(minutes)} мин`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h < 24) return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh > 0 ? `${d} д ${rh} ч` : `${d} д`;
}

export function formatHoursRu(hours: number | null | undefined): string {
  if (hours == null) return ADMIN_METRIC_NA_LABEL;
  return formatDurationRu(hours * 60);
}

export function buildOperationsHealthSummary(input: {
  hasActivity: boolean;
  created: number;
  closed: number;
  open: number;
  firstResponseMinutes: number | null;
  overdue: number;
  issues: string[];
}): { tone: "neutral" | "positive" | "warning"; title: string; body: string } {
  if (!input.hasActivity && input.open === 0) {
    return {
      tone: "neutral",
      title: "Состояние поддержки",
      body: "За выбранный период обращений нет. Это нормальное состояние, если пользователи не создавали тикеты.",
    };
  }
  const fr =
    input.firstResponseMinutes != null
      ? ` Среднее время первого ответа — ${formatDurationRu(input.firstResponseMinutes)},`
      : "";
  const issueText = input.issues.length > 0 ? ` ${input.issues.join(" ")}` : "";
  return {
    tone: input.overdue > 0 ? "warning" : "positive",
    title: "Состояние поддержки",
    body: `За период создано ${input.created} обращений, ${input.closed} закрыто, ${input.open} остаются открытыми.${fr} просрочено по SLA — ${input.overdue}.${issueText}`,
  };
}

export function buildOperationsInsights(input: {
  unassigned?: number;
  overdue?: number;
  criticalNoResponse?: number;
  financeUnassigned?: number;
  depositSpike?: boolean;
  marketSpike?: boolean;
  overloadedManager?: string | null;
  repeatUsers?: number;
  noActivity?: boolean;
}): AnalyticsInsightItem[] {
  const items: AnalyticsInsightItem[] = [];
  if (input.noActivity && (input.overdue ?? 0) === 0) {
    items.push({
      id: "all-clear",
      label: "Нет обращений за период — это нормальное состояние",
      href: ROUTES.adminSupport,
      priority: "low",
    });
    return items;
  }
  if ((input.criticalNoResponse ?? 0) > 0) {
    items.push({
      id: "critical",
      label: "Есть критические обращения без ответа",
      count: input.criticalNoResponse,
      href: ROUTES.adminSupport,
      priority: "high",
    });
  }
  if ((input.financeUnassigned ?? 0) > 0) {
    items.push({
      id: "finance-unassigned",
      label: "Есть финансовые тикеты без ответственного",
      count: input.financeUnassigned,
      href: ROUTES.adminSupport,
      priority: "high",
    });
  }
  if (input.depositSpike) {
    items.push({
      id: "deposit-spike",
      label: "Растёт количество обращений по пополнениям",
      href: ROUTES.adminDeposits,
      priority: "medium",
    });
  }
  if (input.marketSpike) {
    items.push({
      id: "market-spike",
      label: "Есть рост тикетов по вторичному рынку",
      href: ROUTES.adminSecondaryMarket,
      priority: "medium",
    });
  }
  if ((input.overdue ?? 0) > 0) {
    items.push({
      id: "overdue",
      label: "Есть просроченные SLA",
      count: input.overdue,
      href: ROUTES.adminSupport,
      priority: "high",
    });
  }
  if (input.overloadedManager) {
    items.push({
      id: "overload",
      label: `Менеджер ${input.overloadedManager} перегружен`,
      href: ROUTES.adminSupport,
      priority: "medium",
    });
  }
  if ((input.repeatUsers ?? 0) > 0) {
    items.push({
      id: "repeat",
      label: "Есть повторные обращения от пользователей",
      count: input.repeatUsers,
      href: ROUTES.adminSupport,
      priority: "medium",
    });
  }
  return items;
}
