export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  dashboardOverview: "/assets/overview",
  dashboardMetrics: "/assets/metrics",
  dashboardPositions: "/assets/positions",
  dashboardPayouts: "/assets/payouts",
  dashboardPayoutsComparison: "/assets/payouts/comparison",
  dashboardPayoutsHistory: "/assets/payouts/history",
  dashboardActivity: "/assets/activity",
  dashboardStatement: "/dashboard/statement",
  /** Кабинет: профиль, верификация, безопасность (макет в стиле exchange account). */
  dashboardProfile: "/dashboard/profile",
  myAssetsOverview: "/assets/overview",
  /** Сегмент продажи UNT из кабинета (динамический `[id]` каталожного релиза). */
  myAssetsSellUnits: "/assets/sell",
  myAssetsPositionsStructure: "/assets/positions",
  myAssetsMetrics: "/assets/metrics",
  myAssetsOperations: "/assets/activity",
  myAssetsPayouts: "/assets/payouts",
  myAssetsDocuments: "/dashboard/statement",
  dashboardCatalog: "/catalog",
  /** Внутренний secondary market: стакан, ордера, история (workspace) */
  dashboardSecondaryMarket: "/dashboard/secondary-market",
  /** Параметры карточки релиза в каталоге (educational) */
  catalogReleaseParameters: "/catalog/release-parameters",
  catalogMarketOverview: "/catalog/market-overview",
  analyticsReleases: "/analytics/releases",
  guideSelection: "/guide/selection",
  guideDealStructure: "/guide/deal-structure",
  /** Центр поддержки и база знаний (отдельная страница из хедера). */
  support: "/support",
  /** Раздел «Сервисы» в хедере: вспомогательные страницы */
  /** Объяснение внутренней единицы UNT (Spliton). */
  assetsUnt: "/assets/unt",
  calculator: "/assets/calculator",
  fees: "/fees",
  systemStatus: "/system-status",
  news: "/news",
  referralProgram: "/referral-program",
  partnerProgram: "/partner-program",
  login: "/login",
  register: "/register",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  terms: "/terms",
  privacy: "/privacy",
} as const;

/** Маршруты вкладки «Сервисы» — для подсветки активного пункта в хедере. */
export const DASHBOARD_MISC_PATHS: readonly string[] = [
  ROUTES.support,
  ROUTES.calculator,
  ROUTES.fees,
  ROUTES.systemStatus,
  ROUTES.news,
  ROUTES.referralProgram,
  ROUTES.partnerProgram,
];

/** Карточка релиза в разделе аналитики (mock, динамический id). */
export function analyticsReleaseDetailPath(id: string): string {
  return `${ROUTES.analyticsReleases}/${encodeURIComponent(id)}`;
}

/**
 * Персональный экран по релизу (заявки, позиция, My Ledger). `view=ledger`.
 * Не путать с карточкой актива — для CTA «Открыть релиз» используйте {@link analyticsReleaseDetailPath} + при необходимости только `from=`.
 */
export function analyticsReleasePersonalLedgerPath(id: string, opts?: { from?: string }): string {
  const p = new URLSearchParams();
  p.set("view", "ledger");
  if (opts?.from) p.set("from", opts.from);
  return `${analyticsReleaseDetailPath(id)}?${p.toString()}`;
}

/** Аналитика релиза из контекста обзора рынка (каталог). */
export function catalogMarketOverviewReleaseAnalyticsPath(id: string): string {
  return `${ROUTES.catalogMarketOverview}/analytics/${encodeURIComponent(id)}`;
}

/** Обзор рынка с фокусом на строке релиза (query `release` = каталожный id). */
export function catalogMarketOverviewReleaseTablePath(id: string): string {
  return `${ROUTES.catalogMarketOverview}?release=${encodeURIComponent(id)}`;
}

/** Покупка UNT по релизу (макет оформления; id — каталожный id mock-строки). */
export function catalogBuyUnitsPath(id: string): string {
  return `${ROUTES.dashboardCatalog}/buy/${encodeURIComponent(id)}`;
}

/** Продажа UNT из кабинета (лимитная цена; id — каталожный id mock-строки). */
export function assetsSellUnitsPath(id: string): string {
  return `${ROUTES.myAssetsSellUnits}/${encodeURIComponent(id)}`;
}

/** Страница лота на вторичке — параметры предложения (id из макета, например `lst-mnr`). */
export function secondaryMarketListingInfoPath(listingId: string): string {
  return `${ROUTES.dashboardSecondaryMarket}/l/${encodeURIComponent(listingId)}`;
}

/** Полноэкранный стакан по инструменту (макет: `mnr`, `sgn`, `vlt`). */
export function secondaryMarketBookPath(marketId: string): string {
  return `${ROUTES.dashboardSecondaryMarket}/book/${encodeURIComponent(marketId)}`;
}

/**
 * Торговая аналитика вторичного рынка по релизу (`releaseId` = slug из макета листингов, напр. `midnight-run`).
 * Не путать с `/analytics/releases/[id]` — там аналитика актива (выплаты, доли, performance).
 */
export function secondaryMarketReleaseAnalyticsPath(releaseId: string): string {
  const p = new URLSearchParams();
  p.set("tab", "analytics");
  p.set("release", releaseId);
  return `${ROUTES.dashboardSecondaryMarket}?${p.toString()}`;
}
