import type { MarketOverviewCategory, MarketOverviewPeriod } from "@/types/market-overview";

export const MARKET_OVERVIEW_PERIODS: { id: MarketOverviewPeriod; label: string }[] = [
  { id: "24h", label: "24H" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
];

export const MARKET_CATEGORY_TABS: { id: MarketOverviewCategory; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новые" },
  { id: "yield", label: "Доходные" },
  { id: "stable", label: "Стабильные выплаты" },
  { id: "demand", label: "Высокий спрос" },
  { id: "secondary", label: "Вторичный рынок" },
  { id: "premium", label: "Премиум" },
  { id: "archive", label: "Архив" },
];

export type MarketFilterId = "genre" | "status" | "payoutFreq" | "liquidity" | "yield" | "availability";

export const MARKET_FILTER_GROUPS: {
  id: MarketFilterId;
  label: string;
  options: { value: string; label: string }[];
}[] = [
  {
    id: "genre",
    label: "Жанр",
    options: [
      { value: "all", label: "Все" },
      { value: "pop", label: "Pop" },
      { value: "electronic", label: "Electronic" },
      { value: "hiphop", label: "Hip-Hop" },
      { value: "indie", label: "Indie" },
      { value: "lofi", label: "Lo-fi" },
    ],
  },
  {
    id: "status",
    label: "Статус",
    options: [
      { value: "all", label: "Все" },
      { value: "active", label: "Активен" },
      { value: "new", label: "Новый" },
      { value: "paused", label: "Пауза" },
      { value: "closed", label: "Закрыт" },
    ],
  },
  {
    id: "payoutFreq",
    label: "Выплаты",
    options: [
      { value: "all", label: "Любая" },
      { value: "monthly", label: "Ежемесячно" },
      { value: "biweekly", label: "Раз в 2 нед." },
    ],
  },
  {
    id: "liquidity",
    label: "Ликвидность",
    options: [
      { value: "all", label: "Все" },
      { value: "deep", label: "Высокая" },
      { value: "mid", label: "Средняя" },
      { value: "thin", label: "Низкая" },
    ],
  },
  {
    id: "yield",
    label: "Доходность",
    options: [
      { value: "all", label: "Любая" },
      { value: "high", label: "≥ 12%" },
      { value: "mid", label: "8–12%" },
      { value: "low", label: "< 8%" },
    ],
  },
  {
    id: "availability",
    label: "UNT",
    options: [
      { value: "all", label: "Все" },
      { value: "tight", label: "Мало доступно" },
      { value: "wide", label: "Широкий вход" },
    ],
  },
];

/** Верхние insight-карточки: значения зависят от периода (mock-множители). */
export const MARKET_TOP_CARD_DEFS = [
  {
    id: "active",
    title: "Самые активные релизы",
    subtitle: "По объёму просмотров сделок и заявок",
    metricKey: "activeCount" as const,
    deltaKey: "activeDelta" as const,
    barsKey: "activeBars" as const,
  },
  {
    id: "new",
    title: "Новые размещения",
    subtitle: "Первичные раунды за период",
    metricKey: "newCount" as const,
    deltaKey: "newDelta" as const,
    barsKey: "newBars" as const,
  },
  {
    id: "depth",
    title: "Каталог с глубоким стаканом",
    subtitle: "Доля релизов с ликвидностью Deep+",
    metricKey: "deepCatalogShare" as const,
    deltaKey: "deepCatalogDelta" as const,
    barsKey: "deepCatalogBars" as const,
  },
  {
    id: "secondary",
    title: "Активность secondary",
    subtitle: "Оборот перепродаж UNT",
    metricKey: "secondaryVol" as const,
    deltaKey: "secondaryDelta" as const,
    barsKey: "secondaryBars" as const,
  },
] as const;

export type MarketTopCardMetrics = Record<
  MarketOverviewPeriod,
  {
    activeCount: string;
    activeDelta: string;
    activeBars: number[];
    newCount: string;
    newDelta: string;
    newBars: number[];
    deepCatalogShare: string;
    deepCatalogDelta: string;
    deepCatalogBars: number[];
    secondaryVol: string;
    secondaryDelta: string;
    secondaryBars: number[];
  }
>;

export const MARKET_TOP_CARD_METRICS: MarketTopCardMetrics = {
  "24h": {
    activeCount: "38",
    activeDelta: "+6,2%",
    activeBars: [42, 46, 44, 52, 48, 55, 51, 58, 56, 61, 59, 64, 62, 66, 63, 65],
    newCount: "3",
    newDelta: "+1",
    newBars: [28, 32, 30, 38, 45, 40, 48, 44, 52, 46, 50, 42],
    deepCatalogShare: "66%",
    deepCatalogDelta: "+0,8 п.п.",
    deepCatalogBars: [56, 57, 58, 59, 60, 61, 62, 63, 62, 64, 65, 66, 65, 67, 66],
    secondaryVol: "214K USDT",
    secondaryDelta: "+4,1%",
    secondaryBars: [12, -8, 15, 6, -3, 18, 9, 11, 4, 16, -2, 14, 10, 7],
  },
  "7d": {
    activeCount: "41",
    activeDelta: "+3,1%",
    activeBars: [38, 40, 39, 42, 45, 44, 46, 48, 47, 50, 49, 52, 51, 53],
    newCount: "11",
    newDelta: "+4",
    newBars: [32, 35, 38, 40, 38, 44, 42, 48, 46, 50, 52, 49, 51],
    deepCatalogShare: "67%",
    deepCatalogDelta: "+0,4 п.п.",
    deepCatalogBars: [58, 59, 60, 61, 60, 62, 63, 64, 63, 65, 64, 66, 67, 66],
    secondaryVol: "1,02M USDT",
    secondaryDelta: "+2,4%",
    secondaryBars: [8, 14, -5, 12, 18, 7, -4, 15, 11, 6, -2, 13, 9],
  },
  "30d": {
    activeCount: "44",
    activeDelta: "+1,8%",
    activeBars: [36, 38, 37, 40, 42, 41, 43, 45, 44, 46, 45, 47, 46, 48],
    newCount: "26",
    newDelta: "+9",
    newBars: [30, 32, 36, 34, 38, 40, 38, 42, 44, 43, 45, 48, 46],
    deepCatalogShare: "69%",
    deepCatalogDelta: "+0,2 п.п.",
    deepCatalogBars: [59, 60, 61, 62, 63, 62, 64, 65, 64, 66, 65, 67, 68, 67],
    secondaryVol: "4,6M USDT",
    secondaryDelta: "+1,1%",
    secondaryBars: [10, 12, 8, -6, 14, 9, 11, -3, 7, 13, -1, 10, 6],
  },
  "90d": {
    activeCount: "47",
    activeDelta: "+0,6%",
    activeBars: [34, 36, 35, 38, 39, 38, 40, 41, 40, 42, 43, 42, 44, 43],
    newCount: "54",
    newDelta: "+12",
    newBars: [26, 30, 28, 32, 35, 34, 36, 38, 37, 40, 42, 41, 45],
    deepCatalogShare: "70%",
    deepCatalogDelta: "±0 п.п.",
    deepCatalogBars: [60, 61, 62, 61, 63, 64, 63, 65, 64, 66, 65, 67, 68, 69],
    secondaryVol: "12,8M USDT",
    secondaryDelta: "-0,8%",
    secondaryBars: [6, 8, -4, 10, -2, 7, 5, -3, 4, -6, 3, 5, -2],
  },
};

export const MARKET_SUMMARY_PANELS = [
  {
    id: "segments-primary",
    title: "Новые первичные раунды",
    caption: "Относительный поток заявок, усл. ед.",
    series: [24, 25, 26, 26, 27, 28, 29, 28, 30, 29, 31, 30, 32, 31, 33, 32, 34, 33, 34, 35],
    foot: "Ряд суммарный поток по окну; строки доля по жанрам.",
    bars: [
      { label: "Pop", value: 28, widthPct: 88 },
      { label: "Electronic", value: 34, widthPct: 100 },
      { label: "Hip-Hop", value: 19, widthPct: 56 },
      { label: "Indie", value: 12, widthPct: 35 },
    ],
  },
  {
    id: "genre-activity",
    title: "Активность по жанрам",
    caption: "Индекс заявок и просмотров",
    series: [88, 92, 95, 99, 103, 107, 110, 114, 118, 121, 125, 128, 132, 135, 138, 140, 141, 142, 141, 142],
    foot: "Ряд суммарный индекс активности; строки разбивка по жанрам.",
    bars: [
      { label: "Electronic", value: 142, widthPct: 100 },
      { label: "Pop", value: 128, widthPct: 90 },
      { label: "Hip-Hop", value: 111, widthPct: 78 },
      { label: "Lo-fi", value: 96, widthPct: 67 },
    ],
  },
  {
    id: "order-flow",
    title: "Поток заявок в стакан",
    caption: "Нормализованный индекс входящих лимитов",
    series: [42, 44, 48, 46, 45, 50, 52, 49, 54, 52, 56, 55, 58, 57, 61, 59, 63, 62, 64, 66],
    foot: "Не путать с объёмом выплат инвесторам, см. аналитику релизов",
  },
  {
    id: "secondary-demand",
    title: "Спрос secondary",
    caption: "Доля сделок с fill менее 6ч",
    series: [38, 37, 40, 39, 36, 41, 44, 42, 45, 43, 47, 46, 48, 47, 50, 49, 51, 50, 52, 53],
    foot: "Выше значит быстрее закрываются лоты",
  },
] as const;

export const MARKET_SEGMENT_SNAPSHOT = [
  {
    id: "pop",
    label: "Pop",
    deepPlusShare: "71%",
    stability: "Высокая",
    activity: "128",
    demand: "Рост",
    liquidity: "Deep",
  },
  {
    id: "electronic",
    label: "Electronic",
    deepPlusShare: "76%",
    stability: "Средняя",
    activity: "142",
    demand: "Пик",
    liquidity: "Deep",
  },
  {
    id: "hiphop",
    label: "Hip-Hop",
    deepPlusShare: "58%",
    stability: "Средняя",
    activity: "111",
    demand: "Стабильно",
    liquidity: "Mid",
  },
  {
    id: "lofi",
    label: "Chill / Lo-fi",
    deepPlusShare: "63%",
    stability: "Высокая",
    activity: "96",
    demand: "Умеренно",
    liquidity: "Mid",
  },
  {
    id: "indie",
    label: "Vocal / Indie",
    deepPlusShare: "44%",
    stability: "Переменная",
    activity: "88",
    demand: "Ниша",
    liquidity: "Thin",
  },
] as const;

export const MARKET_SECONDARY_SNAPSHOT = {
  resaleVolume: "4,62M USDT",
  activeLots: "1 842",
  medianExitHours: "18,4 ч",
  topDemand: "RS-218 · Neon Drift",
} as const;

export const MARKET_INSIGHT_ITEMS: {
  id: string;
  tag: string;
  body: string;
  /** Крупный акцент в стиле метрик обзора (mock). */
  metric: string;
  metricCaption: string;
  /** Второй абзац — контекст и нюансы. */
  detail: string;
}[] = [
  {
    id: "ins-flow",
    tag: "Первичка · 30D",
    metric: "+9",
    metricCaption: "раундов · vs пред. окно",
    body: "Рост интереса к новым размещениям: +9 первичных раундов за 30D vs предыдущее окно.",
    detail:
      "Поток заявок в первичку держится выше базовой линии три недели подряд; доля отмен до листинга ниже, чем в среднем по каталогу (mock, условные ед.).",
  },
  {
    id: "ins-premium",
    tag: "Premium",
    metric: "−18%",
    metricCaption: "отмена заявок · 30D",
    body: "Premium-сегмент: выше среднего time-on-deal и ниже отмена заявок на secondary.",
    detail:
      "Time-on-deal по премиум-лотам выше медианы площадки; secondary закрывается стабильнее — меньше «висящих» лимитов в стакане (mock).",
  },
  {
    id: "ins-spread",
    tag: "Стакан",
    metric: "−12%",
    metricCaption: "медиана спреда bid/ask",
    body: "По топ-жанрам спред bid/ask в первичке сузился относительно предыдущего окна — меньше проходов «в пустоту».",
    detail:
      "Сильнее всего сжатие в Electronic и Pop; в тонком стакане всё ещё встречаются проскальзывания — смотрите глубину по релизу (mock).",
  },
  {
    id: "ins-liquidity",
    tag: "Electronic · depth",
    metric: "Deep",
    metricCaption: "уровень ликвидности · стакан",
    body: "Ликвидность Electronic удерживается на уровне Deep — глубина стакана выше медианы по площадке.",
    detail:
      "Лимиты на покупку концентрируются у mid price; относительный объём на bid выше, чем у медианы по жанрам — проще найти контр-сделку (mock).",
  },
];
