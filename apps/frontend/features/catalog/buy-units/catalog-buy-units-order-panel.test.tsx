import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { loginPathWithNext } from "@/constants/routes";
import { BUY_PANEL_TEST_RELEASE_ID, makeBuyPanelTestRow } from "@/test/fixtures/catalog-buy-row";

import { I18nProvider } from "@/components/providers/i18n-provider";

import { CatalogBuyUnitsOrderPanel } from "./catalog-buy-units-order-panel";

function renderPanel(ui: React.ReactElement) {
  return render(<I18nProvider initialLocale="ru">{ui}</I18nProvider>);
}

const mocks = vi.hoisted(() => ({
  authorizedFetch: vi.fn(),
  createPrimaryOrder: vi.fn(),
  fetchPrimaryRound: vi.fn(),
  fetchPrimaryOrderPreview: vi.fn(),
  getWalletDataSource: vi.fn<() => "mock" | "live">(() => "live"),
  isLiveCatalogEnabled: vi.fn(() => true),
  useAuth: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("@/services/wallet.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/wallet.service")>();
  return {
    ...actual,
    getWalletDataSource: mocks.getWalletDataSource,
    createPrimaryOrder: mocks.createPrimaryOrder,
    fetchPrimaryRound: mocks.fetchPrimaryRound,
    fetchPrimaryOrderPreview: mocks.fetchPrimaryOrderPreview,
  };
});

vi.mock("@/services/catalog.service", () => ({
  isLiveCatalogEnabled: mocks.isLiveCatalogEnabled,
}));

vi.mock("@/services/legal.service", () => ({
  fetchEligibility: vi.fn().mockResolvedValue({ allowed: true }),
  fetchLegalCenter: vi.fn().mockResolvedValue({ missingConsents: { primaryPurchase: [] } }),
  LEGAL_API_PATHS: { eligibilityPrimary: "/eligibility" },
}));

vi.mock("./buy-units-payment-result-modal", () => ({
  BuyUnitsPaymentResultModal: () => null,
}));

vi.mock("@/components/compliance/compliance-eligibility-banner", () => ({
  ComplianceEligibilityBanner: () => null,
}));

vi.mock("@/components/compliance/legal-consent-modal", () => ({
  LegalConsentModal: () => null,
}));

function mockAuth(partial: { isAuthenticated: boolean; isLoading?: boolean }) {
  mocks.useAuth.mockReturnValue({
    authorizedFetch: mocks.authorizedFetch,
    isAuthenticated: partial.isAuthenticated,
    isLoading: partial.isLoading ?? false,
  });
}

const liveRound = {
  roundId: "22222222-2222-4222-8222-222222222222",
  pricePerUnit: "10",
  availableUnits: "100",
  primaryPurchaseFeePct: "2",
};

const livePreview = {
  canPurchase: true,
  grossAmount: "10",
  feeAmount: "0.2",
  totalPaid: "10.2",
};

const liveOrderResult = {
  orderId: "33333333-3333-4333-8333-333333333333",
  units: "1",
  pricePerUnit: "10",
  grossAmount: "10",
};

describe("CatalogBuyUnitsOrderPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.getWalletDataSource.mockReturnValue("live");
    mocks.isLiveCatalogEnabled.mockReturnValue(true);
    mocks.fetchPrimaryRound.mockResolvedValue(liveRound);
    mocks.fetchPrimaryOrderPreview.mockResolvedValue(livePreview);
    mocks.createPrimaryOrder.mockResolvedValue(liveOrderResult);
  });

  it("live + unauthenticated shows login gate without purchase button", () => {
    mockAuth({ isAuthenticated: false });

    renderPanel(<CatalogBuyUnitsOrderPanel row={makeBuyPanelTestRow()} />);

    expect(screen.getByTestId("buy-login-gate")).toBeInTheDocument();
    const buyReturnPath = `/catalog/buy/${encodeURIComponent(BUY_PANEL_TEST_RELEASE_ID)}`;
    expect(screen.getByTestId("buy-login-cta")).toHaveAttribute(
      "href",
      loginPathWithNext(buyReturnPath),
    );
    expect(screen.queryByRole("button", { name: /Купить юниты/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Демо-режим/i)).not.toBeInTheDocument();
    expect(mocks.createPrimaryOrder).not.toHaveBeenCalled();
  });

  it("mock mode shows demo label and demo purchase button", () => {
    mocks.getWalletDataSource.mockReturnValue("mock");
    mockAuth({ isAuthenticated: false });

    renderPanel(<CatalogBuyUnitsOrderPanel row={makeBuyPanelTestRow()} />);

    expect(screen.getByText(/Пример оформления покупки/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Купить юниты \(демо\)/i })).toBeInTheDocument();
  });

  it("live + authenticated renders live purchase button", async () => {
    mockAuth({ isAuthenticated: true });

    renderPanel(<CatalogBuyUnitsOrderPanel row={makeBuyPanelTestRow()} />);

    expect(screen.queryByText(/Демо-режим/i)).not.toBeInTheDocument();
    expect(await screen.findByTestId("buy-submit-button")).toBeInTheDocument();
  });

  it("live + authenticated purchase calls createPrimaryOrder only after click", async () => {
    mockAuth({ isAuthenticated: true });

    renderPanel(<CatalogBuyUnitsOrderPanel row={makeBuyPanelTestRow()} />);

    const buyButton = await screen.findByTestId("buy-submit-button");
    expect(mocks.createPrimaryOrder).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(mocks.fetchPrimaryOrderPreview).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(buyButton).not.toBeDisabled();
    });

    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(mocks.createPrimaryOrder).toHaveBeenCalledWith(
        liveRound.roundId,
        1,
        mocks.authorizedFetch,
      );
    });
  });
});
