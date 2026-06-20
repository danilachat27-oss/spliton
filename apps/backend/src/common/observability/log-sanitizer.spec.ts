import { sanitizeErrorMessage, sanitizeLogValue } from './log-sanitizer';

describe('log-sanitizer', () => {
  it('redacts sensitive object keys', () => {
    const out = sanitizeLogValue({
      password: 'secret',
      refreshToken: 'abc',
      nested: { apiKey: 'k' },
      safe: 'ok',
    }) as Record<string, unknown>;
    expect(out.password).toBe('[REDACTED]');
    expect(out.refreshToken).toBe('[REDACTED]');
    expect((out.nested as Record<string, unknown>).apiKey).toBe('[REDACTED]');
    expect(out.safe).toBe('ok');
  });

  it('redacts bearer tokens and jwt-like strings', () => {
    const raw = 'Authorization Bearer abc.def.ghi and eyJhbG.test.sig';
    const out = sanitizeErrorMessage(raw);
    expect(out).toContain('[REDACTED]');
    expect(out).not.toContain('abc.def.ghi');
  });
});
