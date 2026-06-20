import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { renderToStaticMarkup } from "react-dom/server";

import { ProfileVerificationContent } from "@/components/dashboard/profile/profile-verification-content";

vi.mock("@/hooks/use-kyc-status", () => ({
  useKycStatus: () => ({
    live: true,
    data: null,
    loading: false,
    error: "verification unavailable",
    submitting: false,
    reload: vi.fn(),
    start: vi.fn(),
    submitManual: vi.fn(),
  }),
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("@/lib/public-env", () => ({
  isLiveAccountEnabled: () => true,
  isAccountCenterPrototypeAllowed: () => false,
}));

vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "en",
  }),
}));

describe("account verification live guards", () => {
  it("live mode with API error shows error state, not demo verifyStatus UI", () => {
    const html = renderToStaticMarkup(<ProfileVerificationContent />);
    expect(html).toContain("verification unavailable");
    expect(html).not.toContain("Иванов И. И.");
  });
});

describe("profile holdings i18n", () => {
  it("holdings list source has no hardcoded RU column labels", () => {
    const source = readFileSync(
      join(process.cwd(), "components/dashboard/profile/profile-holdings-list.tsx"),
      "utf8",
    );
    expect(source).toContain("profile.holdings.revenueShare");
    expect(source).not.toMatch(/[А-Яа-яЁё]{4,}/);
  });
});
