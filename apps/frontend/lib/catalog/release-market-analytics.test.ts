import { describe, expect, it } from "vitest";

import {
  getMarketOverviewRowByCatalogId,
  resolveMockCatalogLookupKey,
} from "@/lib/catalog/release-market-analytics";

describe("resolveMockCatalogLookupKey", () => {
  it("maps catalog slug to mock market overview id", () => {
    expect(resolveMockCatalogLookupKey("midnight-code")).toBe("1");
  });

  it("keeps numeric catalog id", () => {
    expect(resolveMockCatalogLookupKey("1")).toBe("1");
  });
});

describe("getMarketOverviewRowByCatalogId", () => {
  it("finds row by catalog slug used in buy links", () => {
    const row = getMarketOverviewRowByCatalogId("midnight-code");
    expect(row?.id).toBe("1");
    expect(row?.symbol).toBe("RS-218");
  });
});
