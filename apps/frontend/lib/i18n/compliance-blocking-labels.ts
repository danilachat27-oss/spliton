/** Maps backend eligibility blocking codes to i18n dictionary keys. */
export const COMPLIANCE_BLOCKING_KEYS: Record<string, string> = {
  CONSENT_REQUIRED: "compliance.blocking.consentRequired",
  LEGAL_POLICY_MISSING: "compliance.blocking.legalPolicyMissing",
  KYC_REQUIRED: "compliance.blocking.kycRequired",
  KYC_IN_REVIEW: "compliance.blocking.kycInReview",
  AML_BLOCKED: "compliance.blocking.amlBlocked",
  ACCOUNT_RESTRICTED: "compliance.blocking.accountRestricted",
  EMAIL_NOT_VERIFIED: "compliance.blocking.emailNotVerified",
  COUNTRY_BLOCKED: "compliance.blocking.countryBlocked",
  FEATURE_DISABLED: "compliance.blocking.featureDisabled",
};

export function complianceBlockingMessage(
  blockingCode: string | undefined,
  t: (key: string, fallback?: string) => string,
): string | null {
  if (!blockingCode) return null;
  const key = COMPLIANCE_BLOCKING_KEYS[blockingCode];
  return key ? t(key) : null;
}
