/**
 * Build-time guard: production/staging must not ship with mock data sources or missing API URL.
 */

import {
  getAdminDataSource,
  getAppRuntimeMode,
  getAuthDataSource,
  getCatalogDataSource,
  getMarketOverviewDataSource,
  getNewsDataSource,
  getPayoutsDataSource,
  getPortfolioDataSource,
  getReleaseAnalyticsDataSource,
  getServicesDataSource,
  getStatusDataSource,
  getSupportDataSource,
  getWalletDataSource,
  isApiBaseUrlConfigured,
  isStrictDeployMode,
  type DataSourceMode,
} from "./public-env";

export type PublicDataSourceGuardEntry = {
  envKey: string;
  resolve: () => DataSourceMode;
  /** User-facing financial/catalog flows — must resolve to live in staging/production. */
  critical: boolean;
  inheritanceHint?: string;
};

/** All NEXT_PUBLIC_*_DATA_SOURCE flags validated at build time in strict deploy mode. */
export const PUBLIC_DATA_SOURCE_GUARD_ENTRIES: PublicDataSourceGuardEntry[] = [
  {
    envKey: "NEXT_PUBLIC_WALLET_DATA_SOURCE",
    resolve: getWalletDataSource,
    critical: true,
    inheritanceHint: "root flag — portfolio/catalog/payouts inherit from here when unset",
  },
  {
    envKey: "NEXT_PUBLIC_CATALOG_DATA_SOURCE",
    resolve: getCatalogDataSource,
    critical: true,
    inheritanceHint: "inherits NEXT_PUBLIC_WALLET_DATA_SOURCE when unset",
  },
  {
    envKey: "NEXT_PUBLIC_MARKET_OVERVIEW_DATA_SOURCE",
    resolve: getMarketOverviewDataSource,
    critical: true,
    inheritanceHint: "inherits catalog → wallet when unset",
  },
  {
    envKey: "NEXT_PUBLIC_RELEASE_ANALYTICS_DATA_SOURCE",
    resolve: getReleaseAnalyticsDataSource,
    critical: true,
    inheritanceHint: "inherits catalog → wallet when unset",
  },
  {
    envKey: "NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE",
    resolve: getPortfolioDataSource,
    critical: true,
    inheritanceHint: "inherits NEXT_PUBLIC_WALLET_DATA_SOURCE when unset",
  },
  {
    envKey: "NEXT_PUBLIC_PAYOUTS_DATA_SOURCE",
    resolve: getPayoutsDataSource,
    critical: true,
    inheritanceHint: "inherits portfolio → wallet when unset",
  },
  {
    envKey: "NEXT_PUBLIC_SERVICES_DATA_SOURCE",
    resolve: getServicesDataSource,
    critical: true,
    inheritanceHint: "inherits NEXT_PUBLIC_WALLET_DATA_SOURCE when unset",
  },
  {
    envKey: "NEXT_PUBLIC_AUTH_DATA_SOURCE",
    resolve: getAuthDataSource,
    critical: true,
    inheritanceHint: "inherits NEXT_PUBLIC_WALLET_DATA_SOURCE when unset",
  },
  {
    envKey: "NEXT_PUBLIC_SUPPORT_DATA_SOURCE",
    resolve: getSupportDataSource,
    critical: true,
  },
  {
    envKey: "NEXT_PUBLIC_NEWS_DATA_SOURCE",
    resolve: getNewsDataSource,
    critical: true,
  },
  {
    envKey: "NEXT_PUBLIC_STATUS_DATA_SOURCE",
    resolve: getStatusDataSource,
    critical: true,
  },
  {
    envKey: "NEXT_PUBLIC_ADMIN_DATA_SOURCE",
    resolve: getAdminDataSource,
    critical: true,
  },
];

function formatMockSourceError(entry: PublicDataSourceGuardEntry, mode: string): string {
  const resolved = entry.resolve();
  const scope = entry.critical ? "critical user-facing" : "admin";
  const hint = entry.inheritanceHint ? ` (${entry.inheritanceHint})` : "";
  return (
    `${entry.envKey} must resolve to "live" for ${mode} builds (${scope} section). ` +
    `Resolved: "${resolved}". Set ${entry.envKey}=live explicitly in deploy env${hint}.`
  );
}

export function validatePublicEnvForBuild(): void {
  const mode = getAppRuntimeMode();
  if (!isStrictDeployMode(mode)) {
    return;
  }

  const errors: string[] = [];

  if (!isApiBaseUrlConfigured()) {
    errors.push("NEXT_PUBLIC_API_BASE_URL is required for staging/production builds.");
  }

  for (const entry of PUBLIC_DATA_SOURCE_GUARD_ENTRIES) {
    if (entry.resolve() !== "live") {
      errors.push(formatMockSourceError(entry, mode));
    }
  }

  if (errors.length > 0) {
    const header = `[Spliton] Invalid public env for ${mode} build:\n`;
    throw new Error(header + errors.map((e) => `  - ${e}`).join("\n"));
  }
}
