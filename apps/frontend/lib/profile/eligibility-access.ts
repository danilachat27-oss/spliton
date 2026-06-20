import { profileDashboardHref } from "@/constants/dashboard/profile-page";
import { ROUTES } from "@/constants/routes";
import type { EligibilityResult } from "@/services/legal.service";

export type EligibilityAccessStatus =
  | "allowed"
  | "kyc_required"
  | "legal_required"
  | "email_required"
  | "blocked"
  | "limited";

export type EligibilityAccessRow = {
  id: string;
  labelKey: string;
  status: EligibilityAccessStatus;
  message?: string;
  ctaHref?: string;
  ctaLabelKey?: string;
};

export function mapEligibilityToAccess(
  id: string,
  labelKey: string,
  result: EligibilityResult | null | undefined,
): EligibilityAccessRow {
  if (!result) {
    return {
      id,
      labelKey,
      status: "limited",
      message: undefined,
      ctaLabelKey: "verification.eligibility.checking",
    };
  }
  if (result.allowed) {
    return { id, labelKey, status: "allowed" };
  }

  const code = result.blockingCode ?? "";
  if (code === "EMAIL_NOT_VERIFIED") {
    return {
      id,
      labelKey,
      status: "email_required",
      message: result.userMessage,
      ctaHref: ROUTES.verifyEmail,
      ctaLabelKey: "verification.eligibility.cta.verifyEmail",
    };
  }
  if (code === "CONSENT_REQUIRED") {
    return {
      id,
      labelKey,
      status: "legal_required",
      message: result.userMessage,
      ctaHref: profileDashboardHref("legal"),
      ctaLabelKey: "verification.eligibility.cta.acceptLegal",
    };
  }
  if (code.startsWith("KYC") || code === "KYC_REQUIRED" || code === "KYC_IN_REVIEW" || code === "KYC_REJECTED") {
    return {
      id,
      labelKey,
      status: code === "KYC_IN_REVIEW" ? "limited" : "kyc_required",
      message: result.userMessage,
      ctaHref: profileDashboardHref("verification"),
      ctaLabelKey:
        code === "KYC_IN_REVIEW"
          ? "verification.eligibility.cta.viewStatus"
          : "verification.eligibility.cta.completeKyc",
    };
  }

  return {
    id,
    labelKey,
    status: "blocked",
    message: result.userMessage,
    ctaHref: ROUTES.dashboardSupport,
    ctaLabelKey: "verification.eligibility.cta.contactSupport",
  };
}
