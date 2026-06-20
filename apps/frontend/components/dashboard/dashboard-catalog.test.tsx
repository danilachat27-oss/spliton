import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { I18nProvider } from "@/components/providers/i18n-provider";
import { BackendAvailabilityProvider } from "@/components/providers/backend-availability-provider";
import { catalogItems } from "@/lib/catalog-mock";

import { DashboardCatalogSection } from "./dashboard-catalog";

function renderWithI18n(ui: React.ReactElement) {
  return render(
    <I18nProvider initialLocale="ru">
      <BackendAvailabilityProvider>{ui}</BackendAvailabilityProvider>
    </I18nProvider>,
  );
}

const mocks = vi.hoisted(() => ({
  isLiveCatalogEnabled: vi.fn(() => true),
  loadLiveCatalogItems: vi.fn(),
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
  isLiveCatalogEnabled: mocks.isLiveCatalogEnabled,
  loadLiveCatalogItems: mocks.loadLiveCatalogItems,
}));

const mockFirstTitle = catalogItems[0]!.title;
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

describe("DashboardCatalogSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLiveCatalogEnabled.mockReturnValue(true);
    mocks.loadLiveCatalogItems.mockResolvedValue({ items: [liveApiItem], total: 1 });
  });

  it("live + API success shows API releases, not catalog-mock", async () => {
    renderWithI18n(<DashboardCatalogSection />);

    await waitFor(() => {
      expect(screen.getByTestId("catalog-card")).toHaveTextContent("Live API Release Alpha");
    });

    expect(screen.queryByText(mockFirstTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(/Демо-карточки/i)).not.toBeInTheDocument();
  });

  it("live + API error shows error and retry without mock fallback", async () => {
    mocks.loadLiveCatalogItems.mockRejectedValue(new TypeError("Failed to fetch"));

    renderWithI18n(<DashboardCatalogSection />);

    await waitFor(() => {
      expect(screen.getByText("Раздел временно недоступен")).toBeInTheDocument();
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    expect(screen.queryByTestId("catalog-card")).not.toBeInTheDocument();
    expect(screen.queryByText(mockFirstTitle)).not.toBeInTheDocument();

    mocks.loadLiveCatalogItems.mockResolvedValue({ items: [liveApiItem], total: 1 });
    fireEvent.click(screen.getByRole("button", { name: /Повторить/i }));

    await waitFor(() => {
      expect(screen.getByTestId("catalog-card")).toHaveTextContent("Live API Release Alpha");
    });
  });

  it("mock mode shows demo label and mock preview items", async () => {
    mocks.isLiveCatalogEnabled.mockReturnValue(false);

    renderWithI18n(<DashboardCatalogSection />);

    await waitFor(() => {
      expect(screen.getByText(/Демо-карточки каталога/i)).toBeInTheDocument();
    });

    const cards = screen.getAllByTestId("catalog-card");
    expect(cards[0]).toHaveTextContent(mockFirstTitle);
    expect(cards).toHaveLength(4);
    expect(mocks.loadLiveCatalogItems).not.toHaveBeenCalled();
  });
});
