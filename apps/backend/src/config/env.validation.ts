import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),
  /** When set with NODE_ENV=test, Prisma uses this URL instead of DATABASE_URL (optional). */
  TEST_DATABASE_URL: Joi.string().optional().allow(''),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  PORT: Joi.number().port().default(4001),
  CORS_ORIGIN: Joi.string().optional().allow(''),
  FRONTEND_ORIGIN: Joi.string()
    .default('http://localhost:3000')
    .custom((value, helpers) => {
      const items = String(value)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      const invalid = items.find((item) => !/^https?:\/\/[^,\s]+$/i.test(item));
      if (invalid) {
        return helpers.error('any.invalid');
      }
      return items.join(',');
    }, 'comma separated origins'),
  AUTH_REFRESH_COOKIE_NAME: Joi.string().default('spliton_refresh_token'),
  AUTH_COOKIE_DOMAIN: Joi.string().optional().allow(''),
  AUTH_COOKIE_SECURE: Joi.when('AUTH_COOKIE_SAME_SITE', {
    is: 'none',
    then: Joi.boolean().valid(true).required(),
    otherwise: Joi.boolean().default(false),
  }),
  AUTH_COOKIE_SAME_SITE: Joi.string()
    .valid('lax', 'strict', 'none')
    .default('lax'),
  AUTH_RETURN_REFRESH_TOKEN_IN_BODY: Joi.boolean().default(true),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  LOAD_TEST_MODE: Joi.boolean().default(false),
  THROTTLE_ENABLED: Joi.boolean().optional(),
  THROTTLE_TTL_SECONDS: Joi.number().integer().min(1).default(60),
  THROTTLE_LIMIT: Joi.number().integer().min(1).optional(),
  EMAIL_PROVIDER: Joi.string().valid('dev', 'postmark', 'resend').default('dev'),
  DEV_EMAIL_OUTBOX_ENABLED: Joi.boolean().default(false),
  EMAIL_FROM: Joi.when('EMAIL_PROVIDER', {
    is: Joi.valid('postmark', 'resend'),
    then: Joi.string().email().required(),
    otherwise: Joi.string().optional().allow(''),
  }),
  POSTMARK_SERVER_TOKEN: Joi.when('EMAIL_PROVIDER', {
    is: 'postmark',
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow(''),
  }),
  RESEND_API_KEY: Joi.when('EMAIL_PROVIDER', {
    is: 'resend',
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow(''),
  }),
  REDIS_URL: Joi.string().optional().allow(''),
  RATE_LIMIT_STORAGE: Joi.string().valid('memory', 'redis').default('memory'),
  RATE_LIMIT_MULTI_INSTANCE: Joi.boolean().default(false),
  RATE_LIMIT_REQUIRE_REDIS_IN_PRODUCTION: Joi.boolean().default(false),
  MARKET_OVERVIEW_CACHE_TTL_MS: Joi.number().integer().min(1000).optional(),
  MARKET_OVERVIEW_STALE_TTL_MS: Joi.number().integer().min(1000).optional(),
  POSTMARK_MESSAGE_STREAM: Joi.string().optional().allow(''),
  APP_PUBLIC_URL: Joi.string().uri().default('http://localhost:3000'),
  EMAIL_VERIFICATION_TOKEN_TTL_HOURS: Joi.number().integer().min(1).default(24),
  PASSWORD_RESET_TOKEN_TTL_HOURS: Joi.number().integer().min(1).default(1),
  /** Base64 of 32 bytes (AES-256-GCM). Optional at boot; required when using 2FA setup/verify. */
  TWO_FACTOR_ENCRYPTION_KEY: Joi.string().optional().allow(''),
  MIN_WITHDRAWAL_USDT: Joi.number().min(0).default(50),
  WITHDRAWAL_FEE_USDT: Joi.number().min(0).default(5),
  ALLOW_DEV_DEPOSIT_ADDRESS: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.boolean().valid(false).default(false),
    otherwise: Joi.boolean().default(false),
  }),
  DEPOSIT_INGESTION_ENABLED: Joi.boolean().default(false),
  TRON_PROVIDER_MODE: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.when('FEATURE_ENABLE_DEPOSITS', {
      is: false,
      then: Joi.string().valid('mock', 'tron').default('mock'),
      otherwise: Joi.when('DEPOSIT_INGESTION_ENABLED', {
        is: true,
        then: Joi.string().valid('tron').required(),
        otherwise: Joi.string().valid('mock', 'tron').default('mock'),
      }),
    }),
    otherwise: Joi.string().valid('mock', 'tron').default('mock'),
  }),
  TRON_PROVIDER_URL: Joi.string().optional().allow(''),
  TRON_API_KEY: Joi.string().optional().allow(''),
  TRON_CONFIRMATIONS: Joi.number().integer().min(1).default(20),
  TRON_POLL_INTERVAL: Joi.number().integer().min(5000).default(15000),
  TRON_USDT_CONTRACT: Joi.string().optional().allow(''),
  REPORT_WORKER_ENABLED: Joi.when('NODE_ENV', {
    is: 'development',
    then: Joi.boolean().default(false),
    otherwise: Joi.boolean().default(true),
  }),
  REPORT_WORKER_POLL_MS: Joi.number().integer().min(5000).default(15000),
  REPORT_WORKER_MAX_ATTEMPTS: Joi.number().integer().min(1).default(3),
  REPORT_WORKER_TIMEOUT_MS: Joi.number().integer().min(60000).default(900000),
  REPORT_RETENTION_DAYS: Joi.number().integer().min(1).default(7),
  REPORT_STORAGE_MODE: Joi.string()
    .valid('db', 'local', 'object', 'supabase')
    .default('db'),
  REPORT_STORAGE_BUCKET: Joi.string().optional().allow(''),
  REPORT_STORAGE_PUBLIC_URL: Joi.string().optional().allow(''),
  REPORT_STORAGE_ACCESS_KEY: Joi.string().optional().allow(''),
  REPORT_STORAGE_SECRET_KEY: Joi.string().optional().allow(''),
  REPORT_STORAGE_ENDPOINT: Joi.string().optional().allow(''),
  REPORT_STORAGE_REGION: Joi.string().optional().allow(''),
  REPORT_STORAGE_FORCE_PATH_STYLE: Joi.boolean().default(false),
  /** Supabase Storage (backend only — never expose service role to frontend). */
  SUPABASE_URL: Joi.string().uri().optional().allow(''),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional().allow(''),
  SUPABASE_STORAGE_RELEASE_COVERS_BUCKET:
    Joi.string().default('release-covers'),
  SUPABASE_STORAGE_RELEASE_AUDIO_BUCKET: Joi.string().default('release-audio'),
  SUPABASE_STORAGE_REPORTS_BUCKET: Joi.string().default('reports'),
  SUPABASE_STORAGE_USER_DOCUMENTS_BUCKET:
    Joi.string().default('user-documents'),
  /** Optional bearer token for GET /health/deep (internal probes). */
  HEALTH_DEEP_TOKEN: Joi.string().optional().allow(''),
  ERROR_TRACKING_PROVIDER: Joi.string()
    .valid('disabled', 'console', 'sentry')
    .default('console'),
  SENTRY_DSN: Joi.string().optional().allow(''),
  ERROR_TRACKING_ENVIRONMENT: Joi.string().optional().allow(''),
  ERROR_TRACKING_RELEASE: Joi.string().optional().allow(''),
  LOG_LEVEL: Joi.string().valid('debug', 'log', 'warn', 'error').default('log'),
  OPENAPI_ENABLED: Joi.boolean().default(false),
  EVENT_OUTBOX_WORKER_ENABLED: Joi.boolean().default(true),
  EVENT_OUTBOX_POLL_MS: Joi.number().integer().min(3000).default(10000),
  RETENTION_CLEANUP_ENABLED: Joi.boolean().default(false),
  FEATURE_ENABLE_DEPOSITS: Joi.boolean().default(true),
  FEATURE_ENABLE_WITHDRAWALS: Joi.boolean().default(true),
  FEATURE_ENABLE_PRIMARY_MARKET: Joi.boolean().default(true),
  FEATURE_ENABLE_SECONDARY_MARKET: Joi.boolean().default(true),
  FEATURE_ENABLE_DOCUMENTS: Joi.boolean().default(true),
  FEATURE_ENABLE_NOTIFICATIONS: Joi.boolean().default(true),
  FEATURE_ENABLE_EMAIL_DELIVERY: Joi.boolean().default(true),
  KILL_SWITCH_DISABLE_WITHDRAWALS: Joi.boolean().default(false),
  KILL_SWITCH_DISABLE_SECONDARY_TRADING: Joi.boolean().default(false),
  KILL_SWITCH_DISABLE_PRIMARY_PURCHASES: Joi.boolean().default(false),
  KILL_SWITCH_DISABLE_DEPOSIT_CREDIT: Joi.boolean().default(false),
});
