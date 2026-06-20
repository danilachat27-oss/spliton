import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ProfileOverviewContent } from "@/components/dashboard/profile/profile-overview-content";
import { kycStatusLabel, securityEventLabel } from "@/lib/profile/overview-labels";

const mockFetchUserMe = vi.fn();
const mockFetchWalletSummary = vi.fn();
const mockListUserHoldings = vi.fn();

vi.mock("@/services/user-me.service", () => ({
  fetchUserMe: (...args: unknown[]) => mockFetchUserMe(...args),
}));

vi.mock("@/services/wallet.service", () => ({
  fetchWalletSummary: (...args: unknown[]) => mockFetchWalletSummary(...args),
  listUserHoldings: (...args: unknown[]) => mockListUserHoldings(...args),
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@example.com" },
    authorizedFetch: vi.fn(),
    isAuthenticated: true,
  }),
}));

vi.mock("@/lib/public-env", () => ({
  isLiveAccountEnabled: () => true,
  isAccountCenterDemoMode: () => false,
}));

vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "en",
  }),
}));

const accountCenter = {
  accountCompleteness: {
    score: 45,
    maxScore: 100,
    level: "MEDIUM",
    completedItems: ["email_verified"],
    missingItems: ["two_factor", "kyc_approved"],
  },
  security: {
    score: 55,
    maxScore: 100,
    level: "MEDIUM",
    recommendations: [],
    emailVerified: true,
    twoFactorEnabled: false,
    passwordSet: true,
    passwordChangedAt: null,
    activeSessionsCount: 1,
    lastLoginAt: null,
  },
  verification: {
    status: "NOT_STARTED",
    level: "NONE",
    canDeposit: true,
    canWithdraw: false,
    canBuyPrimary: false,
    canTradeSecondary: false,
  },
  legal: {
    missingRequiredConsentsCount: 0,
    hasAcceptedCurrentRequiredPolicies: true,
  },
  activity: {
    openSupportTicketsCount: 0,
    openDisputesCount: 0,
    unreadNotificationsCount: 2,
    pendingWithdrawalsCount: 0,
  },
  securityPreferences: {
    withdrawalEmailConfirmationEnabled: false,
    withdrawalAddressWhitelistEnabled: false,
    suspiciousLoginAlertsEnabled: true,
    emailSecurityNotificationsEnabled: true,
    enforcementReady: false,
  },
  recentSecurityEvents: [],
};

describe("profile overview labels", () => {
  it("maps KYC NOT_STARTED to i18n label", () => {
    expect(kycStatusLabel("NOT_STARTED", "en")).toBe("KYC not started");
  });

  it("maps security events to i18n labels", () => {
    expect(securityEventLabel("LOGOUT_ALL", "en")).toBe("All sessions ended");
  });
});

describe("profile overview live guards", () => {
  it("does not use hardcoded 3/5 security promo in overview files", () => {
    const dir = join(__dirname);
    const screenSource = readFileSync(join(dir, "profile-dashboard-screen.tsx"), "utf8");
    const overviewSource = readFileSync(join(dir, "profile-overview-content.tsx"), "utf8");
    const forbidden = ["current={3}", "max={5}", "SecurityPromoCard", "ShieldCheck"];
    for (const token of forbidden) {
      expect(screenSource).not.toContain(token);
      expect(overviewSource).not.toContain(token);
    }
  });
});

describe("ProfileOverviewContent", () => {
  beforeEach(() => {
    mockFetchUserMe.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      createdAt: "2025-01-01T00:00:00.000Z",
      accountCenter,
    });
    mockFetchWalletSummary.mockResolvedValue({ availableBalance: "100.00" });
    mockListUserHoldings.mockResolvedValue({ items: [] });
  });

  it("renders OKX-style overview with security score in sidebar", async () => {
    render(<ProfileOverviewContent />);

    await waitFor(() => {
      expect(mockFetchUserMe).toHaveBeenCalled();
    });

    expect(await screen.findByText("55")).toBeTruthy();
    expect(screen.getByText("profile.overview.viewProfile")).toBeTruthy();
    expect(screen.getByText("profile.overview.securityCard.title")).toBeTruthy();
    expect(screen.getByText("KYC not started")).toBeTruthy();
    expect(screen.getByText("profile.overview.sidebar.newsTitle")).toBeTruthy();
  });

  it("keeps profile visible when wallet API fails", async () => {
    mockFetchWalletSummary.mockRejectedValue(new Error("profile.overview.loadWalletError"));

    render(<ProfileOverviewContent />);

    expect(await screen.findByText("55")).toBeTruthy();
    expect(screen.getByText("errors.section.unavailable.title")).toBeTruthy();
  });
});
