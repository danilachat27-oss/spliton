import { describe, expect, it } from "vitest";

import type { CatalogItem } from "@/lib/catalog-mock";

import { catalogMatchesFilters, sortCatalogItems, validateNumericRange } from "./catalog-filter";

const activeFunding: CatalogItem = {
  kind: "funding",
  id: "a",
  title: "Active",
  artist: "A",
  genre: "Pop",
  status: "open",
  purchaseState: "available",
  raised: "1",
  goal: "2",
  pct: 40,
  availablePct: "40%",
  forecastYield: "12%",
  unitPriceUsdt: "20",
};

const closedFunding: CatalogItem = {
  ...activeFunding,
  id: "b",
  title: "Closed",
  purchaseState: "sold_out",
  status: "payouts",
  forecastYield: "20%",
};

describe("catalog filter validation", () => {
  it("rejects min price greater than max", () => {
    expect(validateNumericRange("100", "50").invalid).toBe(true);
  });

  it("accepts valid price range", () => {
    const range = validateNumericRange("10", "50");
    expect(range.invalid).toBe(false);
    expect(range.min).toBe(10);
    expect(range.max).toBe(50);
  });

  it("ignores negative numbers", () => {
    expect(validateNumericRange("-5", "10").min).toBeUndefined();
  });
});

describe("catalog filters", () => {
  it("filters by status phase open", () => {
    expect(
      catalogMatchesFilters(activeFunding, {
        kind: "all",
        phase: "open",
        genre: "",
        query: "",
        minPrice: "",
        maxPrice: "",
        minProgress: "",
        minYield: "",
      }),
    ).toBe(true);
    expect(
      catalogMatchesFilters(closedFunding, {
        kind: "all",
        phase: "open",
        genre: "",
        query: "",
        minPrice: "",
        maxPrice: "",
        minProgress: "",
        minYield: "",
      }),
    ).toBe(false);
  });

  it("combines search with genre filter", () => {
    expect(
      catalogMatchesFilters(activeFunding, {
        kind: "all",
        phase: "all",
        genre: "Pop",
        query: "active",
        minPrice: "",
        maxPrice: "",
        minProgress: "",
        minYield: "",
      }),
    ).toBe(true);
    expect(
      catalogMatchesFilters(activeFunding, {
        kind: "all",
        phase: "all",
        genre: "Rock",
        query: "active",
        minPrice: "",
        maxPrice: "",
        minProgress: "",
        minYield: "",
      }),
    ).toBe(false);
  });

  it("default sort places active before closed even when closed has higher yield", () => {
    const order = new Map([
      ["a", 0],
      ["b", 1],
    ]);
    const sorted = sortCatalogItems([closedFunding, activeFunding], "yield_desc", order);
    expect(sorted[0]?.id).toBe("a");
    expect(sorted[1]?.id).toBe("b");
  });
});
