import { ConsentSource, LegalPolicyType } from '@prisma/client';

/** Policy types required before sensitive actions. */
export const CONSENT_REQUIREMENTS: Record<
  ConsentSource,
  LegalPolicyType[]
> = {
  [ConsentSource.REGISTER]: [
    LegalPolicyType.TERMS_OF_SERVICE,
    LegalPolicyType.PRIVACY_POLICY,
  ],
  [ConsentSource.LOGIN]: [],
  [ConsentSource.PRIMARY_PURCHASE]: [
    LegalPolicyType.TERMS_OF_SERVICE,
    LegalPolicyType.RISK_DISCLOSURE,
    LegalPolicyType.INVESTOR_AGREEMENT,
    LegalPolicyType.FEE_POLICY,
  ],
  [ConsentSource.SECONDARY_TRADE]: [
    LegalPolicyType.SECONDARY_MARKET_RULES,
    LegalPolicyType.RISK_DISCLOSURE,
    LegalPolicyType.FEE_POLICY,
  ],
  [ConsentSource.WITHDRAWAL]: [
    LegalPolicyType.WITHDRAWAL_POLICY,
    LegalPolicyType.AML_POLICY,
  ],
  [ConsentSource.PROFILE]: [],
};

export const LAWYER_REVIEW_NOTICE =
  '⚠️ Черновик Spliton. Требует проверки юристом перед production и реальными деньгами.';
