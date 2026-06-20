import { test, expect } from '@playwright/test';

import { loginStagingUser } from '../helpers/live-staging-auth';
import { playwrightCookieDomain } from '../helpers/mock-investor-session';
import { SPLITON_SESSION_COOKIE } from '../../lib/auth/session-cookie';

const PROTECTED_PAGES = [
  '/catalog',
  '/catalog/market-overview',
  '/analytics/releases',
  '/assets/overview',
  '/assets/positions',
  '/assets/activity',
  '/assets/payouts',
  '/assets/payouts/deposit',
  '/assets/payouts/withdraw',
  '/services/calculator',
  '/services/fees',
  '/services/status',
  '/services/news',
  '/dashboard/profile',
  '/dashboard/profile?tab=security',
  '/dashboard/profile?tab=verification',
] as const;

test.describe('Protected pages smoke (session hint)', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: SPLITON_SESSION_COOKIE,
        value: '1',
        domain: playwrightCookieDomain(),
        path: '/',
      },
    ]);
  });

  for (const path of PROTECTED_PAGES) {
    test(`renders ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('Staging credentials smoke', () => {
  test('login and open assets overview', async ({ page }) => {
    await loginStagingUser(page, { next: '/assets/overview' });
    await expect(page).toHaveURL(/\/assets\/overview/, { timeout: 30_000 });
  });
});
