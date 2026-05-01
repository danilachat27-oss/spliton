import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),
  /** When set with NODE_ENV=test, Prisma uses this URL instead of DATABASE_URL (optional). */
  TEST_DATABASE_URL: Joi.string().optional().allow(''),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  PORT: Joi.number().port().default(4000),
  CORS_ORIGIN: Joi.string().default('*'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  EMAIL_PROVIDER: Joi.string().valid('dev', 'postmark').default('dev'),
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
