import { cache } from "react";

import { catalogDetailToMarketRow } from "@/lib/catalog/catalog-adapter";
import { getMarketOverviewRowByCatalogId } from "@/lib/catalog/release-market-analytics";
import { isLiveCatalogEnabled, resolveCatalogReleaseForPage } from "@/services/catalog.service";
import type { MarketOverviewRow } from "@/types/market-overview";

/** Catalog release row for sell page (SSR-safe, no JWT). */
export const resolveSellPageCatalogRow = cache(async function resolveSellPageCatalogRow(
  id: string,
): Promise<MarketOverviewRow | null> {
  if (isLiveCatalogEnabled()) {
    const detail = await resolveCatalogReleaseForPage(id);
    if (!detail) return null;
    return catalogDetailToMarketRow(detail);
  }

  return getMarketOverviewRowByCatalogId(id) ?? null;
});
