import { isCatalogPrimaryPurchasable, type CatalogPurchaseState } from "@/lib/catalog/catalog-purchase.util";

export type CatalogBuyPurchaseState = CatalogPurchaseState;

export function isCatalogBuyBlocked(
  purchaseState: CatalogBuyPurchaseState | null | undefined,
  catalogLive: boolean,
  row?: { availableUnits?: number; status?: string },
): purchaseState is Exclude<CatalogBuyPurchaseState, "available"> {
  if (catalogLive) {
    return Boolean(purchaseState && !isCatalogPrimaryPurchasable(purchaseState));
  }
  if (purchaseState && !isCatalogPrimaryPurchasable(purchaseState)) return true;
  if ((row?.availableUnits ?? 1) <= 0) return true;
  if (row?.status === "Закрыт" || row?.status === "Пауза") return true;
  return false;
}

export function resolveBlockedCatalogPurchaseState(
  purchaseState: CatalogBuyPurchaseState | null | undefined,
  row?: { status?: string },
): Exclude<CatalogBuyPurchaseState, "available"> {
  if (purchaseState === "sold_out" || purchaseState === "paused" || purchaseState === "unavailable") {
    return purchaseState;
  }
  return row?.status === "Пауза" ? "paused" : "sold_out";
}

export function catalogBuyUnavailableCopy(
  purchaseState: Exclude<CatalogBuyPurchaseState, "available">,
  t: (key: string) => string,
): { title: string; description: string } {
  switch (purchaseState) {
    case "sold_out":
      return {
        title: t("catalog.buy.unavailable.soldOut.title"),
        description: t("catalog.buy.unavailable.soldOut.description"),
      };
    case "paused":
      return {
        title: t("catalog.buy.unavailable.paused.title"),
        description: t("catalog.buy.unavailable.paused.description"),
      };
    default:
      return {
        title: t("catalog.buy.unavailable.noRound.title"),
        description: t("catalog.buy.unavailable.noRound.description"),
      };
  }
}
