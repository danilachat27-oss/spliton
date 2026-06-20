import {
  assertProductionBootSafe,
  collectProductionBootIssues,
} from './production-boot-guard';

describe('production-boot-guard', () => {
  it('allows development with mock tron', () => {
    expect(
      collectProductionBootIssues({
        NODE_ENV: 'development',
        TRON_PROVIDER_MODE: 'mock',
        DEPOSIT_INGESTION_ENABLED: 'true',
      }),
    ).toHaveLength(0);
  });

  it('blocks mock tron in production when ingestion enabled', () => {
    const issues = collectProductionBootIssues({
      NODE_ENV: 'production',
      TRON_PROVIDER_MODE: 'mock',
      DEPOSIT_INGESTION_ENABLED: 'true',
      FEATURE_ENABLE_DEPOSITS: 'true',
    });
    expect(issues.some((i) => i.code === 'TRON_MOCK_IN_PRODUCTION')).toBe(true);
  });

  it('requires postmark credentials when email delivery enabled', () => {
    const issues = collectProductionBootIssues({
      NODE_ENV: 'production',
      FEATURE_ENABLE_EMAIL_DELIVERY: 'true',
      EMAIL_PROVIDER: 'postmark',
    });
    expect(issues.some((i) => i.code === 'POSTMARK_TOKEN_MISSING')).toBe(true);
    expect(issues.some((i) => i.code === 'EMAIL_FROM_MISSING')).toBe(true);
  });

  it('requires redis when multi-instance rate limit', () => {
    const issues = collectProductionBootIssues({
      NODE_ENV: 'production',
      RATE_LIMIT_MULTI_INSTANCE: 'true',
      RATE_LIMIT_STORAGE: 'memory',
    });
    expect(issues.some((i) => i.code === 'RATE_LIMIT_REDIS_REQUIRED')).toBe(
      true,
    );
  });

  it('requires redis when RATE_LIMIT_REQUIRE_REDIS_IN_PRODUCTION', () => {
    const issues = collectProductionBootIssues({
      NODE_ENV: 'production',
      RATE_LIMIT_REQUIRE_REDIS_IN_PRODUCTION: 'true',
      RATE_LIMIT_STORAGE: 'memory',
    });
    expect(issues.some((i) => i.code === 'RATE_LIMIT_REDIS_REQUIRED')).toBe(
      true,
    );
  });
});
