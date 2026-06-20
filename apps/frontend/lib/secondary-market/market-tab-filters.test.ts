import { describe, expect, it } from "vitest";

import {
  DEFAULT_MARKET_TAB_FILTERS,
  marketTabFiltersToApiQuery,
} from "./market-tab-filters";

describe("marketTabFiltersToApiQuery", () => {
  it("maps segment liquid to liquidity high", () => {
    const query = marketTabFiltersToApiQuery(
      { ...DEFAULT_MARKET_TAB_FILTERS, segment: "liquid" },
      "",
    );
    expect(query.liquidity).toBe("high");
    expect(query.genre).toBeUndefined();
  });

  it("passes debounced search and numeric ranges to API query", () => {
    const query = marketTabFiltersToApiQuery(
      {
        ...DEFAULT_MARKET_TAB_FILTERS,
        status: "active",
        priceMin: "10",
        priceMax: "50",
        unitsMin: "5",
      },
      "nova",
    );
    expect(query.search).toBe("nova");
    expect(query.status).toBe("active");
    expect(query.priceMin).toBe(10);
    expect(query.priceMax).toBe(50);
    expect(query.unitsMin).toBe(5);
  });
});
