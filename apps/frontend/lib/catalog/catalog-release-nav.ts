import { analyticsReleaseDetailPath, catalogBuyUnitsPathForRelease } from "@/constants/routes";
import type { CatalogItem } from "@/lib/catalog-mock";

import { isCatalogPrimaryPurchasable } from "./catalog-purchase.util";

export function catalogReleaseDetailHref(release: { id: string; slug?: string | null }): string {
  return `${analyticsReleaseDetailPath(release.id)}?from=catalog`;
}

export function catalogReleasePrimaryHref(item: CatalogItem): string {
  if (item.kind === "funding" && isCatalogPrimaryPurchasable(item.purchaseState)) {
    return catalogBuyUnitsPathForRelease(item);
  }
  return catalogReleaseDetailHref(item);
}
