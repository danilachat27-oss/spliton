import { cache } from "react";

import { catalogDetailToMarketRow } from "@/lib/catalog/catalog-adapter";
import { deriveMockFundingPurchaseState } from "@/lib/catalog/catalog-purchase.util";
import { catalogItems } from "@/lib/catalog-mock";
import {
  getCatalogReleaseMarketAnalyticsPageData,
  getMarketOverviewRowByCatalogId,
  resolveMockCatalogLookupKey,
} from "@/lib/catalog/release-market-analytics";
import { isLiveCatalogEnabled, resolveCatalogReleaseForPage } from "@/services/catalog.service";
import type { CatalogReleaseDetailApi } from "@/services/catalog.service";
import type { MarketOverviewRow } from "@/types/market-overview";
import type { CatalogPrimaryRoundPublic } from "@/services/catalog.service";

export type CatalogBuyPageData = {
  row: MarketOverviewRow;
  detail: CatalogReleaseDetailApi | null;
  primaryRound: CatalogPrimaryRoundPublic | null;
  purchaseState: CatalogReleaseDetailApi["purchaseState"] | null;
};

export const resolveCatalogBuyPageData = cache(async function resolveCatalogBuyPageData(
  id: string,
): Promise<CatalogBuyPageData | null> {
  if (isLiveCatalogEnabled()) {
    const detail = await resolveCatalogReleaseForPage(id);
    if (!detail) return null;
    return {
      row: catalogDetailToMarketRow(detail),
      detail,
      primaryRound: detail.primaryRound,
      purchaseState: detail.purchaseState,
    };
  }

  const catalogId = resolveMockCatalogLookupKey(id);
  const row = getMarketOverviewRowByCatalogId(catalogId);
  if (!row || !getCatalogReleaseMarketAnalyticsPageData(catalogId)) return null;

  const catalogItem = catalogItems.find((item) => item.id === catalogId);
  const purchaseState =
    catalogItem?.kind === "funding"
      ? deriveMockFundingPurchaseState(catalogItem)
      : null;

  const alignedRow =
    catalogItem?.kind === "funding" && purchaseState !== "available"
      ? {
          ...row,
          availableUnits: catalogItem.availableUnits ?? row.availableUnits,
          status:
            purchaseState === "sold_out"
              ? "Закрыт"
              : purchaseState === "paused"
                ? "Пауза"
                : row.status,
        }
      : row;

  return { row: alignedRow, detail: null, primaryRound: null, purchaseState };
});
