/**
 * After `jest-e2e.setup.ts`, `DATABASE_URL` is the effective DB URL for tests
 * (including when it was copied from `TEST_DATABASE_URL`).
 */
export function resolveE2eDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for e2e (set DATABASE_URL or TEST_DATABASE_URL)");
  }
  return url;
}
