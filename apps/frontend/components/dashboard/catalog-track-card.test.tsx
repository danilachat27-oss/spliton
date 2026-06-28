import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/providers/i18n-provider";
import { CatalogTrackCard } from "@/components/dashboard/catalog-track-card";
import type { CatalogItem } from "@/lib/catalog-mock";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}));

const soldOutItem: CatalogItem = {
  kind: "funding",
  id: "sold-out-1",
  title: "Sold Out Track",
  artist: "Test Artist",
  genre: "Pop",
  status: "payouts",
  raised: "50 000",
  goal: "50 000",
  pct: 100,
  availablePct: "0%",
  forecastYield: "8%",
  unitPriceUsdt: "10,00",
  purchaseState: "sold_out",
  availableUnits: 0,
  roundStatus: "completed",
};

describe("CatalogTrackCard purchase gating", () => {
  it("does not link to buy page for sold out funding card", () => {
    render(
      <I18nProvider initialLocale="ru">
        <CatalogTrackCard item={soldOutItem} />
      </I18nProvider>,
    );

    expect(screen.getByText("Раунд завершён")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Купить UNT" })).not.toBeInTheDocument();
  });

  it("links to buy page when primary purchase is available", () => {
    render(
      <I18nProvider initialLocale="ru">
        <CatalogTrackCard
          item={{
            ...soldOutItem,
            purchaseState: "available",
            availableUnits: 120,
            slug: "sold-out-track",
          }}
        />
      </I18nProvider>,
    );

    const buyLink = screen.getByRole("link", { name: "Купить UNT" });
    expect(buyLink).toHaveAttribute("href", "/catalog/buy/sold-out-track");
  });

  it("links to secondary market view when listings exist", () => {
    render(
      <I18nProvider initialLocale="ru">
        <CatalogTrackCard
          item={{
            ...soldOutItem,
            secondaryMarketEnabled: true,
            activeListingsCount: 3,
          }}
        />
      </I18nProvider>,
    );

    const marketLink = screen.getByRole("link", { name: "Смотреть рынок" });
    expect(marketLink).toHaveAttribute("href", expect.stringContaining("/analytics/releases/sold-out-1"));
  });

  it("renders EN catalog card labels and formatting", () => {
    render(
      <I18nProvider initialLocale="en">
        <CatalogTrackCard
          item={{
            ...soldOutItem,
            purchaseState: "available",
            availableUnits: 120,
            statusLabel: "Available",
            forecastYield: "No data",
            unitPriceUsdt: "10.00",
            availablePct: "High",
          }}
        />
      </I18nProvider>,
    );

    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByText("10.00")).toBeInTheDocument();
    expect(screen.queryByText(/[А-Яа-яЁё]/)).not.toBeInTheDocument();
  });
});
