import { expect, type Page } from '@playwright/test';

import { ROUTES } from '../../constants/routes';
import { ADMIN_SECTION_LABELS } from '../../features/admin/lib/admin-i18n';
import {
  getVisibleAdminNav,
  type AdminNavItem,
} from '../../features/admin/config/admin-sections';
import type { AdminRoleCode, StaffRoleCode } from '../../features/admin/types/admin-roles';
import { setSessionHintCookie } from './mock-investor-session';

const E2E_TOKEN = 'playwright-e2e-token';

type MockStaffOptions = {
  roles: AdminRoleCode[];
  email?: string;
};

function staffUser(roles: AdminRoleCode[], email: string) {
  return {
    id: 'playwright-user',
    email,
    displayName: 'Playwright Staff',
    roles,
    status: 'ACTIVE',
    emailVerifiedAt: new Date().toISOString(),
  };
}

/** Mock refresh + admin gate so operator shell renders without a live API. */
export async function mockStaffSession(
  page: Page,
  { roles, email = 'staff@example.com' }: MockStaffOptions,
): Promise<void> {
  const user = staffUser(roles, email);
  const context = page.context();

  await setSessionHintCookie(page);

  await context.route('**/auth/refresh', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user,
        tokens: { accessToken: E2E_TOKEN, refreshToken: 'playwright-refresh' },
      }),
    });
  });

  await context.route('**/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });

  await context.route('**/api/admin/v1/access', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        version: 'v1',
        sections: [],
        capabilities: {
          assignRoles: roles.includes('SUPER_ADMIN'),
          patchPlatformFees: roles.includes('SUPER_ADMIN'),
        },
      }),
    });
  });

  await context.route('**/admin/access', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}

/** Waits until auth refresh hydrates and admin shell is visible. */
export async function bootstrapStaffSession(
  page: Page,
  options: MockStaffOptions,
): Promise<void> {
  await mockStaffSession(page, options);
  await page.goto(ROUTES.admin);
  await expect(page.getByRole('complementary', { name: /навигация панели управления/i })).toBeVisible({
    timeout: 30_000,
  });
}

export function expectedNavTestIds(roles: StaffRoleCode[]): string[] {
  return getVisibleAdminNav(roles).map((item: AdminNavItem) => `admin-nav-${item.id}`);
}

export function sectionForbiddenHeading(): RegExp {
  return /нет доступа к этому разделу/i;
}

export { ADMIN_SECTION_LABELS, E2E_TOKEN };
