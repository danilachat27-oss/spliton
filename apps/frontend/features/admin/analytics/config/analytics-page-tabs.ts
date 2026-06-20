export type AnalyticsPageTab = { id: string; label: string };

export const ANALYTICS_OVERVIEW_TABS: AnalyticsPageTab[] = [
  { id: "overview", label: "Обзор" },
  { id: "finance", label: "Финансы" },
  { id: "users", label: "Пользователи" },
  { id: "market", label: "Рынок" },
  { id: "risk", label: "Риски и поддержка" },
  { id: "insights", label: "Инсайты" },
];

export const ANALYTICS_FINANCE_TABS: AnalyticsPageTab[] = [
  { id: "overview", label: "Обзор" },
  { id: "cashflow", label: "Денежный поток" },
  { id: "fees", label: "Комиссии" },
  { id: "deposits", label: "Пополнения" },
  { id: "withdrawals", label: "Выводы" },
  { id: "failures", label: "Ошибки и ручная проверка" },
  { id: "detail", label: "Детализация" },
];

export const ANALYTICS_USERS_TABS: AnalyticsPageTab[] = [
  { id: "overview", label: "Обзор" },
  { id: "growth", label: "Рост" },
  { id: "funnel", label: "Воронка" },
  { id: "segments", label: "Сегменты" },
  { id: "retention", label: "Удержание" },
  { id: "holders", label: "Топ держатели" },
  { id: "risk", label: "Риски" },
];

export const ANALYTICS_TRACKS_TABS: AnalyticsPageTab[] = [
  { id: "overview", label: "Обзор" },
  { id: "releases", label: "Релизы" },
  { id: "rounds", label: "Раунды" },
  { id: "units", label: "Юниты" },
  { id: "holders", label: "Держатели" },
  { id: "revenue", label: "Доход" },
  { id: "readiness", label: "Готовность релизов" },
  { id: "market", label: "Вторичный рынок" },
];

export const ANALYTICS_MARKET_TABS: AnalyticsPageTab[] = [
  { id: "overview", label: "Обзор" },
  { id: "orderbook", label: "Стакан листингов" },
  { id: "trades", label: "Сделки" },
  { id: "prices", label: "Цены и спред" },
  { id: "liquidity", label: "Ликвидность" },
  { id: "participants", label: "Участники" },
  { id: "fees", label: "Комиссии" },
  { id: "risk", label: "Риски" },
];

export const ANALYTICS_REVENUE_TABS: AnalyticsPageTab[] = [
  { id: "overview", label: "Обзор" },
  { id: "events", label: "Доходы релизов" },
  { id: "pipeline", label: "Пайплайн начислений" },
  { id: "shares", label: "Распределение долей" },
  { id: "by_release", label: "Начисления по релизам" },
  { id: "errors", label: "Ошибки и retry" },
  { id: "reconciliation", label: "Сверка с ledger" },
];

export const ANALYTICS_RISK_TABS: AnalyticsPageTab[] = [
  { id: "overview", label: "Обзор" },
  { id: "queue", label: "Очередь риска" },
  { id: "severity", label: "Критичность и типы" },
  { id: "rules", label: "Правила риска" },
  { id: "sla", label: "SLA / aging" },
  { id: "high_value", label: "Крупные операции" },
  { id: "repeat", label: "Повторные пользователи" },
  { id: "freezes", label: "Заморозки и блокировки" },
];

export const ANALYTICS_OPERATIONS_TABS: AnalyticsPageTab[] = [
  { id: "overview", label: "Обзор" },
  { id: "queue", label: "Очередь поддержки" },
  { id: "sla", label: "SLA" },
  { id: "categories", label: "Категории" },
  { id: "finance", label: "Финансовые обращения" },
  { id: "escalations", label: "Эскалации" },
  { id: "workload", label: "Нагрузка менеджеров" },
  { id: "quality", label: "Качество обработки" },
];
