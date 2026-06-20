import { buildCatalogListQuery, mapCatalogKindToApi, mapCatalogSortToApi } from "@/lib/catalog/catalog-api-query";

describe("catalog api query", () => {
  it("maps kind and sort to backend contract", () => {
    expect(mapCatalogKindToApi("market")).toBe("secondary");
    expect(mapCatalogKindToApi("funding")).toBe("primary");
    expect(mapCatalogSortToApi("title_asc")).toBe("title_asc");
    expect(mapCatalogSortToApi("yield_desc")).toBe("yield_desc");
  });

  it("builds server-side query params", () => {
    const params = buildCatalogListQuery({
      search: "neon",
      kind: "market",
      phase: "open",
      genre: "Electronic",
      sort: "volume24h_desc",
      minPrice: "10",
      maxPrice: "100",
      page: 2,
      pageSize: 24,
    });

    expect(params.search).toBe("neon");
    expect(params.kind).toBe("secondary");
    expect(params.status).toBe("open");
    expect(params.genre).toBe("Electronic");
    expect(params.sort).toBe("volume24h_desc");
    expect(params.page).toBe("2");
    expect(params.pageSize).toBe("24");
  });
});
