export const LISTING_TERMINAL_STATUSES = ["sold_out", "cancelled", "expired"] as const;

export type ListingAvailabilityStatus =
  | "active"
  | "paused"
  | "sold_out"
  | "cancelled"
  | "expired"
  | string;

export function listingAvailabilitySortPriority(status: ListingAvailabilityStatus | undefined): number {
  switch (status) {
    case "active":
      return 0;
    case "paused":
      return 1;
    case "sold_out":
      return 2;
    case "cancelled":
      return 3;
    case "expired":
      return 4;
    default:
      return 5;
  }
}

export function isListingTerminalStatus(status: ListingAvailabilityStatus | undefined): boolean {
  return LISTING_TERMINAL_STATUSES.includes(status as (typeof LISTING_TERMINAL_STATUSES)[number]);
}

export function isListingPurchasable(input: {
  status?: ListingAvailabilityStatus;
  canBuy?: boolean;
  unitsAvailable?: number;
}): boolean {
  if (input.canBuy != null) return input.canBuy;
  return input.status === "active" && (input.unitsAvailable ?? 0) > 0;
}

export function listingEffectiveStatus(
  listing: { status?: ListingAvailabilityStatus },
): ListingAvailabilityStatus {
  return listing.status ?? "active";
}

export function listingEffectiveCanBuy(
  listing: {
    status?: ListingAvailabilityStatus;
    canBuy?: boolean;
    unitsAvailable?: number;
  },
): boolean {
  return isListingPurchasable({
    status: listingEffectiveStatus(listing),
    canBuy: listing.canBuy,
    unitsAvailable: listing.unitsAvailable,
  });
}

export type SecondaryMarketListingSortKey = "availability" | "price_asc" | "price_desc" | "change_desc" | "units_desc";

export function sortSecondaryMarketListings<T extends {
  status?: ListingAvailabilityStatus;
  pricePerUnit: number;
  change7dPct: number;
  unitsAvailable: number;
}>(
  items: T[],
  sort: SecondaryMarketListingSortKey = "availability",
): T[] {
  const arr = [...items];
  arr.sort((a, b) => {
    const tierDiff =
      listingAvailabilitySortPriority(listingEffectiveStatus(a)) -
      listingAvailabilitySortPriority(listingEffectiveStatus(b));
    if (tierDiff !== 0) return tierDiff;

    switch (sort) {
      case "price_asc":
        return a.pricePerUnit - b.pricePerUnit;
      case "price_desc":
        return b.pricePerUnit - a.pricePerUnit;
      case "change_desc":
        return b.change7dPct - a.change7dPct;
      case "units_desc":
        return b.unitsAvailable - a.unitsAvailable;
      default:
        return 0;
    }
  });
  return arr;
}
