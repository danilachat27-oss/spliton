import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ProfileVerificationLiveContent } from "@/components/dashboard/profile/profile-verification-live-content";

const mockKyc = vi.fn();
const mockEligibility = vi.fn();

vi.mock("@/hooks/use-kyc-status", () => ({
  useKycStatus: () => mockKyc(),
}));

vi.mock("@/hooks/use-eligibility-summary", () => ({
  useEligibilitySummary: () => mockEligibility(),
}));

const t = (key: string) => key;
vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    t,
    locale: "en",
  }),
}));

const kycApproved = {
  status: "APPROVED",
  level: "BASIC",
  countryCode: "RU",
  submittedAt: "2025-06-01T00:00:00.000Z",
  reviewedAt: "2025-06-02T00:00:00.000Z",
  expiresAt: null,
  rejectionReasonSafe: null,
  provider: "MANUAL",
};

const eligibilitySummary = {
  deposit: { allowed: true, userMessage: "OK" },
  withdraw: { allowed: false, blockingCode: "KYC_REQUIRED", userMessage: "Complete KYC" },
  primary: { allowed: false, blockingCode: "CONSENT_REQUIRED", userMessage: "Accept terms" },
  secondary: { allowed: true, userMessage: "OK" },
};

describe("ProfileVerificationLiveContent", () => {
  beforeEach(() => {
    mockKyc.mockReturnValue({
      data: kycApproved,
      loading: false,
      error: null,
      submitting: false,
      reload: vi.fn(),
      start: vi.fn(),
      submitManual: vi.fn(),
    });
    mockEligibility.mockReturnValue({
      data: eligibilitySummary,
      loading: false,
      error: null,
    });
  });

  it("renders KYC level and timeline from live status", () => {
    render(<ProfileVerificationLiveContent />);
    expect(screen.getByText(/verification.level/)).toBeInTheDocument();
    expect(screen.getByText("verification.timeline.title")).toBeInTheDocument();
    expect(screen.getByText("verification.status.approved")).toBeInTheDocument();
  });

  it("renders eligibility rows from API summary", () => {
    render(<ProfileVerificationLiveContent />);
    expect(screen.getAllByText("verification.access.deposit").length).toBeGreaterThan(0);
    expect(screen.getAllByText("verification.eligibility.status.allowed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("verification.eligibility.status.kyc_required").length).toBeGreaterThan(0);
    expect(screen.getAllByText("verification.eligibility.status.legal_required").length).toBeGreaterThan(0);
  });
});
