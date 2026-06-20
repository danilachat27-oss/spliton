import { ROUTES } from "@/constants/routes";
import type { AnalyticsInsightItem } from "@/features/admin/analytics/components/admin-analytics-insights-panel";

export const TRACK_CHART_EMPTY = {
  rounds: {
    title: "Активных раундов за период нет",
    description: "Опубликуйте раунд или выберите более широкий период.",
  },
  revenue: {
    title: "Доходов по релизам пока нет",
    description: "Данные появятся после создания revenue event и запуска начислений.",
  },
  holders: {
    title: "Держателей пока нет",
    description: "Пользователи появятся после покупки юнитов.",
  },
  secondary: {
    title: "Активности вторичного рынка пока нет",
    description: "Данные появятся после листингов и сделок.",
  },
  readiness: {
    title: "Данные готовности релизов недоступны",
    description: "Проверьте, что релизы содержат обложку, артиста, жанр и финансовые параметры.",
  },
  units: {
    title: "Нет данных по юнитам",
    description: "Юниты появятся после публикации раундов и первых покупок.",
  },
} as const;

export const TRACK_KPI_TOOLTIPS = {
  totalReleases: "Все релизы в каталоге Spliton (без удалённых).",
  published: "Опубликованные и sold out релизы.",
  drafts: "Релизы в статусе draft.",
  review: "Релизы на модерации.",
  incomplete: "Релизы без обложки или с неполными полями.",
  liveRounds: "Первичные раунды в статусе live.",
  completedRounds: "Завершённые раунды fundraising.",
  roundsNoSales: "Live/paused раунды без проданных юнитов.",
  avgProgress: "Средний progress % по live-раундам (raised / target).",
  totalUnits: "Сумма total units по всем раундам.",
  soldUnits: "Проданные юниты в первичных раундах.",
  availableUnits: "Остаток total − sold.",
  raised: "Собранная сумма USDT по первичным раундам.",
  releaseRevenue: "Gross revenue по релизам за период.",
  activeListings: "Активные листинги вторичного рынка.",
  secondaryTrades: "Завершённые сделки за период.",
  secondaryVolume: "Объём сделок USDT за период.",
} as const;

export const MISSING_FIELD_LABELS: Record<string, string> = {
  cover: "Обложка",
  artist: "Артист",
  description: "Описание",
  genre: "Жанр",
  revenue_shares: "Доли дохода",
  units: "Юниты",
  live_round: "Активный раунд",
  audio_preview: "Audio preview",
};

export const ROUND_WARNING_LABELS: Record<string, string> = {
  no_sales: "Нет продаж",
  low_progress: "Низкий progress",
  ending_soon: "Срок заканчивается",
  sold_out: "Sold out",
  missing_cover: "Нет обложки",
};

export function tracksFilterHref(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return s ? `${ROUTES.adminTracks}?${s}` : ROUTES.adminTracks;
}

export function buildTrackHealthSummary(input: {
  hasActivity: boolean;
  totalReleases: number;
  publishedReleases: number;
  liveRounds: number;
  bestRelease?: string;
  attentionCount?: number;
}): { tone: "neutral" | "positive" | "warning"; title: string; body: string } {
  if (!input.hasActivity && input.totalReleases === 0) {
    return {
      tone: "neutral",
      title: "Состояние портфеля релизов",
      body: "В выбранном периоде нет активности по релизам и раундам. Проверьте live-данные или выберите более широкий период.",
    };
  }

  const best = input.bestRelease ? ` Лучший прогресс у релиза «${input.bestRelease}».` : "";
  const att =
    (input.attentionCount ?? 0) > 0
      ? ` Внимание требуется ${input.attentionCount} релизам (продажи, медиа, концентрация).`
      : "";

  return {
    tone: (input.attentionCount ?? 0) > 2 ? "warning" : "positive",
    title: "Состояние портфеля релизов",
    body: `В портфеле ${input.totalReleases} релизов, ${input.publishedReleases} опубликованы, ${input.liveRounds} имеют активные раунды.${best}${att}`,
  };
}

export function buildTrackInsights(input: {
  incompleteReleases?: number;
  roundsWithoutSales?: number;
  liveRounds?: number;
  lowProgressCount?: number;
  highConcentrationCount?: number;
  noLiveRounds?: boolean;
}): AnalyticsInsightItem[] {
  const items: AnalyticsInsightItem[] = [];

  if ((input.incompleteReleases ?? 0) > 0) {
    items.push({
      id: "missing-cover",
      label: "Есть релизы без обложки — они хуже выглядят в каталоге",
      count: input.incompleteReleases,
      href: ROUTES.adminTracks,
      priority: "high",
    });
  }
  if ((input.roundsWithoutSales ?? 0) > 0) {
    items.push({
      id: "rounds-no-sales",
      label: "Есть live раунды без продаж за выбранный период",
      count: input.roundsWithoutSales,
      href: ROUTES.adminRounds,
      priority: "high",
    });
  }
  if ((input.lowProgressCount ?? 0) > 0) {
    items.push({
      id: "low-progress",
      label: "Есть раунды с progress ниже 10%",
      count: input.lowProgressCount,
      href: ROUTES.adminRounds,
      priority: "medium",
    });
  }
  if ((input.highConcentrationCount ?? 0) > 0) {
    items.push({
      id: "concentration",
      label: "Есть релизы с высокой концентрацией у одного держателя",
      count: input.highConcentrationCount,
      href: ROUTES.adminHoldings,
      priority: "medium",
    });
  }
  if (input.noLiveRounds) {
    items.push({
      id: "no-live-rounds",
      label: "Нет активных раундов — пользователи не могут покупать юниты",
      href: ROUTES.adminRounds,
      priority: "high",
    });
  }

  return items;
}
