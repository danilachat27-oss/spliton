/**
 * Single source of truth for Next.js public env (Spliton).
 * Mock data is allowed only in local development unless explicitly set to live.
 */

export type AppRuntimeMode = "development" | "staging" | "production";

export type DataSourceMode = "mock" | "live";

const LOCAL_DEV_API_DEFAULT = "http://localhost:4001";

function trimEnv(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

/**
 * Resolved deploy/runtime mode.
 * Intentionally not tied to NODE_ENV alone — `next build` always sets NODE_ENV=production locally.
 */
export function getAppRuntimeMode(): AppRuntimeMode {
  const explicit = trimEnv(process.env.NEXT_PUBLIC_APP_ENV)?.toLowerCase();
  if (explicit === "development" || explicit === "staging" || explicit === "production") {
    return explicit;
  }

  if (process.env.VERCEL_ENV === "preview") {
    return "staging";
  }

  if (process.env.VERCEL_ENV === "production") {
    return "production";
  }

  return "development";
}

export function isStrictDeployMode(mode: AppRuntimeMode = getAppRuntimeMode()): boolean {
  return mode === "staging" || mode === "production";
}

function parseDataSource(raw: string | undefined): DataSourceMode {
  const v = raw?.trim().toLowerCase();
  if (v === "live") return "live";
  if (v === "mock") return "mock";
  return "mock";
}

function readApiBaseUrlFromEnv(): string | undefined {
  return trimEnv(process.env.NEXT_PUBLIC_API_BASE_URL) ?? trimEnv(process.env.VITE_API_BASE_URL);
}

/**
 * Backend origin for user API (auth, wallet, catalog, support).
 * Staging/production must set NEXT_PUBLIC_API_BASE_URL at build time.
 */
export function getPublicApiBaseUrl(): string {
  const configured = readApiBaseUrlFromEnv();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (isStrictDeployMode()) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is required when NEXT_PUBLIC_APP_ENV is staging or production (or on Vercel production/preview without APP_ENV=development).",
    );
  }

  return LOCAL_DEV_API_DEFAULT;
}

/** Admin API origin (optional dedicated host). */
export function getAdminApiBaseUrl(): string {
  const dedicated = trimEnv(process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL);
  if (dedicated) {
    return dedicated.replace(/\/+$/, "");
  }
  return getPublicApiBaseUrl();
}

export function resolveApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicApiBaseUrl()}${normalizedPath}`;
}

export function resolveAdminApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAdminApiBaseUrl()}${normalizedPath}`;
}

export function getAdminDataSource(): DataSourceMode {
  const explicit = trimEnv(process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE);
  if (explicit) return parseDataSource(explicit);
  // Closed beta: admin reads real DB via API unless explicitly mock.
  return "live";
}

export function getWalletDataSource(): DataSourceMode {
  return parseDataSource(process.env.NEXT_PUBLIC_WALLET_DATA_SOURCE);
}

export function getCatalogDataSource(): DataSourceMode {
  const explicit = trimEnv(process.env.NEXT_PUBLIC_CATALOG_DATA_SOURCE);
  if (explicit) return parseDataSource(explicit);
  return getWalletDataSource();
}

export function getReleaseAnalyticsDataSource(): DataSourceMode {
  const explicit = trimEnv(process.env.NEXT_PUBLIC_RELEASE_ANALYTICS_DATA_SOURCE);
  if (explicit) return parseDataSource(explicit);
  return getCatalogDataSource();
}

export function getSupportDataSource(): DataSourceMode {
  return parseDataSource(process.env.NEXT_PUBLIC_SUPPORT_DATA_SOURCE);
}

export function getNewsDataSource(): DataSourceMode {
  return parseDataSource(process.env.NEXT_PUBLIC_NEWS_DATA_SOURCE);
}

export function getStatusDataSource(): DataSourceMode {
  return parseDataSource(process.env.NEXT_PUBLIC_STATUS_DATA_SOURCE);
}

export function isLiveNewsEnabled(): boolean {
  return getNewsDataSource() === "live";
}

export function isLiveStatusEnabled(): boolean {
  return getStatusDataSource() === "live";
}

/** Help Center knowledge base on /support (categories, articles). */
export function isLiveHelpCenterEnabled(): boolean {
  return getSupportDataSource() === "live";
}

/** Catalog list/buy uses dedicated catalog data source (falls back to wallet for compatibility). */
export function isLiveCatalogEnabled(): boolean {
  return getCatalogDataSource() === "live";
}

/** Release analytics page uses dedicated data source (falls back to catalog/wallet). */
export function isLiveReleaseAnalyticsEnabled(): boolean {
  return getReleaseAnalyticsDataSource() === "live";
}

export function getMarketOverviewDataSource(): DataSourceMode {
  const explicit = trimEnv(process.env.NEXT_PUBLIC_MARKET_OVERVIEW_DATA_SOURCE);
  if (explicit) return parseDataSource(explicit);
  return getCatalogDataSource();
}

/** Market overview page uses dedicated data source (falls back to catalog/wallet). */
export function isLiveMarketOverviewEnabled(): boolean {
  return getMarketOverviewDataSource() === "live";
}

export function getPortfolioDataSource(): DataSourceMode {
  const explicit = trimEnv(process.env.NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE);
  if (explicit) return parseDataSource(explicit);
  return getWalletDataSource();
}

/** Portfolio overview/metrics pages use dedicated data source (falls back to wallet). */
export function isLivePortfolioEnabled(): boolean {
  return getPortfolioDataSource() === "live";
}

export function getPayoutsDataSource(): DataSourceMode {
  const explicit = trimEnv(process.env.NEXT_PUBLIC_PAYOUTS_DATA_SOURCE);
  if (explicit) return parseDataSource(explicit);
  return getPortfolioDataSource();
}

/** Payouts section (overview, history, compare, deposit, withdraw). */
export function isLivePayoutsEnabled(): boolean {
  return getPayoutsDataSource() === "live";
}

export function getAuthDataSource(): DataSourceMode {
  const explicit = trimEnv(process.env.NEXT_PUBLIC_AUTH_DATA_SOURCE);
  if (explicit) return parseDataSource(explicit);
  return getWalletDataSource();
}

/** Account/profile pages (overview, verification, security, settings). */
export function isLiveAccountEnabled(): boolean {
  return getAuthDataSource() === "live";
}

/** True when account center may show demo/mock fallbacks (local dev only). */
export function isAccountCenterDemoMode(): boolean {
  return !isLiveAccountEnabled();
}

/**
 * In staging/production builds, validate-public-env forbids mock critical sources.
 * Use this to gate prototype query params (?verifyStatus=, ?securityState=).
 */
export function isAccountCenterPrototypeAllowed(): boolean {
  return !isStrictDeployMode();
}

export function getServicesDataSource(): DataSourceMode {
  const explicit = trimEnv(process.env.NEXT_PUBLIC_SERVICES_DATA_SOURCE);
  if (explicit) return parseDataSource(explicit);
  return getWalletDataSource();
}

/** Services megamenu section (calculator, fees, status, news, etc.). */
export function isLiveServicesEnabled(): boolean {
  return getServicesDataSource() === "live";
}

/** In live services mode, mock fallbacks for fee/status/news data are forbidden. */
export function isServicesMockFallbackAllowed(): boolean {
  return !isLiveServicesEnabled();
}

export function isExplicitMockMode(): boolean {
  return (
    getAdminDataSource() === "mock" ||
    getWalletDataSource() === "mock" ||
    getSupportDataSource() === "mock" ||
    getNewsDataSource() === "mock" ||
    getStatusDataSource() === "mock"
  );
}

export function isApiBaseUrlConfigured(): boolean {
  return Boolean(readApiBaseUrlFromEnv());
}

export type PublicEnvWarningCode =
  | "mock_data_source"
  | "api_base_url_missing"
  | "api_unreachable";

export type PublicEnvWarning = {
  code: PublicEnvWarningCode;
  message: string;
};

/** Dev-only advisory messages (console + optional UI banner). */
export function collectPublicEnvWarnings(): PublicEnvWarning[] {
  if (getAppRuntimeMode() !== "development") {
    return [];
  }

  const warnings: PublicEnvWarning[] = [];

  if (isExplicitMockMode()) {
    const parts: string[] = [];
    if (getAdminDataSource() === "mock") parts.push("ADMIN=mock");
    if (getWalletDataSource() === "mock") parts.push("WALLET=mock");
    if (getCatalogDataSource() === "mock") parts.push("CATALOG=mock");
    if (getSupportDataSource() === "mock") parts.push("SUPPORT=mock");
    if (getNewsDataSource() === "mock") parts.push("NEWS=mock");
    if (getStatusDataSource() === "mock") parts.push("STATUS=mock");
    warnings.push({
      code: "mock_data_source",
      message: `Демо-данные: ${parts.join(", ")}. Для биржи в проде задайте *_DATA_SOURCE=live.`,
    });
  }

  if (!isApiBaseUrlConfigured() && !isStrictDeployMode()) {
    warnings.push({
      code: "api_base_url_missing",
      message: `NEXT_PUBLIC_API_BASE_URL не задан — используется ${LOCAL_DEV_API_DEFAULT}.`,
    });
  }

  return warnings;
}

export function logPublicEnvWarnings(): void {
  for (const w of collectPublicEnvWarnings()) {
    console.warn(`[Spliton env] ${w.message}`);
  }
}
