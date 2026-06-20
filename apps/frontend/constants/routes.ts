export const ROUTES = {
  home: "/",
  trust: "/trust",
  /** Operator portal entry (staff only). */
  adminLogin: "/admin/login",
  /** Операторская панель (staff-роли; см. AdminLayoutClient). */
  admin: "/admin",
  adminOperatorTasks: "/admin/operator-tasks",
  adminUsers: "/admin/users",
  adminUserDetail: (id: string) => `/admin/users/${encodeURIComponent(id)}`,
  adminTracks: "/admin/tracks",
  /** @deprecated use adminTracks — releases are managed as tracks (Release model) */
  adminReleases: "/admin/releases",
  adminArtists: "/admin/artists",
  adminGenres: "/admin/genres",
  adminLabels: "/admin/labels",
  adminRounds: "/admin/rounds",
  adminWallets: "/admin/wallets",
  adminDeposits: "/admin/deposits",
  adminWithdrawals: "/admin/withdrawals",
  adminHoldings: "/admin/holdings",
  adminRevenue: "/admin/revenue",
  adminSecondaryMarket: "/admin/secondary-market",
  adminPlatformRevenue: "/admin/platform-revenue",
  adminReports: "/admin/reports",
  adminSupport: "/admin/support",
  adminDisputes: "/admin/disputes",
  adminDisputeDetail: (id: string) => `/admin/disputes?dispute=${encodeURIComponent(id)}`,
  adminNews: "/admin/news",
  adminHelpCenter: "/admin/help-center",
  adminSystemStatus: "/admin/system-status",
  dashboardSupport: "/dashboard/support",
  dashboardDisputes: "/dashboard/disputes",
  dashboardDisputeDetail: (id: string) => `/dashboard/disputes/${encodeURIComponent(id)}`,
  dashboardArtist: "/dashboard/artist",
  dashboardDocuments: "/dashboard/documents",
  dashboardStatements: "/dashboard/statements",
  dashboardSupportTicket: (id: string) => `/dashboard/support/${encodeURIComponent(id)}`,
  adminCompliance: "/admin/compliance",
  adminKyc: "/admin/kyc",
  adminReferrals: "/admin/referrals",
  adminLegal: "/admin/legal",
  adminTreasury: "/admin/treasury",
  adminSettings: "/admin/settings",
  adminAudit: "/admin/audit-log",
  /** @deprecated use adminAudit */
  adminAuditLegacy: "/admin/audit",
  adminRoles: "/admin/roles",
  adminAnalytics: "/admin/analytics",
  adminAnalyticsFinance: "/admin/analytics/finance",
  adminAnalyticsUsers: "/admin/analytics/users",
  adminAnalyticsTracks: "/admin/analytics/tracks",
  adminAnalyticsMarket: "/admin/analytics/market",
  adminAnalyticsRevenue: "/admin/analytics/revenue",
  adminAnalyticsRisk: "/admin/analytics/risk",
  adminAnalyticsOperations: "/admin/analytics/operations",
  dashboard: "/app",
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
  dashboardNotifications: "/dashboard/notifications",
  adminNotifications: "/admin/notifications",
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
  supportArticle: (slug: string) => `/support/articles/${encodeURIComponent(slug)}`,
  supportCategory: (slug: string) => `/support/categories/${encodeURIComponent(slug)}`,
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
  resetPassword: "/reset-password",
  terms: "/terms",
  privacy: "/privacy",
} as const;

/** Login with safe post-auth redirect (path only, no open redirect). */
export function loginPathWithNext(returnTo: string): string {
  const path = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : ROUTES.dashboard;
  return `${ROUTES.login}?next=${encodeURIComponent(path)}`;
}

/** Маршруты вкладки «Сервисы» — для подсветки активного пункта в хедере. */
export const DASHBOARD_MISC_PATHS: readonly string[] = [
  ROUTES.support,
  ROUTES.calculator,
  ROUTES.fees,
  ROUTES.systemStatus,
  ROUTES.news,
  ROUTES.referralProgram,
  ROUTES.partnerProgram,
  ROUTES.dashboardArtist,
  ROUTES.dashboardDisputes,
  ROUTES.dashboardStatements,
  ROUTES.trust,
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

/** Покупка UNT по релизу (id или slug релиза). */
export function catalogBuyUnitsPath(idOrSlug: string): string {
  const key = idOrSlug.trim();
  return `${ROUTES.dashboardCatalog}/buy/${encodeURIComponent(key)}`;
}

export function catalogBuyUnitsPathForRelease(release: { id: string; slug?: string | null }): string {
  return catalogBuyUnitsPath(release.slug?.trim() || release.id);
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
