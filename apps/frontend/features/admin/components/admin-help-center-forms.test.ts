import { describe, expect, it } from "vitest";

import {
  helpArticleFormToPayload,
  validateHelpArticleForm,
  emptyHelpArticleForm,
} from "@/features/admin/components/admin-help-article-drawer";
import {
  helpCategoryFormToPayload,
  validateHelpCategoryForm,
  emptyHelpCategoryForm,
} from "@/features/admin/components/admin-help-category-drawer";

describe("admin help center forms", () => {
  it("validates category slug and title", () => {
    const form = emptyHelpCategoryForm();
    form.slug = "invalid slug!";
    expect(validateHelpCategoryForm(form).length).toBeGreaterThan(0);

    form.slug = "valid-slug";
    form.title.ru = "Категория";
    expect(validateHelpCategoryForm(form)).toEqual([]);
  });

  it("maps category form to API payload with ru translations", () => {
    const form = emptyHelpCategoryForm();
    form.slug = "Test-Slug";
    form.title.ru = "Заголовок";
    form.description.ru = "Описание";
    form.isPublished = true;

    const payload = helpCategoryFormToPayload(form);
    expect(payload.slug).toBe("test-slug");
    expect(payload.titleTranslations).toEqual({ ru: "Заголовок" });
    expect(payload.isPublished).toBe(true);
  });

  it("validates article requires slug and category", () => {
    const form = emptyHelpArticleForm();
    expect(validateHelpArticleForm(form).length).toBeGreaterThan(0);

    form.slug = "article-slug";
    form.categoryId = "cat-uuid";
    expect(validateHelpArticleForm(form)).toEqual([]);
  });

  it("maps article form flags and translations to payload", () => {
    const form = emptyHelpArticleForm();
    form.slug = "My-Article";
    form.categoryId = "cat-1";
    form.title.ru = "Title";
    form.content.ru = "Body";
    form.isPopular = true;
    form.isGettingStarted = true;

    const payload = helpArticleFormToPayload(form);
    expect(payload.slug).toBe("my-article");
    expect(payload.isPopular).toBe(true);
    expect(payload.isGettingStarted).toBe(true);
    expect(payload.contentTranslations).toEqual({ ru: "Body" });
  });
});
