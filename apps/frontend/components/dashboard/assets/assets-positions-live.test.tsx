import { describe, expect, it, vi } from "vitest";

import { renderToStaticMarkup } from "react-dom/server";

import { PositionsPageContent } from "@/components/dashboard/assets/positions-page-content";

vi.mock("@/hooks/use-assets-positions-page", () => ({
  useAssetsPositionsPage: () => ({
    live: true,
    filters: {
      q: "",
      status: "__all__",
      genre: "__all__",
      sort: "value_desc",
      page: 1,
      pageSize: 20,
    },
    updateFilters: vi.fn(),
    setPage: vi.fn(),
    resetFilters: vi.fn(),
    rows: null,
    rawItems: null,
    total: 0,
    page: 1,
    pageSize: 20,
    genreOptions: [],
    loading: false,
    error: "positions.errorUnavailable",
    hasActiveFilters: false,
    reload: vi.fn(),
  }),
  POSITIONS_STATUS_ALL: "__all__",
  POSITIONS_GENRE_ALL: "__all__",
}));

vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "en",
  }),
}));

describe("assets positions live guards", () => {
  it("live mode with API error shows error state, not mock positions", () => {
    const html = renderToStaticMarkup(<PositionsPageContent />);
    expect(html).toContain("errors.section.unavailable.title");
    expect(html).not.toContain("Offset");
    expect(html).not.toContain("Midnight Drive");
  });
});
