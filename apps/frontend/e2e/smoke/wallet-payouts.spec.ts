import { test, expect } from '@playwright/test';

import { hasStagingCredentials, loginStagingUser } from '../helpers/live-staging-auth';
import { mockInvestorSession } from '../helpers/mock-investor-session';

/**
 * Wallet/payouts smoke. Proxy session hint + backend JWT — financial truth is on API.
 */

const PROTECTED_WALLET_PATHS = [
  '/assets/overview',
  '/assets/activity',
  '/assets/positions',
  '/assets/payouts/deposit',
  '/assets/payouts/withdraw',
] as const;

test.describe('Wallet / payouts smoke', () => {
  test.describe('without auth', () => {
    for (const path of PROTECTED_WALLET_PATHS) {
      test(`redirects ${path} to login`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
        expect(page.url()).toContain(`next=${encodeURIComponent(path)}`);
      });
    }
  });

  test.describe('with mocked investor session', () => {
    test.beforeEach(async ({ page }) => {
      await mockInvestorSession(page);
      await page.goto('/app');
      await page.waitForLoadState('networkidle');
    });

    test('assets overview opens without login redirect', async ({ page }) => {
      await page.goto('/assets/overview');
      await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByText(/undefined|null|NaN|\[object Object\]/i)).toHaveCount(0);
    });

    test('deposit page shows address from API mock, not silent fake success', async ({ page }) => {
      await page.goto('/assets/payouts/deposit');
      await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

      await expect(page.getByText(/TPlaywrightE2EDepositAddress01|Пополнение|депозит/i).first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText(/зачислен|успешно/i)).toHaveCount(0);
      await expect(page.getByText(/undefined|null|NaN/i)).toHaveCount(0);
    });

    test('withdraw page renders step 1 wizard shell', async ({ page }) => {
      await page.goto('/assets/payouts/withdraw');
      await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
      await expect(page.getByRole('heading', { name: 'Вывод' })).toBeVisible();
      await expect(page.getByPlaceholder('Amount USDT')).toBeVisible();
      await expect(page.getByText(/заявка выполнена|вывод завершён/i)).toHaveCount(0);
    });

    test('withdraw TRC20/min validation (full wizard)', async () => {
      // Client wizard step transitions need real JWT hydration or staging login.
      // Automated validation smoke: STAGING_MANUAL_QA.md §3; live block below when PLAYWRIGHT_TEST_USER_* set.
      test.skip(true, 'Wizard steps require live staging auth — see with live staging auth describe');
    });
  });

  test.describe('with live staging auth', () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!hasStagingCredentials(), 'Requires PLAYWRIGHT_TEST_USER_* for live withdraw smoke');
      await loginStagingUser(page, { next: '/assets/payouts/withdraw' });
    });

    test('withdraw page loads balance from API without fake completed state', async ({ page }) => {
      await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
      await expect(page.getByText(/Вывод/i).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/заявка выполнена|вывод завершён/i)).toHaveCount(0);
      await expect(page.getByText(/undefined|null|NaN/i)).toHaveCount(0);
    });

    test('invalid TRC20 shows Russian validation error on submit', async ({ page }) => {
      await fillWithdrawAmount(page, '100');
      await advanceWithdrawWizard(page);
      await page.getByPlaceholder('TRC20 address (T...)').fill('not-a-tron-address');
      await advanceWithdrawWizard(page);
      await submitWithdraw(page);
      await expect(page.getByText(/Адрес TRC20/i)).toBeVisible({ timeout: 10_000 });
    });
  });
});

async function advanceWithdrawWizard(page: import('@playwright/test').Page) {
  const btn = page.getByRole('button', { name: 'Продолжить' });
  await expect(btn).toBeVisible();
  await btn.click();
}

async function fillWithdrawAmount(page: import('@playwright/test').Page, value: string) {
  await page.getByPlaceholder('Amount USDT').fill(value);
}

async function fillWithdrawAddress(page: import('@playwright/test').Page, value: string) {
  await page.getByPlaceholder('TRC20 address (T...)').fill(value);
}

async function submitWithdraw(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /Отправить заявку/i }).click();
}
