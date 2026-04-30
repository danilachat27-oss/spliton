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
});
