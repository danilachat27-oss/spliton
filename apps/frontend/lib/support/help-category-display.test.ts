import { describe, expect, it } from "vitest";

import {
  filterPublicHelpCategories,
  isJunkHelpCategory,
  isPlaceholderHelpCategoryTitle,
  resolveHelpCategoryTitle,
} from "@/lib/support/help-category-display";
import type { HelpCategoryPublic } from "@/services/help-center.service";

function category(partial: Partial<HelpCategoryPublic> & Pick<HelpCategoryPublic, "id" | "slug">): HelpCategoryPublic {
  return {
    parentId: null,
    title: "Cat",
    description: "",
    icon: null,
    sortOrder: 0,
    ...partial,
  };
}

describe("help-category-display", () => {
  it("treats Cat as placeholder title", () => {
    expect(isPlaceholderHelpCategoryTitle("Cat")).toBe(true);
    expect(isPlaceholderHelpCategoryTitle("Начало работы")).toBe(false);
  });

  it("filters junk e2e categories", () => {
    expect(isJunkHelpCategory(category({ id: "1", slug: "live-cat-1234567890" }))).toBe(true);
    expect(isJunkHelpCategory(category({ id: "2", slug: "getting-started", title: "Cat" }))).toBe(false);
  });

  it("resolves known slug via i18n key", () => {
    const t = (key: string) =>
      key === "support.categories.getting-started.title" ? "Начало работы" : key;
    expect(
      resolveHelpCategoryTitle(category({ id: "3", slug: "getting-started", title: "Cat" }), t),
    ).toBe("Начало работы");
  });

  it("deduplicates categories by slug", () => {
    const items = filterPublicHelpCategories([
      category({ id: "1", slug: "getting-started", title: "Cat" }),
      category({ id: "2", slug: "getting-started", title: "Duplicate" }),
      category({ id: "3", slug: "live-cat-1234567890" }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.slug).toBe("getting-started");
  });
});
