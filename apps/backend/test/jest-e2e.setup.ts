process.env.NODE_ENV = "test";

/**
 * Prisma reads `DATABASE_URL` from the environment. For e2e, optionally point at an
 * isolated database without mutating developer `.env` files: set `TEST_DATABASE_URL`
 * and this file applies it for the Jest process only.
 */
const testDbUrl = process.env.TEST_DATABASE_URL?.trim();
if (testDbUrl) {
  process.env.DATABASE_URL = testDbUrl;
}
