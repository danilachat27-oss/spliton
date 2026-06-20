import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ProfileVerificationContent } from "@/components/dashboard/profile/profile-verification-content";

vi.mock("@/components/dashboard/profile/profile-verification-live-content", () => ({
  ProfileVerificationLiveContent: () => <div data-testid="verification-live" />,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("verifyStatus=approved"),
}));

const mockUseAuth = vi.fn();
vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockIsLive = vi.fn();
const mockIsPrototype = vi.fn();
vi.mock("@/lib/public-env", () => ({
  isLiveAccountEnabled: () => mockIsLive(),
  isAccountCenterPrototypeAllowed: () => mockIsPrototype(),
}));

const t = (key: string) => key;
vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    t,
    locale: "en",
  }),
}));

describe("ProfileVerificationContent gates", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockIsLive.mockReturnValue(true);
    mockIsPrototype.mockReturnValue(false);
  });

  it("renders live content when live account is enabled and user is authenticated", () => {
    render(<ProfileVerificationContent />);
    expect(screen.getByTestId("verification-live")).toBeInTheDocument();
  });

  it("shows sign-in prompt in strict deploy mode without auth", () => {
    mockIsLive.mockReturnValue(false);
    mockIsPrototype.mockReturnValue(false);
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    render(<ProfileVerificationContent />);
    expect(screen.getByText("verification.signInRequiredTitle")).toBeInTheDocument();
    expect(screen.queryByTestId("verification-live")).not.toBeInTheDocument();
  });

  it("does not expose demo query flow in production gate", () => {
    const source = readFileSync(
      join(__dirname, "profile-verification-content.tsx"),
      "utf8",
    );
    expect(source).toContain("isAccountCenterPrototypeAllowed");
    expect(source).toContain("ProfileVerificationDemoContent");
    expect(source).toMatch(/if \(live\)[\s\S]*ProfileVerificationLiveContent/);
    expect(source).toMatch(/if \(!prototype\)[\s\S]*signInRequiredTitle/);
    const liveSource = readFileSync(
      join(__dirname, "profile-verification-live-content.tsx"),
      "utf8",
    );
    expect(liveSource).not.toContain("Иванов");
  });
});
