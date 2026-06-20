import { test, expect } from '@playwright/test';

import { SECONDARY_MARKET_DEMO_KPI } from '../../lib/secondary-market/secondary-market-kpi';
import { hasStagingCredentials, loginStagingUser } from '../helpers/live-staging-auth';
import { mockInvestorSession, setSessionHintCookie } from '../helpers/mock-investor-session';

/**
 * Secondary market smoke. KPI in live must come from API — demo hardcoded "184 200" forbidden.
 */

test.describe('Secondary market smoke', () => {
  test('without auth redirects to login', async ({ page }) => {
    await page.goto('/dashboard/secondary-market');
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
    expect(page.url()).toContain('next=%2Fdashboard%2Fsecondary-market');
  });

  test('session hint without JWT shows auth gate, not demo KPI', async ({ page }) => {
    await setSessionHintCookie(page);
    await page.goto('/dashboard/secondary-market');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
    await expect(page.getByText(/Войдите, чтобы торговать/i)).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain(SECONDARY_MARKET_DEMO_KPI.volume24h);
    expect(bodyText).not.toMatch(/184[\s\u00a0]?200/);
    expect(bodyText).not.toMatch(/сделка успешно|покупка завершена/i);
  });

  test('full auth session: live KPI without hardcoded demo (optional)', async ({ page }) => {
    await mockInvestorSession(page);
    await page.goto('/app');
    const loginVisible = await page.getByRole('link', { name: 'Войти' }).isVisible().catch(() => true);
    test.skip(loginVisible, 'Client JWT mock не поднялся — KPI smoke покрыт unit-тестами mapSecondaryMarketKpi');

    await page.goto('/dashboard/secondary-market');
    await expect(page.getByText(/Демо-сводка вторичного рынка/i)).toHaveCount(0);
    await expect(page.getByText(SECONDARY_MARKET_DEMO_KPI.volume24h)).toHaveCount(0);
    await expect(page.getByText(/Объём · 24ч/i)).toBeVisible({ timeout: 15_000 });
  });

  test.describe('with live staging auth', () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!hasStagingCredentials(), 'Requires PLAYWRIGHT_TEST_USER_* for live secondary smoke');
      await loginStagingUser(page, { next: '/dashboard/secondary-market' });
    });

    test('loads listings from API without demo KPI', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/secondary-market/, { timeout: 30_000 });

      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain(SECONDARY_MARKET_DEMO_KPI.volume24h);
      expect(bodyText).not.toMatch(/184[\s\u00a0]?200/);
      expect(bodyText).not.toMatch(/Демо-сводка вторичного рынка/i);

      await expect(page.getByText(/Объём · 24ч|Вторичный рынок|листинг/i).first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText(/undefined|null|NaN/i)).toHaveCount(0);
    });

    test('trade history section renders (empty or populated)', async ({ page }) => {
      await page.getByRole('tab', { name: /сделк|trades/i }).click();
      await expect(page.getByText(/журнал|исполнен|сделок|loading history/i).first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText(/undefined|null|NaN/i)).toHaveCount(0);
    });
  });
});
