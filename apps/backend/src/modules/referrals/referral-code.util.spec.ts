import { generateReferralCode, normalizeReferralCode } from './referral-code.util';

describe('referral-code.util', () => {
  it('normalizes code', () => {
    expect(normalizeReferralCode(' rs-7k2m ')).toBe('RS7K2M');
  });

  it('generates non-empty codes', () => {
    const code = generateReferralCode();
    expect(code.length).toBeGreaterThanOrEqual(6);
  });
});
