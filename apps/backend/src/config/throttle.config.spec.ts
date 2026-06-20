import { resolveThrottleConfig } from './throttle.config';

describe('resolveThrottleConfig', () => {
  it('keeps production safe defaults regardless of LOAD_TEST_MODE', () => {
    const cfg = resolveThrottleConfig({
      NODE_ENV: 'production',
      LOAD_TEST_MODE: 'true',
      THROTTLE_LIMIT: '10000',
      THROTTLE_ENABLED: 'false',
    });
    expect(cfg.enabled).toBe(true);
    expect(cfg.limit).toBe(120);
    expect(cfg.loadTestMode).toBe(false);
  });

  it('raises limit in load test mode on development', () => {
    const cfg = resolveThrottleConfig({
      NODE_ENV: 'development',
      LOAD_TEST_MODE: 'true',
      THROTTLE_LIMIT: '5000',
    });
    expect(cfg.loadTestMode).toBe(true);
    expect(cfg.enabled).toBe(true);
    expect(cfg.limit).toBe(5000);
  });

  it('allows disabling throttle only outside production with LOAD_TEST_MODE', () => {
    const cfg = resolveThrottleConfig({
      NODE_ENV: 'development',
      LOAD_TEST_MODE: 'true',
      THROTTLE_ENABLED: 'false',
    });
    expect(cfg.enabled).toBe(false);
  });

  it('uses default 120 limit in normal development', () => {
    const cfg = resolveThrottleConfig({ NODE_ENV: 'development' });
    expect(cfg.limit).toBe(120);
    expect(cfg.enabled).toBe(true);
    expect(cfg.loadTestMode).toBe(false);
  });

  it('never enables load test mode in production', () => {
    const cfg = resolveThrottleConfig({
      NODE_ENV: 'production',
      LOAD_TEST_MODE: 'true',
    });
    expect(cfg.loadTestMode).toBe(false);
  });
});
