export const LEGAL_API_PATHS = {
  policiesActive: "/api/v1/legal/policies/active",
  policyActive: (type: string) => `/api/v1/legal/policies/${encodeURIComponent(type)}/active`,
  center: "/api/v1/legal/center",
  consents: "/api/v1/legal/consents",
  eligibilityPrimary: "/api/v1/compliance/eligibility/primary",
  eligibilitySecondary: "/api/v1/compliance/eligibility/secondary",
  eligibilityWithdrawal: "/api/v1/compliance/eligibility/withdrawal",
  eligibilityDeposit: "/api/v1/compliance/eligibility/deposit",
  kycStatus: "/api/v1/kyc/status",
} as const;

export type LegalPolicyPublic = {
  id: string;
  type: string;
  version: string;
  title: string;
  content: string;
  contentFormat: string;
  contentHash?: string | null;
  effectiveAt: string;
  publishedAt: string | null;
  requiresUserConsent: boolean;
  lawyerReviewRequired?: boolean;
};

export type UserLegalConsentRow = {
  policyType: string;
  policyVersion: string;
  acceptedAt: string;
  source: string;
  policy?: { title: string; type: string; version: string };
};

export type MissingConsentItem = {
  type: string;
  activeVersion?: string;
  policyId?: string;
  title: string;
  reason?: "CONSENT_REQUIRED" | "POLICY_NOT_PUBLISHED";
};

export type LegalCenterResponse = {
  activePolicies: LegalPolicyPublic[];
  acceptedConsents: UserLegalConsentRow[];
  missingConsents: {
    primaryPurchase: MissingConsentItem[];
    secondaryTrade: MissingConsentItem[];
    withdrawal: MissingConsentItem[];
  };
  lawyerReviewRequired: boolean;
};

export type EligibilityResult = {
  allowed: boolean;
  blockingCode?: string;
  userMessage: string;
  adminMessage?: string;
  requiredActions?: string[];
  policyLinks?: string[];
  missingPolicyTypes?: string[];
};

export type ConsentSource =
  | "REGISTER"
  | "LOGIN"
  | "PRIMARY_PURCHASE"
  | "SECONDARY_TRADE"
  | "WITHDRAWAL"
  | "PROFILE";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
    const err = new Error(body.message ?? res.statusText);
    (err as Error & { status: number; code?: string }).status = res.status;
    (err as Error & { code?: string }).code = body.code;
    throw err;
  }
  return res.json() as Promise<T>;
}

export async function fetchActivePolicies(
  fetchFn: typeof fetch = fetch,
): Promise<LegalPolicyPublic[]> {
  const res = await fetchFn(LEGAL_API_PATHS.policiesActive, { credentials: "include" });
  return parseJson(res);
}

export async function fetchLegalCenter(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<LegalCenterResponse> {
  const res = await authorizedFetch(LEGAL_API_PATHS.center);
  return parseJson(res);
}

export async function acceptLegalConsents(
  policyIds: string[],
  source: ConsentSource,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<unknown> {
  const res = await authorizedFetch(LEGAL_API_PATHS.consents, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ policyIds, source }),
  });
  return parseJson(res);
}

export async function fetchEligibility(
  path: string,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<EligibilityResult> {
  const res = await authorizedFetch(path);
  return parseJson(res);
}

export type EligibilitySummary = {
  deposit: EligibilityResult;
  withdraw: EligibilityResult;
  primary: EligibilityResult;
  secondary: EligibilityResult;
};

export async function fetchEligibilitySummary(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<EligibilitySummary> {
  const [deposit, withdraw, primary, secondary] = await Promise.all([
    fetchEligibility(LEGAL_API_PATHS.eligibilityDeposit, authorizedFetch),
    fetchEligibility(LEGAL_API_PATHS.eligibilityWithdrawal, authorizedFetch),
    fetchEligibility(LEGAL_API_PATHS.eligibilityPrimary, authorizedFetch),
    fetchEligibility(LEGAL_API_PATHS.eligibilitySecondary, authorizedFetch),
  ]);
  return { deposit, withdraw, primary, secondary };
}

export function getRegisterMissingConsents(data: LegalCenterResponse): MissingConsentItem[] {
  const registerTypes = new Set(["TERMS_OF_SERVICE", "PRIVACY_POLICY"]);
  const accepted = new Set(
    data.acceptedConsents.map((c) => `${c.policyType}:${c.policyVersion}`),
  );
  return data.activePolicies
    .filter((p) => registerTypes.has(p.type) && p.requiresUserConsent)
    .filter((p) => !accepted.has(`${p.type}:${p.version}`))
    .map((p) => ({
      type: p.type,
      activeVersion: p.version,
      policyId: p.id,
      title: p.title,
    }));
}

export function getAllMissingConsents(data: LegalCenterResponse): MissingConsentItem[] {
  const seen = new Set<string>();
  const items: MissingConsentItem[] = [];
  for (const list of [
    getRegisterMissingConsents(data),
    data.missingConsents.primaryPurchase,
    data.missingConsents.secondaryTrade,
    data.missingConsents.withdrawal,
  ]) {
    for (const item of list) {
      const key = `${item.type}:${item.activeVersion}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push(item);
      }
    }
  }
  return items;
}

export function policyPublicHref(type: string): string {
  if (type === "PRIVACY_POLICY") return "/privacy";
  if (type === "TERMS_OF_SERVICE") return "/terms";
  if (type === "FEE_POLICY") return "/fees";
  if (type === "RISK_DISCLOSURE") return "/trust";
  return `/legal/${type.toLowerCase().replace(/_/g, "-")}`;
}

export function policyTypeLabel(type: string, t: (key: string) => string): string {
  const key = `legal.policy.type.${type}`;
  const label = t(key);
  if (!label || label === "—" || label === key) {
    return type.replace(/_/g, " ");
  }
  return label;
}

const PROFILE_LEGAL_FALLBACK_TYPES = [
  "TERMS_OF_SERVICE",
  "PRIVACY_POLICY",
  "RISK_DISCLOSURE",
  "FEE_POLICY",
] as const;

export function buildProfileLegalFallback(t: (key: string) => string): LegalCenterResponse {
  return {
    activePolicies: PROFILE_LEGAL_FALLBACK_TYPES.map((type) => ({
      id: `fallback-${type}`,
      type,
      version: "—",
      title: policyTypeLabel(type, t),
      content: "",
      contentFormat: "markdown",
      effectiveAt: new Date().toISOString(),
      publishedAt: null,
      requiresUserConsent: type === "TERMS_OF_SERVICE" || type === "PRIVACY_POLICY",
    })),
    acceptedConsents: [],
    missingConsents: {
      primaryPurchase: [],
      secondaryTrade: [],
      withdrawal: [],
    },
    lawyerReviewRequired: false,
  };
}

export function isFallbackPolicyId(id: string): boolean {
  return id.startsWith("fallback-");
}
