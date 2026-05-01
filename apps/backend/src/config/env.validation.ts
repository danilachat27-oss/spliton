import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),
  /** When set with NODE_ENV=test, Prisma uses this URL instead of DATABASE_URL (optional). */
  TEST_DATABASE_URL: Joi.string().optional().allow(''),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  PORT: Joi.number().port().default(4000),
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
  EMAIL_PROVIDER: Joi.string().valid('dev', 'postmark').default('dev'),
  DEV_EMAIL_OUTBOX_ENABLED: Joi.boolean().default(false),
  EMAIL_FROM: Joi.when('EMAIL_PROVIDER', {
    is: 'postmark',
    then: Joi.string().email().required(),
    otherwise: Joi.string().optional().allow(''),
  }),
  POSTMARK_SERVER_TOKEN: Joi.when('EMAIL_PROVIDER', {
    is: 'postmark',
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow(''),
  }),
  POSTMARK_MESSAGE_STREAM: Joi.string().optional().allow(''),
  APP_PUBLIC_URL: Joi.string().uri().default('http://localhost:3000'),
  EMAIL_VERIFICATION_TOKEN_TTL_HOURS: Joi.number().integer().min(1).default(24),
  /** Base64 of 32 bytes (AES-256-GCM). Optional at boot; required when using 2FA setup/verify. */
  TWO_FACTOR_ENCRYPTION_KEY: Joi.string().optional().allow(''),
});
