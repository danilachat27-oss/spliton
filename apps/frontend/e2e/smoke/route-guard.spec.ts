import { test, expect } from '@playwright/test';

import { SPLITON_SESSION_COOKIE } from '../../lib/auth/session-cookie';
import { playwrightCookieDomain } from '../helpers/mock-investor-session';

/**
 * Browser smoke for Next.js proxy route guard.
 * Session hint cookie is NOT financial security — backend JWT remains source of truth.
 */

const PROTECTED_REDIRECTS: { path: string; nextEncoded: string }[] = [
  { path: '/assets/overview', nextEncoded: 'next=%2Fassets%2Foverview' },
  { path: '/assets/payouts/withdraw', nextEncoded: 'next=%2Fassets%2Fpayouts%2Fwithdraw' },
  { path: '/dashboard/profile', nextEncoded: 'next=%2Fdashboard%2Fprofile' },
  { path: '/dashboard/secondary-market', nextEncoded: 'next=%2Fdashboard%2Fsecondary-market' },
];

const PUBLIC_ROUTES = [
  '/app',
  '/catalog',
  '/analytics/releases',
  '/guide/selection',
  '/catalog/market-overview',
  '/fees',
  '/news',
  '/support',
] as const;

test.describe('Route guard smoke (proxy)', () => {
  test.describe('without spliton_session', () => {
    for (const { path, nextEncoded } of PROTECTED_REDIRECTS) {
      test(`redirects ${path} to login`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
        expect(page.url()).toContain(nextEncoded);
      });
    }

    for (const path of PUBLIC_ROUTES) {
      test(`allows public route ${path}`, async ({ page }) => {
        await page.goto(path);
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
        expect(page.url()).toContain(path);
      });
    }
  });

  test.describe('with spliton_session=1 hint', () => {
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

    for (const path of ['/assets/overview', '/dashboard/profile', '/dashboard/secondary-market'] as const) {
      test(`does not redirect ${path} to login`, async ({ page }) => {
        await page.goto(path);
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
        expect(page.url()).toContain(path);
      });
    }
  });
});
