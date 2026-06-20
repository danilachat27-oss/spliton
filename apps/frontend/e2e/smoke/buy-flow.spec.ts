import { test, expect } from '@playwright/test';

import {
  loginNextParam,
  resolvePlaywrightBuyReleaseId,
} from '../helpers/e2e-fixtures';
import { hasStagingCredentials, loginStagingUser } from '../helpers/live-staging-auth';
import {
  bootstrapInvestorSession,
  mockPrimaryRoundRoutes,
} from '../helpers/mock-investor-session';

/**
 * Buy flow smoke. Backend JWT is source of truth — these tests verify UI gates, not money security.
 */

async function gotoBuyPage(
  page: import('@playwright/test').Page,
  request: import('@playwright/test').APIRequestContext,
): Promise<string | null> {
  const releaseId = await resolvePlaywrightBuyReleaseId(request);
  if (!releaseId) {
    test.skip(true, 'Set PLAYWRIGHT_BUY_RELEASE_ID or ensure catalog API has releases.');
    return null;
  }

  await page.goto(`/catalog/buy/${encodeURIComponent(releaseId)}`);

  const notFound = await page.getByTestId('catalog-buy-not-found').isVisible().catch(() => false);
  if (notFound) {
    test.skip(
      true,
      `Buy page: release ${releaseId} not found. Set PLAYWRIGHT_BUY_RELEASE_ID to a live release id.`,
    );
    return null;
  }

  const roundClosed = await page
    .getByText(
      /Первичный раунд завершён|Primary round (is )?closed|Покупка недоступна|sold out/i,
    )
    .isVisible()
    .catch(() => false);
  if (roundClosed) {
    test.skip(
      true,
      `Buy page: release ${releaseId} has no open primary round. Set PLAYWRIGHT_BUY_RELEASE_ID to a purchasable release.`,
    );
    return null;
  }

  return releaseId;
}

test.describe('Buy flow smoke', () => {
  test.describe('without auth (live wallet)', () => {
    test('shows login gate without purchase button or demo receipt', async ({ page, request }) => {
      const releaseId = await gotoBuyPage(page, request);
      if (!releaseId) return;
      const buyPath = `/catalog/buy/${encodeURIComponent(releaseId)}`;

      await expect(page.getByTestId('buy-login-gate')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('buy-login-cta')).toHaveAttribute(
        'href',
        expect.stringContaining('/login'),
      );
      await expect(page.getByTestId('buy-login-cta')).toHaveAttribute(
        'href',
        expect.stringContaining(loginNextParam(buyPath)),
      );

      await expect(page.getByTestId('buy-submit-button')).toHaveCount(0);
      await expect(page.getByText(/Демо-режим/i)).toHaveCount(0);
      await expect(page.getByText(/DEMO-/i)).toHaveCount(0);
      await expect(page.getByText(/Оператор подключён/i)).toHaveCount(0);
    });

    test('login CTA includes next return path', async ({ page, request }) => {
      const releaseId = await gotoBuyPage(page, request);
      if (!releaseId) return;
      const encoded = encodeURIComponent(`/catalog/buy/${releaseId}`);
      const loginLink = page.getByTestId('buy-login-cta');
      await expect(loginLink).toHaveAttribute(
        'href',
        new RegExp(`next=${encoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
      );
    });
  });

  test('catalog → buy CTA leads to login gate when unauthenticated', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.locator('body')).toBeVisible({ timeout: 30_000 });

    const buyLink = page.getByRole('link', { name: /Купить UNT|Buy UNT|Comprar UNT/i }).first();
    const buyVisible = await buyLink.isVisible().catch(() => false);
    if (!buyVisible) {
      test.skip(true, 'Catalog has no buy links — catalog API may be empty');
    }

    await buyLink.click();
    await expect(page).toHaveURL(/\/catalog\/buy\//, { timeout: 30_000 });

    const onLoginGate =
      (await page.getByTestId('buy-login-gate').isVisible().catch(() => false)) ||
      (await page.url()).includes('/login');
    expect(onLoginGate).toBe(true);
  });

  test.describe('with mocked investor session', () => {
    test('authenticated buy page loads round preview and shows insufficient balance state', async ({
      page,
      request,
    }) => {
      const releaseId = await resolvePlaywrightBuyReleaseId(request);
      test.skip(!releaseId, 'Set PLAYWRIGHT_BUY_RELEASE_ID or start catalog API for auth buy smoke');

      await bootstrapInvestorSession(page);
      await mockPrimaryRoundRoutes(page, releaseId, {
        canPurchase: false,
        blockingReason: 'INSUFFICIENT_BALANCE',
      });

      await page.goto(`/catalog/buy/${encodeURIComponent(releaseId)}`);
      const notFound = await page.getByTestId('catalog-buy-not-found').isVisible().catch(() => false);
      test.skip(notFound, 'Release not found for auth buy smoke');

      await expect(page.getByTestId('buy-submit-button')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/Недостаточно USDT|Insufficient USDT/i)).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(/Демо-режим/i)).toHaveCount(0);
    });
  });

  test.describe('with live staging auth', () => {
    test('login redirect preserves ?next= to buy page', async ({ page, request }) => {
      test.skip(!hasStagingCredentials(), 'Requires PLAYWRIGHT_TEST_USER_* for live login smoke');

      const releaseId = await resolvePlaywrightBuyReleaseId(request);
      test.skip(!releaseId, 'Set PLAYWRIGHT_BUY_RELEASE_ID for live buy smoke');

      const buyPath = `/catalog/buy/${encodeURIComponent(releaseId)}`;
      await loginStagingUser(page, { next: buyPath });

      await expect(page).toHaveURL(
        new RegExp(`/catalog/buy/${releaseId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
        { timeout: 30_000 },
      );
      await expect(page.getByTestId('buy-submit-button')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/Демо-режим/i)).toHaveCount(0);
    });

    test('live purchase creates order only via backend (staging-only, mutates balance)', async ({
      page,
      request,
    }) => {
      test.skip(
        process.env.PLAYWRIGHT_ENABLE_LIVE_PURCHASE !== '1',
        'Real purchase requires PLAYWRIGHT_ENABLE_LIVE_PURCHASE=1 — controlled staging QA only',
      );
      test.skip(!hasStagingCredentials(), 'Requires PLAYWRIGHT_TEST_USER_* and seeded wallet balance');

      const releaseId = await resolvePlaywrightBuyReleaseId(request);
      test.skip(!releaseId, 'Set PLAYWRIGHT_BUY_RELEASE_ID from staging seed');

      const buyPath = `/catalog/buy/${encodeURIComponent(releaseId)}`;
      await loginStagingUser(page, { next: buyPath });

      await expect(page.getByTestId('buy-submit-button')).toBeVisible({ timeout: 30_000 });

      const blocking = await page
        .getByText(/Недостаточно USDT|Insufficient USDT/i)
        .isVisible()
        .catch(() => false);
      test.skip(blocking, 'Test user has insufficient balance — top up staging seed wallet');

      const buyBtn = page.getByTestId('buy-submit-button');
      await buyBtn.click();

      const consentModal = page.getByRole('dialog');
      if (await consentModal.isVisible().catch(() => false)) {
        const accept = page.getByRole('button', { name: /принять|согласен|продолжить|accept|continue/i }).first();
        if (await accept.isVisible().catch(() => false)) {
          await accept.click();
        }
      }

      await expect(page.getByText(/DEMO-/i)).toHaveCount(0, { timeout: 60_000 });
      const receiptVisible =
        (await page.getByText(/ордер|заявка|покупка|order|purchase/i).first().isVisible().catch(() => false)) ||
        (await page.getByRole('dialog').isVisible().catch(() => false));
      expect(receiptVisible).toBe(true);
    });
  });

  test('release not found shows localized not-found state', async ({ page }) => {
    await page.goto('/catalog/buy/00000000-0000-4000-8000-000000000099');
    await expect(page.getByTestId('catalog-buy-not-found')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('catalog-buy-not-found-cta')).toBeVisible();
    await expect(page.getByTestId('buy-submit-button')).toHaveCount(0);
  });
});
