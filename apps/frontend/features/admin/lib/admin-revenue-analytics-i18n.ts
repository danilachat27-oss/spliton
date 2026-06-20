import { ROUTES } from "@/constants/routes";
import type { AnalyticsInsightItem } from "@/features/admin/analytics/components/admin-analytics-insights-panel";

export const REVENUE_CHART_EMPTY = {
  events: {
    title: "Revenue events за период не найдены",
    description: "Данные появятся после добавления дохода релиза.",
  },
  distributions: {
    title: "Распределения ещё не запускались",
    description: "Сначала создайте revenue event и рассчитайте preview распределения.",
  },
  byRelease: {
    title: "Начислений по релизам пока нет",
    description: "Данные появятся после успешного distribution run.",
  },
  overTime: {
    title: "Динамики начислений пока нет",
    description: "Выберите более широкий период или запустите первое распределение.",
  },
  failed: {
    title: "Ошибок начислений нет",
    description: "Это нормальное состояние, если все распределения завершились успешно.",
  },
  reconciliation: {
    title: "Данных для сверки пока нет",
    description: "Сверка появится после первых начислений через wallet ledger.",
  },
  pipeline: {
    title: "Revenue events за период не найдены",
    description: "Создайте доход релиза в разделе «Доходы и начисления».",
  },
} as const;

export const REVENUE_KPI_TOOLTIPS = {
  events: "Earning periods (revenue events) за период.",
  gross: "Сумма gross revenue из earning reports.",
  avgEvent: "Средний gross на один revenue event.",
  noDist: "Events с отчётом, но без distribution run.",
  distributed: "Сумма net payout держателям за период.",
  platform: "15% от gross (модель Spliton).",
  artist: "15% от gross.",
  holders: "70% от gross при status DISTRIBUTED.",
  completed: "Периоды в статусе DISTRIBUTED.",
  processing: "Периоды CALCULATED (preview).",
  failed: "Payouts в статусе FAILED.",
  holdersCount: "Уникальные userId с payout за период.",
  pending: "Payouts PENDING/ACCRUED.",
  ledgerMismatch: "PAID payouts без wallet transaction.",
} as const;

export function buildRevenueHealthSummary(input: {
  hasActivity: boolean;
  eventsCount: number;
  grossUsdt: string;
  distributedUsdt: string;
  platformUsdt: string;
  failedCount: number;
  issues: string[];
}): { tone: "neutral" | "positive" | "warning"; title: string; body: string } {
  if (!input.hasActivity) {
    return {
      tone: "neutral",
      title: "Состояние начислений",
      body: "За выбранный период начислений нет. Данные появятся после создания revenue event и запуска распределения дохода.",
    };
  }
  const issueText = input.issues.length > 0 ? ` ${input.issues.join(" ")}` : "";
  return {
    tone: input.failedCount > 0 || input.issues.length > 0 ? "warning" : "positive",
    title: "Состояние начислений",
    body: `За период обработано ${input.eventsCount} revenue events на сумму ${input.grossUsdt} USDT. Держателям начислено ${input.distributedUsdt} USDT, платформе — ${input.platformUsdt} USDT. Ошибок начисления: ${input.failedCount}.${issueText}`,
  };
}

export function buildRevenueInsights(input: {
  eventsWithoutDistribution?: number;
  failedCount?: number;
  ledgerMismatch?: number;
  noActivity?: boolean;
}): AnalyticsInsightItem[] {
  const items: AnalyticsInsightItem[] = [];
  if (input.noActivity) {
    items.push({
      id: "no-revenue",
      label: "Нет начислений за выбранный период",
      href: ROUTES.adminRevenue,
      priority: "high",
    });
  }
  if ((input.eventsWithoutDistribution ?? 0) > 0) {
    items.push({
      id: "no-dist",
      label: "Есть revenue events без запуска distribution",
      count: input.eventsWithoutDistribution,
      href: ROUTES.adminRevenue,
      priority: "high",
    });
  }
  if ((input.failedCount ?? 0) > 0) {
    items.push({
      id: "failed",
      label: "Есть failed distributions — требуется retry",
      count: input.failedCount,
      href: ROUTES.adminRevenue,
      priority: "high",
    });
  }
  if ((input.ledgerMismatch ?? 0) > 0) {
    items.push({
      id: "ledger",
      label: "Есть расхождение payout и wallet ledger",
      count: input.ledgerMismatch,
      href: ROUTES.adminWallets,
      priority: "high",
    });
  }
  return items;
}
