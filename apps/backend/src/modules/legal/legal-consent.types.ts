import { ConsentSource, LegalPolicyType } from '@prisma/client';
import { CONSENT_REQUIREMENTS } from './legal-consent-requirements';

export const FINANCIAL_CONSENT_SOURCES: ConsentSource[] = [
  ConsentSource.PRIMARY_PURCHASE,
  ConsentSource.SECONDARY_TRADE,
  ConsentSource.WITHDRAWAL,
];

export type MissingConsentReason = 'CONSENT_REQUIRED' | 'POLICY_NOT_PUBLISHED';

export type MissingConsentItem = {
  type: LegalPolicyType;
  activeVersion?: string;
  policyId?: string;
  title: string;
  reason: MissingConsentReason;
};

export function isFinancialConsentSource(source: ConsentSource): boolean {
  return FINANCIAL_CONSENT_SOURCES.includes(source);
}

export function defaultTitleForPolicyType(type: LegalPolicyType): string {
  return type.replace(/_/g, ' ');
}

export function requiredTypesForSource(source: ConsentSource): LegalPolicyType[] {
  return CONSENT_REQUIREMENTS[source] ?? [];
}
