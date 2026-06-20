import { describe, expect, it } from "vitest";

import {
  isListingPurchasable,
  isListingTerminalStatus,
  listingAvailabilitySortPriority,
  sortSecondaryMarketListings,
} from "./listing-availability.util";

describe("listing availability util", () => {
  it("active listing with units is purchasable", () => {
    expect(isListingPurchasable({ status: "active", unitsAvailable: 10 })).toBe(true);
  });

  it("sold listing is not purchasable", () => {
    expect(isListingPurchasable({ status: "sold_out", unitsAvailable: 0 })).toBe(false);
    expect(isListingTerminalStatus("sold_out")).toBe(true);
  });

  it("cancelled and expired listings are terminal", () => {
    expect(isListingTerminalStatus("cancelled")).toBe(true);
    expect(isListingTerminalStatus("expired")).toBe(true);
  });

  it("respects backend canBuy flag", () => {
    expect(
      isListingPurchasable({ status: "active", canBuy: false, unitsAvailable: 10 }),
    ).toBe(false);
  });

  it("default sort places active before sold", () => {
    const active = {
      status: "active",
      pricePerUnit: 5,
      change7dPct: 1,
      unitsAvailable: 10,
    };
    const sold = {
      status: "sold_out",
      pricePerUnit: 100,
      change7dPct: 50,
      unitsAvailable: 0,
    };
    expect(listingAvailabilitySortPriority("active")).toBeLessThan(
      listingAvailabilitySortPriority("sold_out"),
    );
    const sorted = sortSecondaryMarketListings([sold, active], "availability");
    expect(sorted[0]?.status).toBe("active");
  });
});
