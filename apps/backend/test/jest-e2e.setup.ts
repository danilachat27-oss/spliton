import { randomBytes } from 'crypto';

process.env.NODE_ENV = 'test';

/**
 * Prisma reads `DATABASE_URL` from the environment. For e2e, optionally point at an
 * isolated database without mutating developer `.env` files: set `TEST_DATABASE_URL`
 * and this file applies it for the Jest process only.
 */
const testDbUrl = process.env.TEST_DATABASE_URL?.trim();
if (testDbUrl) {
  process.env.DATABASE_URL = testDbUrl;
}

/** 32-byte AES key for 2FA e2e (base64); never log this value. */
if (!process.env.TWO_FACTOR_ENCRYPTION_KEY?.trim()) {
  process.env.TWO_FACTOR_ENCRYPTION_KEY = randomBytes(32).toString('base64');
}
