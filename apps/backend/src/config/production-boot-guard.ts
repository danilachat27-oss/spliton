/**
 * Fails fast at bootstrap when production financial/email/rate-limit env is unsafe.
 */
export type ProductionBootIssue = {
  code: string;
  message: string;
};

function isTruthy(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export function collectProductionBootIssues(
  env: NodeJS.ProcessEnv = process.env,
): ProductionBootIssue[] {
  const issues: ProductionBootIssue[] = [];
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (nodeEnv !== 'production') {
    return issues;
  }

  const depositsEnabled = env.FEATURE_ENABLE_DEPOSITS !== 'false';
  const ingestionEnabled = isTruthy(env.DEPOSIT_INGESTION_ENABLED);
  const tronMode = (env.TRON_PROVIDER_MODE ?? 'mock').trim().toLowerCase();

  if (depositsEnabled && ingestionEnabled && tronMode !== 'tron') {
    issues.push({
      code: 'TRON_MOCK_IN_PRODUCTION',
      message:
        'NODE_ENV=production with FEATURE_ENABLE_DEPOSITS and DEPOSIT_INGESTION_ENABLED requires TRON_PROVIDER_MODE=tron (mock deposits are forbidden).',
    });
  }

  if (isTruthy(env.ALLOW_DEV_DEPOSIT_ADDRESS)) {
    issues.push({
      code: 'DEV_DEPOSIT_ADDRESS_IN_PRODUCTION',
      message: 'ALLOW_DEV_DEPOSIT_ADDRESS must be false in production.',
    });
  }

  const emailDelivery = env.FEATURE_ENABLE_EMAIL_DELIVERY !== 'false';
  if (emailDelivery) {
    const provider = (env.EMAIL_PROVIDER ?? 'dev').trim().toLowerCase();
    if (provider === 'dev') {
      issues.push({
        code: 'EMAIL_DEV_IN_PRODUCTION',
        message:
          'FEATURE_ENABLE_EMAIL_DELIVERY=true requires EMAIL_PROVIDER=postmark or resend in production.',
      });
    }
    if (provider === 'postmark') {
      if (!env.POSTMARK_SERVER_TOKEN?.trim()) {
        issues.push({
          code: 'POSTMARK_TOKEN_MISSING',
          message: 'EMAIL_PROVIDER=postmark requires POSTMARK_SERVER_TOKEN.',
        });
      }
      if (!env.EMAIL_FROM?.trim()) {
        issues.push({
          code: 'EMAIL_FROM_MISSING',
          message: 'EMAIL_PROVIDER=postmark requires EMAIL_FROM.',
        });
      }
    }
    if (provider === 'resend') {
      if (!env.RESEND_API_KEY?.trim()) {
        issues.push({
          code: 'RESEND_KEY_MISSING',
          message: 'EMAIL_PROVIDER=resend requires RESEND_API_KEY.',
        });
      }
      if (!env.EMAIL_FROM?.trim()) {
        issues.push({
          code: 'EMAIL_FROM_MISSING',
          message: 'EMAIL_PROVIDER=resend requires EMAIL_FROM.',
        });
      }
    }
  }

  const rateStorage = (env.RATE_LIMIT_STORAGE ?? 'memory').trim().toLowerCase();
  const multiInstance = isTruthy(env.RATE_LIMIT_MULTI_INSTANCE);
  const requireRedisFor20k = isTruthy(env.RATE_LIMIT_REQUIRE_REDIS_IN_PRODUCTION);
  if (multiInstance && rateStorage !== 'redis') {
    issues.push({
      code: 'RATE_LIMIT_REDIS_REQUIRED',
      message:
        'RATE_LIMIT_MULTI_INSTANCE=true requires RATE_LIMIT_STORAGE=redis in production.',
    });
  }
  if (requireRedisFor20k && rateStorage !== 'redis') {
    issues.push({
      code: 'RATE_LIMIT_REDIS_REQUIRED',
      message:
        'RATE_LIMIT_REQUIRE_REDIS_IN_PRODUCTION=true requires RATE_LIMIT_STORAGE=redis.',
    });
  }
  if (rateStorage === 'redis' && !env.REDIS_URL?.trim()) {
    issues.push({
      code: 'REDIS_URL_MISSING',
      message: 'RATE_LIMIT_STORAGE=redis requires REDIS_URL.',
    });
  }

  return issues;
}

export function assertProductionBootSafe(env: NodeJS.ProcessEnv = process.env): void {
  const issues = collectProductionBootIssues(env);
  if (issues.length === 0) return;
  const lines = issues.map((i) => `  - [${i.code}] ${i.message}`).join('\n');
  throw new Error(`[Spliton] Production boot guard failed:\n${lines}`);
}
