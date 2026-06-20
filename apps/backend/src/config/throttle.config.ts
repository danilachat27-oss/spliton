export type ThrottleRuntimeConfig = {
  enabled: boolean;
  ttlMs: number;
  limit: number;
  loadTestMode: boolean;
};

/**
 * Resolves HTTP throttle settings. Production always keeps a safe default (120/min, enabled).
 * LOAD_TEST_MODE and raised limits apply only outside production.
 */
export function resolveThrottleConfig(
  env: NodeJS.ProcessEnv = process.env,
): ThrottleRuntimeConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';
  const loadTestMode = env.LOAD_TEST_MODE === 'true';
  const ttlSeconds = Number(env.THROTTLE_TTL_SECONDS ?? 60);
  const ttlMs = Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds * 1000 : 60_000;

  if (isProduction) {
    return {
      enabled: true,
      ttlMs,
      limit: 120,
      loadTestMode: false,
    };
  }

  if (loadTestMode) {
    const enabled = env.THROTTLE_ENABLED === 'false' ? false : true;
    const limitRaw = env.THROTTLE_LIMIT ?? '10000';
    const limit = Number(limitRaw);
    return {
      enabled,
      ttlMs,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10_000,
      loadTestMode: true,
    };
  }

  const enabled = env.THROTTLE_ENABLED !== 'false';
  const limitRaw = env.THROTTLE_LIMIT ?? '120';
  const limit = Number(limitRaw);

  return {
    enabled,
    ttlMs,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 120,
    loadTestMode: false,
  };
}
