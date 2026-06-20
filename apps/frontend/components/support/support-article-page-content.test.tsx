import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";

import { I18nProvider } from "@/components/providers/i18n-provider";

const mocks = vi.hoisted(() => ({
  fetchHelpArticleBySlug: vi.fn(),
  isLiveHelpCenterEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/public-env", () => ({
  isLiveHelpCenterEnabled: mocks.isLiveHelpCenterEnabled,
}));

vi.mock("@/services/help-center.service", () => ({
  fetchHelpArticleBySlug: mocks.fetchHelpArticleBySlug,
}));

vi.mock("@/components/dashboard/dashboard-header", () => ({
  DashboardHeader: () => <header data-testid="dashboard-header" />,
}));

import { SupportArticlePageContent } from "@/components/support/support-article-page-content";

function renderPage(slug = "how-to-deposit") {
  return render(
    <I18nProvider initialLocale="ru">
      {React.createElement(SupportArticlePageContent, { slug })}
    </I18nProvider>,
  );
}

describe("SupportArticlePageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLiveHelpCenterEnabled.mockReturnValue(true);
  });

  it("renders article title and body from API", async () => {
    mocks.fetchHelpArticleBySlug.mockResolvedValue({
      article: {
        title: "Как пополнить счёт",
        excerpt: "TRC20 инструкция",
        content: "Пошаговая инструкция",
        breadcrumbs: [{ slug: "deposits", title: "Депозиты" }],
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Как пополнить счёт" })).toBeInTheDocument();
    });
    expect(screen.getByText("Пошаговая инструкция")).toBeInTheDocument();
    expect(screen.getByText("Депозиты")).toBeInTheDocument();
    expect(mocks.fetchHelpArticleBySlug).toHaveBeenCalledWith("how-to-deposit", "ru");
  });

  it("shows error when article is not found", async () => {
    mocks.fetchHelpArticleBySlug.mockResolvedValue(null);

    renderPage("missing-slug");

    await waitFor(() => {
      expect(screen.getByText("Страница не найдена или материал снят с публикации.")).toBeInTheDocument();
    });
  });
});
