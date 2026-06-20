import type { CatalogItem } from "@/lib/catalog-mock";
import type { MarketOverviewRow } from "@/types/market-overview";

export type CatalogPurchaseState = "available" | "sold_out" | "paused" | "unavailable";

export function catalogPurchaseStateSortPriority(
  purchaseState: CatalogPurchaseState | null | undefined,
): number {
  switch (purchaseState) {
    case "available":
      return 0;
    case "paused":
      return 1;
    case "sold_out":
      return 2;
    case "unavailable":
      return 3;
    default:
      return 4;
  }
}

export function catalogItemAvailabilityPriority(item: CatalogItem): number {
  if (item.kind === "funding") {
    return catalogPurchaseStateSortPriority(item.purchaseState);
  }
  return 0;
}

export function isCatalogPrimaryPurchasable(
  purchaseState: CatalogPurchaseState | null | undefined,
): boolean {
  return purchaseState === "available";
}

export function mapCatalogCardUiStatus(input: {
  catalogStatus?: string | null;
  purchaseState?: CatalogPurchaseState | null;
}): "open" | "payouts" {
  if (input.purchaseState === "available") return "open";
  if (input.purchaseState === "paused") return "open";
  if (input.catalogStatus === "open" && input.purchaseState != null) {
    return "payouts";
  }
  if (input.catalogStatus === "open") return "open";
  if (input.catalogStatus === "coming_soon") return "open";
  if (input.catalogStatus === "payouts" || input.catalogStatus === "sold_out") return "payouts";
  return "payouts";
}

export function mapPurchaseStateToMarketOverviewStatus(
  purchaseState: CatalogPurchaseState | null | undefined,
): MarketOverviewRow["status"] {
  switch (purchaseState) {
    case "available":
      return "Активен";
    case "paused":
      return "Пауза";
    case "sold_out":
      return "Закрыт";
    case "unavailable":
      return "Новый";
    default:
      return "Новый";
  }
}

export function deriveMockFundingPurchaseState(
  item: Extract<CatalogItem, { kind: "funding" }>,
): CatalogPurchaseState {
  if (item.purchaseState) return item.purchaseState;
  if (item.status === "open" && (item.availableUnits ?? 0) > 0) return "available";
  if (item.roundStatus === "completed" || item.pct >= 100) return "sold_out";
  if (item.status === "payouts") return "sold_out";
  return "unavailable";
}
