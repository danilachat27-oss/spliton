import { configureE2eDatabase } from './helpers/e2e-database-config';

describe('configureE2eDatabase', () => {
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of [
      'CI',
      'GITHUB_ACTIONS',
      'TEST_DATABASE_URL',
      'TEST_DIRECT_URL',
      'DATABASE_URL',
      'ALLOW_E2E_ON_DATABASE_URL',
      'ALLOW_E2E_CLEANUP',
    ]) {
      prev[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('throws in CI when TEST_DATABASE_URL is missing', () => {
    process.env.CI = 'true';
    delete process.env.TEST_DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://test@localhost/e2e';
    expect(() => configureE2eDatabase()).toThrow(/TEST_DATABASE_URL is required in CI/);
  });

  it('uses TEST_DATABASE_URL when set', () => {
    delete process.env.CI;
    process.env.TEST_DATABASE_URL = 'postgresql://test@localhost/isolated';
    process.env.ALLOW_E2E_CLEANUP = '1';
    configureE2eDatabase();
    expect(process.env.DATABASE_URL).toBe('postgresql://test@localhost/isolated');
  });
});
