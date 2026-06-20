import type { LotPurchaseFailedKind } from "@/lib/secondary-market/classify-lot-purchase-error";

export type LotPurchaseStep = "actions" | "confirm" | "processing" | "success" | "failed";

export type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

export const LOT_PURCHASE_DEPOSIT_PATH = "/assets/payouts/deposit";

export function formatLotMessage(template: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );
}

export function failedTitleKey(kind: LotPurchaseFailedKind): string {
  switch (kind) {
    case "insufficient_funds":
      return "secondaryMarket.lotPurchase.insufficientFundsTitle";
    case "listing_unavailable":
      return "secondaryMarket.lotPurchase.listingUnavailableTitle";
    case "price_changed":
      return "secondaryMarket.lotPurchase.priceChangedTitle";
    case "network":
      return "secondaryMarket.lotPurchase.networkErrorTitle";
    default:
      return "secondaryMarket.lotPurchase.failedGenericTitle";
  }
}

export function failedBodyKey(kind: LotPurchaseFailedKind): string {
  switch (kind) {
    case "insufficient_funds":
      return "secondaryMarket.lotPurchase.insufficientFundsBody";
    case "listing_unavailable":
      return "secondaryMarket.lotPurchase.listingUnavailableBody";
    case "price_changed":
      return "secondaryMarket.lotPurchase.priceChangedBody";
    case "network":
      return "secondaryMarket.lotPurchase.networkErrorBody";
    default:
      return "secondaryMarket.lotPurchase.failedGenericBody";
  }
}
