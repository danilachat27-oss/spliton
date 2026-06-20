import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { DashboardCatalogSection } from "@/components/dashboard/dashboard-catalog";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { BackendAvailabilityProvider } from "@/components/providers/backend-availability-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { catalogItems } from "@/lib/catalog-mock";

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <I18nProvider initialLocale="ru">
      <BackendAvailabilityProvider>{ui}</BackendAvailabilityProvider>
    </I18nProvider>,
  );
}

const catalogMocks = vi.hoisted(() => ({
  isLiveCatalogEnabled: vi.fn(() => true),
  loadLiveCatalogItems: vi.fn(),
  fetchCatalogStats: vi.fn(),
}));

const statsMocks = vi.hoisted(() => ({
  getWalletDataSource: vi.fn<() => "mock" | "live">(() => "live"),
  fetchMarketOverviewList: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}));

vi.mock("@/components/dashboard/catalog-track-card", () => ({
  CatalogTrackCard: ({ item }: { item: { title: string } }) => (
    <div data-testid="catalog-card">{item.title}</div>
  ),
}));

vi.mock("@/services/catalog.service", () => ({
  isLiveCatalogEnabled: catalogMocks.isLiveCatalogEnabled,
  loadLiveCatalogItems: catalogMocks.loadLiveCatalogItems,
  fetchCatalogStats: catalogMocks.fetchCatalogStats,
}));

vi.mock("@/services/wallet.service", () => ({
  getWalletDataSource: statsMocks.getWalletDataSource,
}));

vi.mock("@/services/market-overview.service", () => ({
  fetchMarketOverviewList: statsMocks.fetchMarketOverviewList,
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    authorizedFetch: vi.fn(),
    isAuthenticated: false,
  }),
}));

describe("backend unavailable UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    catalogMocks.isLiveCatalogEnabled.mockReturnValue(true);
    statsMocks.getWalletDataSource.mockReturnValue("live");
  });

  it("shows one global notice and neutral section states when multiple APIs fail", async () => {
    catalogMocks.loadLiveCatalogItems.mockRejectedValue(new TypeError("Failed to fetch"));
    statsMocks.fetchMarketOverviewList.mockRejectedValue(new TypeError("Failed to fetch"));
    catalogMocks.fetchCatalogStats.mockRejectedValue(new TypeError("Failed to fetch"));

    renderWithProviders(
      <div>
        <DashboardStats />
        <DashboardCatalogSection />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByText("Данные временно недоступны")).toBeInTheDocument();
    });

    const globalNotices = screen.getAllByText("Данные временно недоступны");
    expect(globalNotices).toHaveLength(1);

    const sectionStates = screen.getAllByText("Раздел временно недоступен");
    expect(sectionStates.length).toBeGreaterThanOrEqual(2);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/Каталог временно недоступен/i)).not.toBeInTheDocument();
  });

  it("retries catalog section without mock fallback in live mode", async () => {
    const liveApiItem = {
      kind: "funding" as const,
      id: "live-uuid-1",
      title: "Live API Release Alpha",
      artist: "API Artist",
      genre: "Pop",
      status: "open" as const,
      raised: "10 000",
      goal: "50 000",
      pct: 20,
      availablePct: "5%",
      forecastYield: "9%",
      unitPriceUsdt: "12,00",
    };

    catalogMocks.loadLiveCatalogItems
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({ items: [liveApiItem], total: 1 });

    renderWithProviders(<DashboardCatalogSection />);

    await waitFor(() => {
      expect(screen.getByText("Раздел временно недоступен")).toBeInTheDocument();
    });

    const retryButtons = screen.getAllByRole("button", { name: /Повторить/i });
    fireEvent.click(retryButtons[retryButtons.length - 1]!);

    await waitFor(() => {
      expect(screen.getByTestId("catalog-card")).toHaveTextContent("Live API Release Alpha");
    });

    expect(screen.queryByText(catalogItems[0]!.title)).not.toBeInTheDocument();
  });
});
