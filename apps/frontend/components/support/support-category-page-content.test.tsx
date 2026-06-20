import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";

import { I18nProvider } from "@/components/providers/i18n-provider";

const mocks = vi.hoisted(() => ({
  fetchHelpCategoryBySlug: vi.fn(),
  isLiveHelpCenterEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/public-env", () => ({
  isLiveHelpCenterEnabled: mocks.isLiveHelpCenterEnabled,
}));

vi.mock("@/services/help-center.service", () => ({
  fetchHelpCategoryBySlug: mocks.fetchHelpCategoryBySlug,
}));

vi.mock("@/components/dashboard/dashboard-header", () => ({
  DashboardHeader: () => <header data-testid="dashboard-header" />,
}));

import { SupportCategoryPageContent } from "@/components/support/support-category-page-content";

function renderPage(slug = "getting-started") {
  return render(
    <I18nProvider initialLocale="ru">
      {React.createElement(SupportCategoryPageContent, { slug })}
    </I18nProvider>,
  );
}

describe("SupportCategoryPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLiveHelpCenterEnabled.mockReturnValue(true);
  });

  it("renders category title and article list from API", async () => {
    mocks.fetchHelpCategoryBySlug.mockResolvedValue({
      category: {
        id: "c1",
        slug: "getting-started",
        parentId: null,
        title: "Начало работы",
        description: "Первые шаги",
        icon: null,
        sortOrder: 0,
      },
      articles: [
        {
          id: "a1",
          slug: "create-account",
          categoryId: "c1",
          title: "Создание аккаунта",
          excerpt: "Регистрация",
          sortOrder: 0,
          isFeatured: false,
          isPopular: false,
          isGettingStarted: true,
          viewCount: 0,
          publishedAt: null,
        },
      ],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Начало работы" })).toBeInTheDocument();
    });
    expect(screen.getByText("Создание аккаунта")).toBeInTheDocument();
    expect(mocks.fetchHelpCategoryBySlug).toHaveBeenCalledWith("getting-started", "ru");
  });

  it("shows empty articles message when category has no articles", async () => {
    mocks.fetchHelpCategoryBySlug.mockResolvedValue({
      category: { title: "Пустая категория", description: "" },
      articles: [],
    });

    renderPage("empty-cat");

    await waitFor(() => {
      expect(screen.getByText("Статьи пока не опубликованы.")).toBeInTheDocument();
    });
  });

  it("shows error when category is not found", async () => {
    mocks.fetchHelpCategoryBySlug.mockResolvedValue(null);

    renderPage("unknown");

    await waitFor(() => {
      expect(screen.getByText("Страница не найдена или материал снят с публикации.")).toBeInTheDocument();
    });
  });
});
