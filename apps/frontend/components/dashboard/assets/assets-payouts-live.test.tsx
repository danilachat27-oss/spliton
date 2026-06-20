import { describe, expect, it, vi } from "vitest";

import { renderToStaticMarkup } from "react-dom/server";

import { PayoutsHistoryPageContent } from "@/components/dashboard/assets/payouts-history-page-content";

vi.mock("@/hooks/use-payouts-history-page", () => ({
  usePayoutsHistoryPage: () => ({
    live: true,
    filters: { type: "all", period: "all", q: "", sort: "newest", page: 1, pageSize: 20 },
    updateFilters: vi.fn(),
    setPage: vi.fn(),
    rows: null,
    total: 0,
    page: 1,
    pageSize: 20,
    hasMore: false,
    loading: false,
    error: "API unavailable",
    hasActiveFilters: false,
    reload: vi.fn(),
  }),
}));

vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "en",
  }),
}));

describe("assets payouts live guards", () => {
  it("live mode with API error shows error state, not mock payout history", () => {
    const html = renderToStaticMarkup(<PayoutsHistoryPageContent />);
    expect(html).toContain("errors.section.unavailable.title");
    expect(html).not.toContain("Offset");
    expect(html).not.toContain("TX-9K2A");
  });
});
