import { test, expect } from '@playwright/test';

import type { StaffRoleCode } from '../../features/admin/types/admin-roles';
import { ROUTES } from '../../constants/routes';
import {
  expectedNavTestIds,
  mockStaffSession,
  sectionForbiddenHeading,
} from '../helpers/mock-staff-session';

const MATRIX_ROLES: StaffRoleCode[] = [
  'SUPER_ADMIN',
  'ACCOUNTANT',
  'CONTENT_MANAGER',
  'SUPPORT_MANAGER',
  'COMPLIANCE',
  'BUSINESS_ANALYST',
  'NEWS_MANAGER',
];

for (const role of MATRIX_ROLES) {
  test.describe(`Admin nav — ${role}`, () => {
    test.beforeEach(async ({ page }) => {
      await mockStaffSession(page, { roles: [role] });
    });

    test('sidebar shows only allowed sections', async ({ page }) => {
      await page.goto(ROUTES.admin);
      await expect(
        page.getByRole('complementary', { name: /навигация панели управления/i }),
      ).toBeVisible({
        timeout: 30_000,
      });

      const expected = expectedNavTestIds([role]);
      for (const testId of expected) {
        await expect(page.getByTestId(testId)).toBeVisible();
      }

      const settingsLink = page.getByTestId('admin-nav-settings');
      if (role === 'SUPER_ADMIN') {
        await expect(settingsLink).toBeVisible();
      } else {
        await expect(settingsLink).toHaveCount(0);
      }

      const rolesLink = page.getByTestId('admin-nav-roles');
      if (role === 'SUPER_ADMIN') {
        await expect(rolesLink).toBeVisible();
      } else {
        await expect(rolesLink).toHaveCount(0);
      }
    });
  });
}

test.describe('BUSINESS_ANALYST read-only', () => {
  test.beforeEach(async ({ page }) => {
    await mockStaffSession(page, { roles: ['BUSINESS_ANALYST'] });
  });

  test('settings page is blocked in UI', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.getByText(sectionForbiddenHeading())).toBeVisible({ timeout: 30_000 });
  });

  test('analytics overview is reachable', async ({ page }) => {
    await page.goto('/admin/analytics');
    await expect(page.getByTestId('admin-nav-analyticsOverview')).toBeVisible();
  });
});

test.describe('Regular user', () => {
  test.beforeEach(async ({ page }) => {
    await mockStaffSession(page, { roles: ['INVESTOR'] });
  });

  test('non-staff sees access denied', async ({ page }) => {
    await page.goto(ROUTES.admin);
    await expect(page.getByText(/нет доступа|доступ запрещён/i)).toBeVisible({ timeout: 30_000 });
  });
});

test.describe('SUPER_ADMIN privileged sections', () => {
  test.beforeEach(async ({ page }) => {
    await mockStaffSession(page, { roles: ['SUPER_ADMIN'] });
  });

  test('roles and settings nav entries exist', async ({ page }) => {
    await page.goto(ROUTES.admin);
    await expect(page.getByTestId('admin-nav-roles')).toBeVisible();
    await expect(page.getByTestId('admin-nav-settings')).toBeVisible();
  });
});
