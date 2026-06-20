import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchHelpCategories,
  groupArticlesByCategory,
  searchHelpContent,
  type HelpArticleSummary,
  type HelpCategoryPublic,
} from "@/services/help-center.service";

describe("help-center.service", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_DATA_SOURCE", "live");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://127.0.0.1:4001");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("fetchHelpCategories calls public API in live mode", async () => {
    const mockCategories = {
      locale: "ru",
      items: [{ id: "1", slug: "getting-started", title: "Start", description: "", parentId: null, icon: null, sortOrder: 0 }],
      tree: [],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockCategories,
      }),
    );

    const res = await fetchHelpCategories("ru");
    expect(res.items).toHaveLength(1);
    expect(res.items[0]?.slug).toBe("getting-started");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/help/categories"),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("returns empty categories when not in live mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_DATA_SOURCE", "mock");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchHelpCategories("ru");
    expect(res.items).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("searchHelpContent matches categories and articles", () => {
    const categories: HelpCategoryPublic[] = [
      {
        id: "c1",
        slug: "deposits",
        title: "Депозиты",
        description: "Пополнение USDT",
        parentId: null,
        icon: null,
        sortOrder: 0,
      },
    ];
    const articles: HelpArticleSummary[] = [
      {
        id: "a1",
        slug: "how-to-deposit",
        categoryId: "c1",
        title: "Как пополнить",
        excerpt: "TRC20 инструкция",
        sortOrder: 0,
        isFeatured: false,
        isPopular: true,
        isGettingStarted: false,
        viewCount: 0,
        publishedAt: null,
      },
    ];

    const hit = searchHelpContent("пополн", categories, articles);
    expect(hit.categories.some((c) => c.slug === "deposits")).toBe(true);
    expect(hit.articles.some((a) => a.slug === "how-to-deposit")).toBe(true);

    const miss = searchHelpContent("unknown-query-xyz", categories, articles);
    expect(miss.categories).toHaveLength(0);
    expect(miss.articles).toHaveLength(0);
  });

  it("groupArticlesByCategory groups and sorts by sortOrder", () => {
    const articles: HelpArticleSummary[] = [
      {
        id: "a2",
        slug: "b",
        categoryId: "c1",
        title: "B",
        excerpt: "",
        sortOrder: 2,
        isFeatured: false,
        isPopular: false,
        isGettingStarted: false,
        viewCount: 0,
        publishedAt: null,
      },
      {
        id: "a1",
        slug: "a",
        categoryId: "c1",
        title: "A",
        excerpt: "",
        sortOrder: 1,
        isFeatured: false,
        isPopular: false,
        isGettingStarted: false,
        viewCount: 0,
        publishedAt: null,
      },
    ];
    const map = groupArticlesByCategory(articles);
    expect(map.get("c1")?.map((a) => a.slug)).toEqual(["a", "b"]);
  });
});
