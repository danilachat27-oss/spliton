import { assertSafeE2eCleanupTarget } from './e2e-database-url';

/**
 * Configures isolated DB for e2e. In CI, TEST_DATABASE_URL is mandatory.
 * Locally, set TEST_DATABASE_URL or ALLOW_E2E_ON_DATABASE_URL=1 (shared dev DB only).
 */
export function configureE2eDatabase(): void {
  const ci =
    process.env.CI === 'true' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.CI === '1';

  const testDbUrl = process.env.TEST_DATABASE_URL?.trim();
  const testDirectUrl = process.env.TEST_DIRECT_URL?.trim();

  if (testDbUrl) {
    process.env.DATABASE_URL = testDbUrl;
    if (testDirectUrl) {
      process.env.DIRECT_URL = testDirectUrl;
    }
    assertSafeE2eCleanupTarget(testDbUrl);
    return;
  }

  if (ci) {
    throw new Error(
      '[e2e] TEST_DATABASE_URL is required in CI. Set BACKEND_E2E_TEST_DATABASE_URL secret ' +
        'and map it to TEST_DATABASE_URL in the workflow.',
    );
  }

  const mainUrl = process.env.DATABASE_URL?.trim();
  if (!mainUrl) {
    throw new Error(
      '[e2e] DATABASE_URL or TEST_DATABASE_URL is required for e2e tests.',
    );
  }

  if (process.env.ALLOW_E2E_ON_DATABASE_URL !== '1') {
    throw new Error(
      '[e2e] TEST_DATABASE_URL is not set. Use a dedicated test database, or set ' +
        'ALLOW_E2E_ON_DATABASE_URL=1 only for local shared dev DB (not staging/prod).',
    );
  }

  assertSafeE2eCleanupTarget(mainUrl);
  console.warn(
    '[e2e] ALLOW_E2E_ON_DATABASE_URL=1 — running on DATABASE_URL. Prefer TEST_DATABASE_URL.',
  );
}
