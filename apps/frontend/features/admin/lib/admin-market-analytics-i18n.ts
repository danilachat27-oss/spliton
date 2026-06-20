import { ROUTES } from "@/constants/routes";
import type { AnalyticsInsightItem } from "@/features/admin/analytics/components/admin-analytics-insights-panel";

export const MARKET_CHART_EMPTY = {
  depth: {
    title: "Стакан листингов пуст",
    description: "Держатели ещё не выставили юниты на продажу.",
  },
  volume: {
    title: "Сделок за период нет",
    description: "Попробуйте выбрать 30 или 90 дней либо проверьте активность листингов.",
  },
  listings: {
    title: "Активных листингов по релизам нет",
    description: "Листинги появятся после создания заявок на продажу.",
  },
  tradesCompare: {
    title: "Нет сделок для сравнения",
    description: "Сравнение появится после завершённых или подозрительных сделок.",
  },
  sellers: {
    title: "Активных продавцов пока нет",
    description: "Продавцы появятся после создания листингов.",
  },
  prices: {
    title: "Недостаточно данных для анализа цены",
    description: "Нужно хотя бы несколько активных листингов или завершённых сделок.",
  },
  fees: {
    title: "Комиссий вторичного рынка за период нет",
    description: "Fee появятся после завершённых сделок на Spliton.",
  },
  risk: {
    title: "Подозрительной активности нет",
    description: "Это нормальное состояние при отсутствии risk-сигналов.",
  },
} as const;

export const MARKET_KPI_TOOLTIPS = {
  activeListings: "Листинги в статусе active без удаления.",
  unitsListed: "Сумма unitsAvailable по активным листингам.",
  listingsValue: "Оценка: units × price по активным листингам.",
  staleListings: "Active листинги старше 7 дней без сделки.",
  frozenListings: "Листинги в статусе paused (заморожены оператором).",
  completedTrades: "Сделки со settlement SETTLED за период.",
  volume: "Сумма grossAmount завершённых сделок.",
  avgTradeSize: "Средний grossAmount на сделку.",
  avgPrice: "Средняя цена за юнит по сделкам.",
  uniqueSellers: "Уникальные sellerUserId за период.",
  uniqueBuyers: "Уникальные buyerUserId за период.",
  secondaryFees: "Fee с кодом secondary_market_fee.",
  suspicious: "Сделки, помеченные trade.mark_suspicious в audit.",
} as const;

export function marketFilterHref(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return s ? `${ROUTES.adminSecondaryMarket}?${s}` : ROUTES.adminSecondaryMarket;
}

export function buildMarketHealthSummary(input: {
  hasActivity: boolean;
  completedTrades: number;
  volumeUsdt: string;
  topRelease?: string;
  avgPrice?: string | null;
  activeListings: number;
  issues: string[];
}): { tone: "neutral" | "positive" | "warning"; title: string; body: string } {
  if (!input.hasActivity) {
    return {
      tone: "neutral",
      title: "Состояние вторичного рынка",
      body: "За выбранный период активности вторичного рынка нет. Данные появятся после создания листингов и завершения сделок.",
    };
  }

  const parts = [
    `За период завершено ${input.completedTrades} сделок на сумму ${input.volumeUsdt} USDT.`,
    input.topRelease ? ` Самый активный релиз — «${input.topRelease}».` : "",
    input.avgPrice ? ` Средняя цена за юнит — ${input.avgPrice} USDT.` : "",
    ` Активных листингов — ${input.activeListings}.`,
  ].join("");

  const issueText =
    input.issues.length > 0 ? ` ${input.issues.join(" ")}` : "";

  return {
    tone: input.issues.length > 0 ? "warning" : "positive",
    title: "Состояние вторичного рынка",
    body: parts + issueText,
  };
}

export function buildMarketInsights(input: {
  staleListings?: number;
  suspiciousTrades?: number;
  frozenListings?: number;
  noActivity?: boolean;
  outlierCount?: number;
}): AnalyticsInsightItem[] {
  const items: AnalyticsInsightItem[] = [];
  if (input.noActivity) {
    items.push({
      id: "no-activity",
      label: "Нет активности вторичного рынка за период",
      href: ROUTES.adminSecondaryMarket,
      priority: "high",
    });
  }
  if ((input.staleListings ?? 0) > 0) {
    items.push({
      id: "stale-listings",
      label: "Есть листинги без сделок более 7 дней",
      count: input.staleListings,
      href: marketFilterHref({ tab: "listings" }),
      priority: "medium",
    });
  }
  if ((input.suspiciousTrades ?? 0) > 0) {
    items.push({
      id: "suspicious",
      label: "Есть подозрительные сделки",
      count: input.suspiciousTrades,
      href: ROUTES.adminCompliance,
      priority: "high",
    });
  }
  if ((input.frozenListings ?? 0) > 0) {
    items.push({
      id: "frozen",
      label: "Есть замороженные листинги",
      count: input.frozenListings,
      href: marketFilterHref({ marketFilter: "frozen" }),
      priority: "medium",
    });
  }
  if ((input.outlierCount ?? 0) > 0) {
    items.push({
      id: "outliers",
      label: "Есть сделки с ценой выше средней на 50%+",
      count: input.outlierCount,
      href: ROUTES.adminAnalyticsMarket,
      priority: "medium",
    });
  }
  return items;
}
