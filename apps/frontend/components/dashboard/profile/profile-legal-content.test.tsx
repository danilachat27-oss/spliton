import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ProfileLegalContent } from "@/components/dashboard/profile/profile-legal-content";

const mockFetchLegalCenter = vi.fn();
const mockAcceptLegalConsents = vi.fn();

vi.mock("@/services/legal.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/legal.service")>();
  return {
    ...actual,
    fetchLegalCenter: (...args: unknown[]) => mockFetchLegalCenter(...args),
    acceptLegalConsents: (...args: unknown[]) => mockAcceptLegalConsents(...args),
  };
});

const authorizedFetch = vi.fn();
vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    authorizedFetch,
    isAuthenticated: true,
  }),
}));

const t = (key: string) => key;
vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    t,
    locale: "en",
  }),
}));

const centerWithMissing = {
  activePolicies: [
    {
      id: "p1",
      type: "TERMS_OF_SERVICE",
      version: "1.0",
      title: "Terms",
      content: "",
      contentFormat: "markdown",
      effectiveAt: "2025-01-01T00:00:00.000Z",
      publishedAt: "2025-01-01T00:00:00.000Z",
      requiresUserConsent: true,
    },
  ],
  acceptedConsents: [],
  missingConsents: {
    primaryPurchase: [],
    secondaryTrade: [],
    withdrawal: [],
  },
  lawyerReviewRequired: false,
};

describe("ProfileLegalContent", () => {
  beforeEach(() => {
    mockFetchLegalCenter.mockReset();
    mockAcceptLegalConsents.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows accept section when consents are missing", async () => {
    mockFetchLegalCenter.mockResolvedValue({
      ...centerWithMissing,
      missingConsents: {
        primaryPurchase: [
          {
            type: "TERMS_OF_SERVICE",
            activeVersion: "1.0",
            policyId: "p1",
            title: "Terms",
          },
        ],
        secondaryTrade: [],
        withdrawal: [],
      },
    });

    render(<ProfileLegalContent />);
    await waitFor(() => expect(mockFetchLegalCenter).toHaveBeenCalled());
    expect(screen.getByText("profile.legal.acceptSection.title")).toBeInTheDocument();
    expect(screen.getByText("profile.legal.activeTitle")).toBeInTheDocument();
  });

  it("accepts missing consent inline and reloads center", async () => {
    const missingCenter = {
      ...centerWithMissing,
      missingConsents: {
        primaryPurchase: [
          {
            type: "TERMS_OF_SERVICE",
            activeVersion: "1.0",
            policyId: "p1",
            title: "Terms",
          },
        ],
        secondaryTrade: [],
        withdrawal: [],
      },
    };
    const acceptedCenter = {
      ...centerWithMissing,
      acceptedConsents: [
        {
          policyType: "TERMS_OF_SERVICE",
          policyVersion: "1.0",
          acceptedAt: "2025-06-02T00:00:00.000Z",
          source: "PROFILE",
          policy: { title: "Terms", type: "TERMS_OF_SERVICE", version: "1.0" },
        },
      ],
      missingConsents: {
        primaryPurchase: [],
        secondaryTrade: [],
        withdrawal: [],
      },
    };

    let accepted = false;
    mockFetchLegalCenter.mockImplementation(async () => (accepted ? acceptedCenter : missingCenter));
    mockAcceptLegalConsents.mockImplementation(async () => {
      accepted = true;
    });

    render(<ProfileLegalContent />);
    await waitFor(() => expect(screen.getByText("profile.legal.acceptSection.title")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "profile.legal.acceptButton" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "profile.legal.acceptButton" }));

    await waitFor(() =>
      expect(mockAcceptLegalConsents).toHaveBeenCalledWith(["p1"], "PROFILE", expect.any(Function)),
    );
    await waitFor(() => expect(screen.getByText("profile.legal.allAccepted")).toBeInTheDocument());
  });
});
