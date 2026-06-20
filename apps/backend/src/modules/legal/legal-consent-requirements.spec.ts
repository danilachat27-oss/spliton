import { ConsentSource, LegalPolicyType } from '@prisma/client';
import { CONSENT_REQUIREMENTS } from './legal-consent-requirements';

describe('CONSENT_REQUIREMENTS', () => {
  it('requires terms and privacy on register', () => {
    expect(CONSENT_REQUIREMENTS[ConsentSource.REGISTER]).toEqual([
      LegalPolicyType.TERMS_OF_SERVICE,
      LegalPolicyType.PRIVACY_POLICY,
    ]);
  });

  it('requires risk disclosure before primary purchase', () => {
    expect(CONSENT_REQUIREMENTS[ConsentSource.PRIMARY_PURCHASE]).toContain(
      LegalPolicyType.RISK_DISCLOSURE,
    );
  });

  it('requires market rules before secondary trade', () => {
    expect(CONSENT_REQUIREMENTS[ConsentSource.SECONDARY_TRADE]).toContain(
      LegalPolicyType.SECONDARY_MARKET_RULES,
    );
  });
});
