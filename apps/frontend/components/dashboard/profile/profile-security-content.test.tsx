import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ProfileSecurityContent } from "@/components/dashboard/profile/profile-security-content";
import { securityRecommendationText } from "@/lib/profile/security-labels";

const mockFetchUserMe = vi.fn();
const mockFetchUserSessions = vi.fn();
const mockFetchSecurityEvents = vi.fn();
const mockFetchSecurityPreferences = vi.fn();
const mockFetchNotificationPreferences = vi.fn();

vi.mock("@/services/user-me.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/user-me.service")>();
  return {
    ...actual,
    fetchUserMe: (...args: unknown[]) => mockFetchUserMe(...args),
    fetchUserSessions: (...args: unknown[]) => mockFetchUserSessions(...args),
    fetchSecurityEvents: (...args: unknown[]) => mockFetchSecurityEvents(...args),
    fetchSecurityPreferences: (...args: unknown[]) => mockFetchSecurityPreferences(...args),
    changeUserPassword: vi.fn(),
    patchSecurityPreferences: vi.fn(),
    revokeUserSession: vi.fn(),
    logoutAllUserSessions: vi.fn(),
  };
});

vi.mock("@/services/notifications.service", () => ({
  fetchNotificationPreferences: (...args: unknown[]) => mockFetchNotificationPreferences(...args),
  patchNotificationPreferences: vi.fn(),
}));

vi.mock("@/components/dashboard/profile/profile-two-factor-panel", () => ({
  ProfileTwoFactorPanel: () => <div data-testid="two-fa-panel" />,
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@example.com" },
    authorizedFetch: vi.fn(),
    isAuthenticated: true,
    resendEmail: vi.fn(),
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
  accountCompleteness: { score: 40, maxScore: 100, level: "MEDIUM", completedItems: [], missingItems: [] },
  security: {
    score: 62,
    maxScore: 100,
    level: "MEDIUM",
    recommendations: [{ code: "ENABLE_2FA", title: "x", description: "y", severity: "HIGH", isCompleted: false, actionHref: "/dashboard/profile?tab=security" }],
    emailVerified: true,
    twoFactorEnabled: false,
    passwordSet: true,
    passwordChangedAt: "2025-06-01T00:00:00.000Z",
    activeSessionsCount: 1,
    lastLoginAt: null,
  },
  verification: { status: "NOT_STARTED" },
  legal: { missingRequiredConsentsCount: 0, hasAcceptedCurrentRequiredPolicies: true },
  activity: {},
  securityPreferences: {
    withdrawalEmailConfirmationEnabled: false,
    withdrawalAddressWhitelistEnabled: false,
    suspiciousLoginAlertsEnabled: true,
    emailSecurityNotificationsEnabled: true,
    enforcementReady: false,
  },
  recentSecurityEvents: [],
};

describe("security labels", () => {
  it("maps recommendation codes to i18n", () => {
    expect(securityRecommendationText("ENABLE_2FA", "en").title).toBe("Enable 2FA");
  });
});

describe("profile security live guards", () => {
  it("does not use client-side computeScore", () => {
    const source = readFileSync(
      join(__dirname, "profile-security-content.tsx"),
      "utf8",
    );
    expect(source).not.toContain("computeScore");
    expect(source).not.toContain("defaultCfg");
    expect(source).not.toContain("ProtectionCfg");
  });
});

describe("ProfileSecurityContent", () => {
  beforeEach(() => {
    mockFetchUserMe.mockResolvedValue({ id: "user-1", email: "test@example.com", accountCenter });
    mockFetchUserSessions.mockResolvedValue({ items: [] });
    mockFetchSecurityEvents.mockResolvedValue({ items: [] });
    mockFetchSecurityPreferences.mockResolvedValue({
      withdrawalEmailConfirmationEnabled: false,
      withdrawalAddressWhitelistEnabled: false,
      suspiciousLoginAlertsEnabled: true,
    });
    mockFetchNotificationPreferences.mockResolvedValue({ emailSecurity: true });
  });

  it("renders backend security level in live mode", async () => {
    render(<ProfileSecurityContent />);
    await waitFor(() => expect(mockFetchUserMe).toHaveBeenCalled());
    expect(await screen.findByText(/Medium level/)).toBeTruthy();
    expect(screen.getByText(/Enable 2FA/)).toBeTruthy();
  });

  it("shows sessions tab content in live mode", async () => {
    render(<ProfileSecurityContent />);
    await waitFor(() => expect(mockFetchUserMe).toHaveBeenCalled());
    screen.getByRole("button", { name: "profile.security.tab.sessions" }).click();
    expect(await screen.findByText("profile.security.access.descriptionShort")).toBeTruthy();
  });

  it("renders 2FA panel in live mode", async () => {
    render(<ProfileSecurityContent />);
    expect(await screen.findByTestId("two-fa-panel")).toBeTruthy();
  });
});
