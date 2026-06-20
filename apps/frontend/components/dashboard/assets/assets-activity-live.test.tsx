import { describe, expect, it, vi } from "vitest";

import { renderToStaticMarkup } from "react-dom/server";

import { ActivityPageContent } from "@/components/dashboard/assets/activity-page-content";

vi.mock("@/hooks/use-assets-activity-page", () => ({
  useAssetsActivityPage: () => ({
    live: true,
    filters: {
      tab: "all",
      period: "30d",
      releaseId: "__all__",
      status: "__all__",
      direction: "all",
      sort: "newest",
      q: "",
      page: 1,
      pageSize: 20,
    },
    updateFilters: vi.fn(),
    setPage: vi.fn(),
    records: null,
    total: 0,
    page: 1,
    pageSize: 20,
    hasMore: false,
    releaseOptions: [],
    loading: false,
    error: "activity.errorUnavailable",
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

describe("assets activity live guards", () => {
  it("live mode with API error shows error state, not mock activity", () => {
    const html = renderToStaticMarkup(<ActivityPageContent />);
    expect(html).toContain("errors.section.unavailable.title");
    expect(html).not.toContain("TX-9K2A-11");
    expect(html).not.toContain("Offset");
  });
});
