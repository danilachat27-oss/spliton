import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ProfileSettingsContent } from "@/components/dashboard/profile/profile-settings-content";

const mockFetchUserMe = vi.fn();
const mockPatchUserPreferences = vi.fn();
const mockFetchNotificationPreferences = vi.fn();
const mockPatchNotificationPreferences = vi.fn();

vi.mock("@/services/user-me.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/user-me.service")>();
  return {
    ...actual,
    fetchUserMe: (...args: unknown[]) => mockFetchUserMe(...args),
    patchUserPreferences: (...args: unknown[]) => mockPatchUserPreferences(...args),
  };
});

vi.mock("@/services/notifications.service", () => ({
  fetchNotificationPreferences: (...args: unknown[]) => mockFetchNotificationPreferences(...args),
  patchNotificationPreferences: (...args: unknown[]) => mockPatchNotificationPreferences(...args),
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    authorizedFetch: vi.fn(),
    isAuthenticated: true,
  }),
}));

vi.mock("@/lib/public-env", () => ({
  isLiveAccountEnabled: () => true,
}));

const t = (key: string) => key;
vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    t,
    locale: "en",
  }),
}));

vi.mock("@/components/i18n/language-selector", () => ({
  LanguageSelector: () => <div data-testid="language-selector" />,
}));

describe("ProfileSettingsContent", () => {
  beforeEach(() => {
    mockFetchUserMe.mockResolvedValue({
      profile: { displayName: "Alice", timezone: "Europe/Moscow" },
    });
    mockFetchNotificationPreferences.mockResolvedValue({
      emailFinance: true,
      emailMarket: false,
      emailNews: true,
      emailSecurity: true,
      emailSupport: true,
      inAppFinance: true,
      inAppMarket: true,
      inAppSupport: false,
      inAppNews: true,
    });
    mockPatchUserPreferences.mockResolvedValue({});
    mockPatchNotificationPreferences.mockResolvedValue({});
  });

  it("loads notification preferences including locked security email", async () => {
    render(<ProfileSettingsContent />);
    await waitFor(() => expect(mockFetchNotificationPreferences).toHaveBeenCalled());
    expect(screen.getByText("profile.settings.securityEmail.title")).toBeInTheDocument();
    expect(screen.getByText("profile.settings.securityEmail.locked")).toBeInTheDocument();
    expect(screen.getByText("profile.settings.inAppFinance.title")).toBeInTheDocument();
  });

  it("saves account and notification preferences in live mode", async () => {
    render(<ProfileSettingsContent />);
    await waitFor(() => expect(mockFetchUserMe).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "profile.settings.saveButton" }));

    await waitFor(() => {
      expect(mockPatchUserPreferences).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          displayName: "Alice",
          timezone: "Europe/Moscow",
          preferredLocale: "en",
        }),
      );
      expect(mockPatchNotificationPreferences).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          emailFinance: true,
          emailMarket: false,
          emailNews: true,
          emailSupport: true,
          emailSecurity: true,
          inAppFinance: true,
          inAppMarket: true,
          inAppSupport: false,
          inAppNews: true,
        }),
      );
    });
  });
});
