import { ROUTES } from "@/constants/routes";
import type { AnalyticsInsightItem } from "@/features/admin/analytics/components/admin-analytics-insights-panel";

export const RISK_CHART_EMPTY = {
  severity: {
    title: "Риск-флагов за период нет",
    description: "Если подозрительных операций не было, это нормальное состояние.",
  },
  type: {
    title: "Нет данных по типам риска",
    description: "Данные появятся после срабатывания risk rules.",
  },
  aging: {
    title: "Очередь compliance пуста",
    description: "Открытых флагов на проверку нет.",
  },
  highValue: {
    title: "Крупных операций под риском нет",
    description: "Операции появятся здесь, если сумма или риск превысят пороги.",
  },
  rules: {
    title: "Правила риска пока не срабатывали",
    description: "Статистика появится после первых risk flags.",
  },
  repeat: {
    title: "Повторных риск-пользователей нет",
    description: "Это нормальное состояние.",
  },
  trend: {
    title: "Нет динамики риск-флагов",
    description: "График появится после compliance-сигналов за период.",
  },
} as const;

export const RISK_KPI_TOOLTIPS = {
  openFlags: "Активные risk flags в статусе OPEN.",
  highCritical: "Открытые флаги severity high или critical.",
  unassigned: "OPEN без назначенного reviewer.",
  overdue: "OPEN дольше SLA по severity.",
  hvWithdrawals: "Выводы в очереди (requested/processing/on hold).",
  suspiciousTrades: "Сделки, помеченные trade.mark_suspicious.",
  frozenVolume: "Сумма выводов ON_HOLD.",
  blocked: "Пользователи SUSPENDED.",
  frozenOps: "Активные compliance freezes.",
  flagsPeriod: "Все risk flags, созданные за период.",
  reviewed: "Флаги со статусом REVIEWED за период.",
  avgReview: "Среднее время от createdAt до reviewedAt.",
} as const;

export const SEVERITY_BADGE: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-300",
  medium: "bg-blue-50 text-blue-800",
  high: "bg-amber-50 text-amber-900",
  critical: "bg-rose-50 text-rose-900",
};

export function complianceCaseHref(riskId: string): string {
  return `${ROUTES.adminCompliance}?flagId=${riskId}`;
}

export function riskEntityHref(
  entityType: string,
  entityId: string | null | undefined,
  userId: string,
): string {
  const t = entityType.toLowerCase();
  if (t === "withdrawal" && entityId) return `${ROUTES.adminWithdrawals}?id=${entityId}`;
  if (t === "deposit" && entityId) return `${ROUTES.adminDeposits}?id=${entityId}`;
  if (t === "trade" || t === "listing") return ROUTES.adminSecondaryMarket;
  if (t === "user" || userId) return ROUTES.adminUserDetail(userId);
  return ROUTES.adminCompliance;
}

export function riskOperationHref(type: string, operationId: string, userId: string): string {
  const t = type.toLowerCase();
  if (t === "withdrawal") return `${ROUTES.adminWithdrawals}?id=${operationId}`;
  if (t === "deposit") return `${ROUTES.adminDeposits}?id=${operationId}`;
  if (t.includes("trade") || t === "secondary trade") return ROUTES.adminSecondaryMarket;
  return ROUTES.adminUserDetail(userId);
}

export function buildRiskHealthSummary(input: {
  hasActivity: boolean;
  flagsInPeriod: number;
  highCritical: number;
  openFlags: number;
  overdue: number;
  avgReviewHours: number | null;
  issues: string[];
}): { tone: "neutral" | "positive" | "warning"; title: string; body: string } {
  if (!input.hasActivity && input.openFlags === 0) {
    return {
      tone: "neutral",
      title: "Состояние рисков",
      body: "За выбранный период активных риск-сигналов нет. Это нормальное состояние, если подозрительных операций не найдено.",
    };
  }
  const reviewPart =
    input.avgReviewHours != null
      ? `, среднее время обработки — ${input.avgReviewHours} ч`
      : "";
  const issueText = input.issues.length > 0 ? ` ${input.issues.join(" ")}` : "";
  return {
    tone: input.overdue > 0 || input.highCritical > 3 ? "warning" : "positive",
    title: "Состояние рисков",
    body: `За период создано ${input.flagsInPeriod} риск-флагов, из них ${input.highCritical} high/critical. На проверке ${input.openFlags} кейсов${reviewPart}.${issueText}`,
  };
}

export function buildRiskInsights(input: {
  unassigned?: number;
  overdue?: number;
  highValueWd?: number;
  repeatUsers?: number;
  suspiciousTrades?: number;
  highFpRule?: string | null;
  noActivity?: boolean;
}): AnalyticsInsightItem[] {
  const items: AnalyticsInsightItem[] = [];
  if (input.noActivity && (input.unassigned ?? 0) === 0) {
    items.push({
      id: "all-clear",
      label: "Критических рисков нет",
      href: ROUTES.adminCompliance,
      priority: "low",
    });
    return items;
  }
  if ((input.unassigned ?? 0) > 0) {
    items.push({
      id: "unassigned",
      label: "Есть high/critical risk flags без ответственного",
      count: input.unassigned,
      href: ROUTES.adminCompliance,
      priority: "high",
    });
  }
  if ((input.overdue ?? 0) > 0) {
    items.push({
      id: "overdue",
      label: "Есть просроченные compliance-проверки",
      count: input.overdue,
      href: ROUTES.adminCompliance,
      priority: "high",
    });
  }
  if ((input.highValueWd ?? 0) > 0) {
    items.push({
      id: "hv-wd",
      label: "Есть high-value withdrawals на удержании",
      count: input.highValueWd,
      href: ROUTES.adminWithdrawals,
      priority: "high",
    });
  }
  if ((input.repeatUsers ?? 0) > 0) {
    items.push({
      id: "repeat",
      label: "Есть повторные риск-флаги у пользователей",
      count: input.repeatUsers,
      href: ROUTES.adminCompliance,
      priority: "medium",
    });
  }
  if ((input.suspiciousTrades ?? 0) > 0) {
    items.push({
      id: "suspicious",
      label: "Есть подозрительные сделки на вторичном рынке",
      count: input.suspiciousTrades,
      href: ROUTES.adminSecondaryMarket,
      priority: "medium",
    });
  }
  if (input.highFpRule) {
    items.push({
      id: "fp-rule",
      label: `Правило ${input.highFpRule} даёт много false positives`,
      href: ROUTES.adminAnalyticsRisk,
      priority: "medium",
    });
  }
  return items;
}
