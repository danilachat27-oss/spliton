import { describe, expect, it } from "vitest";

import type { CatalogItem } from "@/lib/catalog-mock";

import {
  catalogItemAvailabilityPriority,
  catalogPurchaseStateSortPriority,
  deriveMockFundingPurchaseState,
  isCatalogPrimaryPurchasable,
  mapCatalogCardUiStatus,
  mapPurchaseStateToMarketOverviewStatus,
} from "./catalog-purchase.util";

const fundingBase: Extract<CatalogItem, { kind: "funding" }> = {
  kind: "funding",
  id: "1",
  title: "Track",
  artist: "Artist",
  genre: "Pop",
  status: "open",
  raised: "1",
  goal: "2",
  pct: 50,
  availablePct: "50%",
  forecastYield: "10%",
  unitPriceUsdt: "10",
};

describe("catalog purchase util", () => {
  it("marks available release as purchasable", () => {
    expect(isCatalogPrimaryPurchasable("available")).toBe(true);
  });

  it("marks closed release as not purchasable", () => {
    expect(isCatalogPrimaryPurchasable("sold_out")).toBe(false);
    expect(isCatalogPrimaryPurchasable("paused")).toBe(false);
    expect(isCatalogPrimaryPurchasable("unavailable")).toBe(false);
  });

  it("prefers available releases in default sort priority", () => {
    expect(catalogPurchaseStateSortPriority("available")).toBeLessThan(
      catalogPurchaseStateSortPriority("sold_out"),
    );
  });

  it("does not show open strip when catalogStatus open but purchaseState is sold_out", () => {
    expect(
      mapCatalogCardUiStatus({ catalogStatus: "open", purchaseState: "sold_out" }),
    ).toBe("payouts");
  });

  it("maps purchaseState to market overview status without RU labels from API", () => {
    expect(mapPurchaseStateToMarketOverviewStatus("sold_out")).toBe("Закрыт");
    expect(mapPurchaseStateToMarketOverviewStatus("available")).toBe("Активен");
  });

  it("derives mock sold_out from payouts phase", () => {
    expect(
      deriveMockFundingPurchaseState({
        ...fundingBase,
        status: "payouts",
        pct: 100,
      }),
    ).toBe("sold_out");
  });

  it("catalog item availability priority places active funding first", () => {
    const active: CatalogItem = { ...fundingBase, purchaseState: "available" };
    const closed: CatalogItem = { ...fundingBase, id: "2", purchaseState: "sold_out" };
    expect(catalogItemAvailabilityPriority(active)).toBeLessThan(
      catalogItemAvailabilityPriority(closed),
    );
  });
});
