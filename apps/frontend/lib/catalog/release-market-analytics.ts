import { catalogItems } from "@/lib/catalog-mock";
import { MARKET_OVERVIEW_ROWS } from "@/mocks/market-overview-rows";
import { buildReleaseMarketAnalyticsPageData } from "@/mocks/catalog/release-market-analytics.mock";
import { catalogDetailToMarketRow } from "@/lib/catalog/catalog-adapter";
import { adaptMarketOverviewRow } from "@/lib/market-overview/market-overview-adapter";
import { fetchCatalogReleaseById, isLiveCatalogEnabled } from "@/services/catalog.service";
import { fetchMarketOverviewDetail } from "@/services/market-overview.service";
import type { ReleaseMarketAnalyticsPageData } from "@/types/catalog/release-market-analytics";
import type { MarketOverviewRow } from "@/types/market-overview";

/** Нормализует id/slug из URL покупки к mock catalog id (для `/catalog/buy/[slug]`). */
export function resolveMockCatalogLookupKey(idOrSlug: string): string {
  const key = idOrSlug.trim();
  if (!key) return key;
  const direct = MARKET_OVERVIEW_ROWS.find((r) => r.id === key);
  if (direct) return direct.id;
  const fromCatalog = catalogItems.find((item) => item.id === key || item.slug === key);
  return fromCatalog?.id ?? key;
}

/** Mock catalog ids only — use `resolveMarketOverviewRowForPage` on buy routes in live mode. */
export function getMarketOverviewRowByCatalogId(idOrSlug: string): MarketOverviewRow | undefined {
  const key = resolveMockCatalogLookupKey(idOrSlug);
  return MARKET_OVERVIEW_ROWS.find((r) => r.id === key);
}

/** Server/client: live UUID from API, else mock row. */
export async function resolveMarketOverviewRowForPage(
  id: string,
): Promise<MarketOverviewRow | undefined> {
  if (isLiveCatalogEnabled()) {
    const catalog = await fetchCatalogReleaseById(id);
    if (catalog) return catalogDetailToMarketRow(catalog);
    try {
      const detail = await fetchMarketOverviewDetail(id);
      return adaptMarketOverviewRow(detail.overview);
    } catch {
      return undefined;
    }
  }
  return getMarketOverviewRowByCatalogId(id);
}

export function getCatalogReleaseMarketAnalyticsPageData(idOrSlug: string): ReleaseMarketAnalyticsPageData | undefined {
  const row = getMarketOverviewRowByCatalogId(idOrSlug);
  if (!row) return undefined;
  return buildReleaseMarketAnalyticsPageData(row);
}
