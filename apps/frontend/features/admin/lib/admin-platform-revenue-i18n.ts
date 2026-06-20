/** Labels, colors and tooltips for platform revenue section. */

export const PLATFORM_REVENUE_SOURCE_COLORS: Record<string, string> = {
  primary_purchase_fee: "#2563eb",
  withdrawal_fee: "#f59e0b",
  secondary_market_fee: "#8b5cf6",
  premium: "#06b6d4",
  private_deals: "#64748b",
  manual: "#71717a",
  other: "#a1a1aa",
};

export const PLATFORM_REVENUE_FIELD_TOOLTIPS = {
  totalRevenue: "Сумма всех комиссий Spliton за всё время.",
  periodRevenue: "Доход платформы за выбранный период фильтра.",
  delta: "Изменение суммы комиссий относительно предыдущего периода той же длины.",
  primaryFee: "Комиссия с первичных покупок юнитов.",
  withdrawalFee: "Фиксированная или процентная комиссия с выводов USDT.",
  secondaryFee: "Комиссия со сделок вторичного рынка.",
  avgFee: "Средняя сумма одной комиссионной транзакции за период.",
} as const;

const SOURCE_LABELS: Record<string, string> = {
  primary_purchase_fee: "Комиссия первичной покупки",
  withdrawal_fee: "Комиссия вывода",
  secondary_market_fee: "Комиссия вторичного рынка",
  premium: "Премиум",
  private_deals: "Частные сделки",
  manual: "Ручные начисления",
  other: "Другое",
  platform_fee: "Комиссия платформы",
  secondary_fee: "Комиссия вторичного рынка",
};

const SUBJECT_LABELS: Record<string, string> = {
  primary_order: "Первичный заказ",
  withdrawal: "Вывод",
  secondary_trade: "Сделка вторичного рынка",
  manual: "Ручное",
};

export function platformRevenueSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source.replace(/_/g, " ");
}

export function platformRevenueSourceColor(source: string): string {
  return PLATFORM_REVENUE_SOURCE_COLORS[source] ?? "#71717a";
}

export function platformRevenueSubjectLabel(subjectType: string): string {
  return SUBJECT_LABELS[subjectType] ?? subjectType;
}

export function deltaTone(delta: number | null | undefined): "up" | "down" | "neutral" {
  if (delta === null || delta === undefined) return "neutral";
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "neutral";
}

export const PLATFORM_REVENUE_SOURCE_OPTIONS = [
  { value: "all", label: "Все источники" },
  { value: "primary_purchase_fee", label: platformRevenueSourceLabel("primary_purchase_fee") },
  { value: "withdrawal_fee", label: platformRevenueSourceLabel("withdrawal_fee") },
  { value: "secondary_market_fee", label: platformRevenueSourceLabel("secondary_market_fee") },
  { value: "premium", label: platformRevenueSourceLabel("premium") },
  { value: "manual", label: platformRevenueSourceLabel("manual") },
] as const;

export const PLATFORM_REVENUE_GROUP_OPTIONS = [
  { value: "day", label: "По дням" },
  { value: "week", label: "По неделям" },
  { value: "month", label: "По месяцам" },
] as const;

export const PLATFORM_REVENUE_CHART = {
  accent: "#ec4899",
  accentHover: "#db2777",
  incomeTrendTitle: "График дохода",
  incomeTrendDescription: "Как менялась выручка за выбранный период",
  incomeByDayTitle: "Доход по дням",
  incomeByDayDescription: "Разбивка выручки по каждому дню",
} as const;
