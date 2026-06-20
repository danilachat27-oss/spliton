import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // Local retries absorb dev-server cold-start / port contention flakes.
  retries: process.env.CI ? 1 : 1,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.CI
    ? {
        command: 'npm run start',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          ...process.env,
          NEXT_PUBLIC_CATALOG_DATA_SOURCE: process.env.PLAYWRIGHT_CATALOG_DATA_SOURCE ?? 'live',
        },
      }
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.PLAYWRIGHT_FRESH_DEV,
        timeout: 180_000,
        env: {
          ...process.env,
          NEXT_PUBLIC_CATALOG_DATA_SOURCE: process.env.PLAYWRIGHT_CATALOG_DATA_SOURCE ?? 'live',
        },
      },
});
