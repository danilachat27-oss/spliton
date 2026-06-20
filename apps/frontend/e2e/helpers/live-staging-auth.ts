import { expect, test, type Page } from '@playwright/test';

import { SPLITON_SESSION_COOKIE } from '../../lib/auth/session-cookie';

export function stagingCredentials(): { email: string; password: string } | null {
  const email = process.env.PLAYWRIGHT_TEST_USER_EMAIL?.trim();
  const password = process.env.PLAYWRIGHT_TEST_USER_PASSWORD?.trim();
  if (!email || !password) return null;
  return { email, password };
}

export function hasStagingCredentials(): boolean {
  return stagingCredentials() !== null;
}

/** Real backend login — no route mocks. Requires live API + seeded staging user. */
export async function loginStagingUser(
  page: Page,
  options?: { next?: string },
): Promise<void> {
  const creds = stagingCredentials();
  test.skip(!creds, 'Set PLAYWRIGHT_TEST_USER_EMAIL and PLAYWRIGHT_TEST_USER_PASSWORD for live staging auth');

  const next = options?.next ?? '/app';
  await page.goto(`/login?next=${encodeURIComponent(next)}`);

  await page.locator('#email').fill(creds!.email);
  await page.locator('#password').fill(creds!.password);
  await page.locator('form button[type="submit"]').click();

  await expect(page).not.toHaveURL(/\/login(\?|$)/, { timeout: 30_000 });
  await page.waitForFunction(
    (cookieName) =>
      document.cookie.split(';').some((part) => part.trim().startsWith(`${cookieName}=1`)),
    SPLITON_SESSION_COOKIE,
    { timeout: 15_000 },
  );
}
