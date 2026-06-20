import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";

import { I18nProvider } from "@/components/providers/i18n-provider";

const mocks = vi.hoisted(() => ({
  fetchSupportHelpCenterPageData: vi.fn(),
  isLiveHelpCenterEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/public-env", () => ({
  isLiveHelpCenterEnabled: mocks.isLiveHelpCenterEnabled,
}));

vi.mock("@/services/help-center.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/help-center.service")>();
  return {
    ...actual,
    fetchSupportHelpCenterPageData: mocks.fetchSupportHelpCenterPageData,
  };
});

vi.mock("@/components/support/support-help-announcements", () => ({
  SupportHelpAnnouncements: () => null,
}));

vi.mock("@/components/support/support-email-contact-panel", () => ({
  SupportEmailContactPanel: () => <div data-testid="contact-panel" />,
}));

import { SupportHelpCenterPage } from "@/components/support/support-help-center-page";

const sampleData = {
  categories: [
    {
      id: "c1",
      slug: "getting-started",
      title: "Начало работы",
      description: "Первые шаги",
      parentId: null,
      icon: null,
      sortOrder: 0,
    },
  ],
  categoryTree: [],
  allArticles: [
    {
      id: "a1",
      slug: "how-to-deposit",
      categoryId: "c1",
      title: "Как пополнить счёт",
      excerpt: "TRC20",
      sortOrder: 0,
      isFeatured: false,
      isPopular: true,
      isGettingStarted: true,
      viewCount: 0,
      publishedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  popularArticles: [
    {
      id: "a1",
      slug: "how-to-deposit",
      categoryId: "c1",
      title: "Как пополнить счёт",
      excerpt: "TRC20",
      sortOrder: 0,
      isFeatured: false,
      isPopular: true,
      isGettingStarted: true,
      viewCount: 0,
      publishedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  gettingStartedArticles: [
    {
      id: "a1",
      slug: "how-to-deposit",
      categoryId: "c1",
      title: "Как пополнить счёт",
      excerpt: "TRC20",
      sortOrder: 0,
      isFeatured: false,
      isPopular: true,
      isGettingStarted: true,
      viewCount: 0,
      publishedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

function renderPage() {
  return render(
    <I18nProvider initialLocale="ru">{React.createElement(SupportHelpCenterPage)}</I18nProvider>,
  );
}

describe("SupportHelpCenterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLiveHelpCenterEnabled.mockReturnValue(true);
    mocks.fetchSupportHelpCenterPageData.mockResolvedValue(sampleData);
  });

  it("renders API categories and popular articles in live mode", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Начало работы")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Как пополнить счёт").length).toBeGreaterThan(0);
    expect(mocks.fetchSupportHelpCenterPageData).toHaveBeenCalledWith("ru");
  });

  it("shows empty state when no categories returned", async () => {
    mocks.fetchSupportHelpCenterPageData.mockResolvedValue({
      categories: [],
      categoryTree: [],
      allArticles: [],
      popularArticles: [],
      gettingStartedArticles: [],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Категории пока не созданы.")).toBeInTheDocument();
    });
  });

  it("shows error state when API fails", async () => {
    mocks.fetchSupportHelpCenterPageData.mockRejectedValue(new Error("network"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /повтор/i })).toBeInTheDocument();
    });
  });

  it("filters content when user searches", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Начало работы")).toBeInTheDocument();
    });

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "пополн" } });

    await waitFor(() => {
      expect(screen.getByText("Результаты поиска")).toBeInTheDocument();
    });
    expect(screen.queryByText("Быстрые действия")).not.toBeInTheDocument();
    expect(screen.getAllByText("Как пополнить счёт").length).toBeGreaterThan(0);
  });

  it("shows search empty state for unknown query", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Начало работы")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz-no-match" } });

    await waitFor(() => {
      expect(
        screen.getByText("Ничего не найдено. Попробуйте другой запрос или создайте обращение."),
      ).toBeInTheDocument();
    });
  });
});
