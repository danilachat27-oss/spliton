import { test, expect } from '@playwright/test';

import { ROUTES } from '../../constants/routes';

test.describe('Public smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 }).or(page.getByRole('main'))).toBeVisible();
  });

  test('admin login page renders', async ({ page }) => {
    await page.goto(ROUTES.adminLogin);
    await expect(page.locator('body')).toBeVisible();
  });

  test('guest visiting /admin is redirected to admin login', async ({ page }) => {
    await page.goto(ROUTES.admin);
    await expect(page).toHaveURL(new RegExp(`${ROUTES.adminLogin.replace('/', '\\/')}`), {
      timeout: 30_000,
    });
  });

  test('catalog route responds', async ({ page }) => {
    await page.goto('/dashboard/catalog');
    await expect(page.locator('body')).toBeVisible();
  });

  test('wallet profile route responds', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await expect(page.locator('body')).toBeVisible();
  });

  test('secondary market route responds', async ({ page }) => {
    await page.goto('/dashboard/secondary-market');
    await expect(page.locator('body')).toBeVisible();
  });

  test('assets overview responds', async ({ page }) => {
    await page.goto('/assets');
    await expect(page.locator('body')).toBeVisible();
  });
});
