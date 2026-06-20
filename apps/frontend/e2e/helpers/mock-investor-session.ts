import type { Page } from '@playwright/test';

import { SPLITON_SESSION_COOKIE } from '../../lib/auth/session-cookie';

export function playwrightCookieDomain(): string {
  try {
    const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
    return new URL(base).hostname;
  } catch {
    return '127.0.0.1';
  }
}

export const E2E_INVESTOR_TOKEN = 'playwright-investor-token';

const investorUser = {
  id: 'playwright-investor-1',
  email: 'investor@example.com',
  displayName: 'Playwright Investor',
  roles: [] as string[],
  status: 'ACTIVE',
  emailVerifiedAt: new Date().toISOString(),
};

export type MockInvestorOptions = {
  email?: string;
  /** When true, mocks wallet/primary/market endpoints for UI smoke. */
  mockFinancialApis?: boolean;
};

export async function setSessionHintCookie(page: Page): Promise<void> {
  await page.context().addCookies([
    {
      name: SPLITON_SESSION_COOKIE,
      value: '1',
      domain: playwrightCookieDomain(),
      path: '/',
    },
  ]);
}

/** Sets mocks + cookie, then waits until client auth hydrates (Войти hidden). */
export async function bootstrapInvestorSession(
  page: Page,
  options?: MockInvestorOptions,
): Promise<void> {
  await mockInvestorSession(page, options);
  await page.goto('/app');
  await page.getByRole('link', { name: 'Войти' }).waitFor({ state: 'hidden', timeout: 25_000 });
}

export async function mockInvestorSession(
  page: Page,
  { email = 'investor@example.com', mockFinancialApis = true }: MockInvestorOptions = {},
): Promise<void> {
  const user = { ...investorUser, email };
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
        tokens: { accessToken: E2E_INVESTOR_TOKEN, refreshToken: 'playwright-investor-refresh' },
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

  if (!mockFinancialApis) return;

  await context.route('**/api/v1/wallet**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/deposit-info') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          address: 'TPlaywrightE2EDepositAddress01',
          minDepositAmount: '0.01',
          estimatedCreditTimeLabel: '~ 1 минута',
          withdrawAvailableAfterLabel: '~ 2 минуты',
          tokenContractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
          providerStatus: 'ok',
          isDevPlaceholder: false,
        }),
      });
      return;
    }

    if (url.match(/\/api\/v1\/wallet\/?(\?|$)/) && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          balanceUsdt: '120.50',
          availableUsdt: '100.00',
          lockedUsdt: '20.50',
          currency: 'USDT',
        }),
      });
      return;
    }

    if (url.includes('/activity') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20 }),
      });
      return;
    }

    if (url.includes('/withdrawals') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (url.includes('/withdrawals') && method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'wd-e2e-1',
          amount: '50',
          feeAmount: '1',
          status: 'PENDING',
          toAddress: 'TPlaywrightWithdrawAddress01',
          createdAt: new Date().toISOString(),
        }),
      });
      return;
    }

    await route.continue();
  });

  await context.route('**/api/v1/portfolio/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalValueUsdt: '0',
        positions: [],
        releasesCount: 0,
      }),
    });
  });

  await context.route('**/api/v1/market/listings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    });
  });

  await context.route('**/api/v1/market/trades**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    });
  });

  await context.route('**/api/v1/market/overview/stats**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
          updatedAt: new Date().toISOString(),
          period: '7d',
          totals: {
            publicReleases: 1,
            activePrimaryRounds: 1,
            activeSecondaryListings: 3,
            totalRaisedUsdt: '1000',
            totalVolumeUsdt: '500',
            totalVolume24hUsdt: '7777',
            totalVolume7dUsdt: '4000',
            totalVolume30dUsdt: '5000',
            averageExpectedYieldPct: 8,
            averageLiquidityScore: 50,
            tradesCount: 10,
            holdersCount: 20,
          },
          primaryMarket: {
            activeRounds: 1,
            raisedUsdt: '1000',
            availableUnits: '100',
            averageProgressPct: 50,
          },
          secondaryMarket: {
            activeListings: 3,
            volumeUsdt: '500',
            volume24hUsdt: '7777',
            volume7dUsdt: '4000',
            volume30dUsdt: '5000',
            tradesCount: 10,
            bestAskMin: '10',
            bestAskMax: '20',
            averageSpreadPct: 2,
          },
          distributions: {},
          topReleases: [],
        }),
    });
  });

  await context.route('**/api/v1/market/overview/charts**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        updatedAt: new Date().toISOString(),
        period: '30d',
        series: {
          volume: [],
          secondaryVolume: [
            { date: '2026-01-01', value: '100' },
            { date: '2026-01-02', value: '120' },
          ],
          tradesCount: [],
          activeListings: [],
          raised: [],
          avgYield: [],
          liquidity: [],
        },
      }),
    });
  });
}

export function mockPrimaryRoundRoutes(
  page: Page,
  releaseId: string,
  options?: { canPurchase?: boolean; blockingReason?: string },
): Promise<void> {
  const canPurchase = options?.canPurchase ?? false;
  const blockingReason = options?.blockingReason ?? 'INSUFFICIENT_BALANCE';
  const roundId = 'e2e-round-11111111-1111-4111-8111-111111111111';

  const context = page.context();
  return Promise.all([
    context.route(`**/api/v1/orders/primary-round/${encodeURIComponent(releaseId)}**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roundId,
          pricePerUnit: '10',
          availableUnits: '100',
          primaryPurchaseFeePct: '2',
        }),
      });
    }),
    context.route('**/api/v1/orders/primary-preview**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          canPurchase,
          blockingReason: canPurchase ? null : blockingReason,
          grossAmount: '10',
          feeAmount: '0.2',
          totalPaid: '10.2',
          walletBalance: '5',
        }),
      });
    }),
    context.route('**/api/v1/legal/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          allowed: true,
          missingConsents: { primaryPurchase: [], withdrawal: [], secondaryMarket: [] },
        }),
      });
    }),
  ]).then(() => undefined);
}
