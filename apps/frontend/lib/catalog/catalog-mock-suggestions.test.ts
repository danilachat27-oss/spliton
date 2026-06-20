import { describe, expect, it } from "vitest";

import { buildMockCatalogSuggestions } from "@/lib/catalog/catalog-mock-suggestions";

describe("buildMockCatalogSuggestions", () => {
  it("returns mock catalog matches without API", () => {
    const items = buildMockCatalogSuggestions("Midnight", 4);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.label).toContain("Midnight");
    expect(items[0]?.releaseId).toBeTruthy();
  });

  it("returns empty list for short queries", () => {
    expect(buildMockCatalogSuggestions("a")).toEqual([]);
  });
});
