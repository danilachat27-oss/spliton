import type { Page } from '@playwright/test';

const CATALOG_RELEASES = {
  items: [
    {
      id: 'e2e-sold',
      slug: 'e2e-sold',
      symbol: 'SLD',
      title: 'E2E Sold Release',
      artist: 'Test Artist',
      artists: [],
      genre: 'electronic',
      segment: 'funding',
      coverUrl: null,
      shortDescription: null,
      releaseStatus: 'SOLD_OUT',
      catalogStatus: 'sold_out',
      statusLabel: 'Sold out',
      riskLabel: 'Closed',
      roundStatus: 'completed',
      purchaseState: 'sold_out',
      payoutFreq: 'monthly',
      totalUnits: '1000',
      availableUnits: '0',
      primaryUnitPriceUsdt: '10',
      raiseTargetUsdt: '10000',
      hardCapUsdt: null,
      raisedUsdt: '10000',
      goalUsdt: '10000',
      progressPct: 100,
      expectedYieldPct: '8%',
      primaryPurchaseFeePct: '2',
      secondaryMarketEnabled: false,
      activeSecondaryListingsCount: 0,
      bestSecondaryAskPrice: null,
      lastTradePrice: null,
      volume24hUsdt: '0',
      volume7dUsdt: '0',
      liquidityScore: null,
      nextPayoutDate: null,
      cardKind: 'funding',
    },
    {
      id: 'e2e-open',
      slug: 'e2e-open',
      symbol: 'OPN',
      title: 'E2E Open Release',
      artist: 'Test Artist',
      artists: [],
      genre: 'electronic',
      segment: 'funding',
      coverUrl: null,
      shortDescription: null,
      releaseStatus: 'ACTIVE',
      catalogStatus: 'open',
      statusLabel: 'Open',
      riskLabel: 'Standard',
      roundStatus: 'live',
      purchaseState: 'available',
      payoutFreq: 'monthly',
      totalUnits: '1000',
      availableUnits: '500',
      primaryUnitPriceUsdt: '10',
      raiseTargetUsdt: '10000',
      hardCapUsdt: null,
      raisedUsdt: '5000',
      goalUsdt: '10000',
      progressPct: 50,
      expectedYieldPct: '9%',
      primaryPurchaseFeePct: '2',
      secondaryMarketEnabled: false,
      activeSecondaryListingsCount: 0,
      bestSecondaryAskPrice: null,
      lastTradePrice: null,
      volume24hUsdt: '100',
      volume7dUsdt: '500',
      liquidityScore: 0.5,
      nextPayoutDate: null,
      cardKind: 'funding',
    },
  ],
  pagination: { page: 1, pageSize: 24, total: 2, totalPages: 1, hasNextPage: false },
};

const CATALOG_STATS = {
  totalReleases: 2,
  activePrimaryRounds: 1,
  totalRaisedUsdt: '15000',
  averageYieldPct: 8.5,
};

const CATALOG_FILTERS = {
  genres: [{ name: 'electronic', count: 2 }],
};

/** Playwright-only catalog API stubs — does not affect live/staging/production. */
export async function stubCatalogPurchasabilityApi(page: Page): Promise<void> {
  const context = page.context();

  await context.route('**/health', async (route) => {
    await route.fulfill({ json: { status: 'ok' } });
  });

  await context.route('**/catalog/releases**', async (route) => {
    await route.fulfill({ json: CATALOG_RELEASES });
  });

  await context.route('**/catalog/stats**', async (route) => {
    await route.fulfill({ json: CATALOG_STATS });
  });

  await context.route('**/catalog/filters**', async (route) => {
    await route.fulfill({ json: CATALOG_FILTERS });
  });

  await context.route('**/catalog/genres**', async (route) => {
    await route.fulfill({ json: { items: ['electronic'] } });
  });

  await context.route('**/catalog/search/suggestions**', async (route) => {
    const url = new URL(route.request().url());
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const items =
      q.includes('sold') || q.includes('e2e-sold')
        ? [
            {
              type: 'release',
              label: 'E2E Sold Release',
              value: 'e2e-sold',
              releaseId: 'e2e-sold',
              slug: 'e2e-sold',
              purchaseState: 'sold_out',
              canPurchase: false,
            },
          ]
        : q.includes('open') || q.includes('e2e-open')
          ? [
              {
                type: 'release',
                label: 'E2E Open Release',
                value: 'e2e-open',
                releaseId: 'e2e-open',
                slug: 'e2e-open',
                purchaseState: 'available',
                canPurchase: true,
              },
            ]
          : [];
    await route.fulfill({ json: { items } });
  });

  await context.route('**/catalog/releases/e2e-sold**', async (route) => {
    await route.fulfill({
      json: {
        ...CATALOG_RELEASES.items[0],
        description: null,
        audioPreviewUrl: null,
        releaseDate: null,
        primaryRound: {
          roundId: null,
          status: 'completed',
          availableUnits: '0',
          pricePerUnit: '10',
          raiseTargetUsdt: '10000',
          hardCapUsdt: null,
          soldUnits: '1000',
          totalUnits: '1000',
          progressPct: 100,
          primaryPurchaseFeePct: '2',
        },
      },
    });
  });

  await context.route('**/catalog/releases/e2e-open**', async (route) => {
    await route.fulfill({
      json: {
        ...CATALOG_RELEASES.items[1],
        description: null,
        audioPreviewUrl: null,
        releaseDate: null,
        primaryRound: {
          roundId: 'e2e-round-open',
          status: 'live',
          availableUnits: '500',
          pricePerUnit: '10',
          raiseTargetUsdt: '10000',
          hardCapUsdt: null,
          soldUnits: '500',
          totalUnits: '1000',
          progressPct: 50,
          primaryPurchaseFeePct: '2',
        },
      },
    });
  });
}
