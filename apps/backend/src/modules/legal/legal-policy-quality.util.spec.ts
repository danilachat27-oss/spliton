import { assessPolicyContentQuality } from './legal-policy-quality.util';
import { LAWYER_REVIEW_NOTICE } from './legal-consent-requirements';

describe('assessPolicyContentQuality', () => {
  it('rejects empty content', () => {
    const result = assessPolicyContentQuality('');
    expect(result.publishable).toBe(false);
    expect(result.reasons).toContain('empty content');
  });

  it('rejects lawyer review notice', () => {
    const result = assessPolicyContentQuality(`${LAWYER_REVIEW_NOTICE}\n${'x'.repeat(600)}`);
    expect(result.publishable).toBe(false);
  });

  it('rejects short required content', () => {
    const result = assessPolicyContentQuality('short text');
    expect(result.publishable).toBe(false);
  });

  it('accepts long production-like content', () => {
    const result = assessPolicyContentQuality('a'.repeat(600));
    expect(result.publishable).toBe(true);
  });
});
