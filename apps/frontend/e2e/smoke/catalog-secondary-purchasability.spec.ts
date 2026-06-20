import { test, expect, type Page } from '@playwright/test';

import { mockInvestorSession } from '../helpers/mock-investor-session';
import { stubCatalogPurchasabilityApi } from '../helpers/stub-catalog-purchasability-api';

type CatalogFixtures = {
  openTitle: string;
  soldTitle: string;
  searchTerm: string;
  suggestionPattern: RegExp;
};

async function resolveCatalogFixtures(page: Page): Promise<CatalogFixtures> {
  await page.goto('/catalog');
  const stubLink = page.getByRole('link', { name: /E2E Open Release/i }).first();
  const mockHeading = page.getByRole('heading', { name: 'Midnight Code', exact: true });
  await expect(stubLink.or(mockHeading)).toBeVisible({ timeout: 30_000 });

  if (await stubLink.isVisible()) {
    return {
      openTitle: 'E2E Open Release',
      soldTitle: 'E2E Sold Release',
      searchTerm: 'sold',
      suggestionPattern: /E2E Sold Release/i,
    };
  }

  return {
    openTitle: 'Midnight Code',
    soldTitle: 'Glass Echo',
    searchTerm: 'Glass',
    suggestionPattern: /Glass Echo/i,
  };
}

test.describe('Catalog purchasability smoke', () => {
  test.beforeEach(async ({ page }) => {
    await stubCatalogPurchasabilityApi(page);
    await mockInvestorSession(page, { mockFinancialApis: false });
  });

  test('sold-out funding card has no primary buy CTA', async ({ page }) => {
    const fixtures = await resolveCatalogFixtures(page);
    const soldOutRow = page.getByRole('link', { name: new RegExp(fixtures.soldTitle, 'i') }).first();
    await expect(soldOutRow).toBeVisible({ timeout: 30_000 });
    await expect(soldOutRow).toHaveAttribute('href', /\/analytics\/releases\//);
    await expect(soldOutRow).not.toHaveAttribute('href', /\/catalog\/buy\//);
  });

  test('available funding card exposes buy CTA', async ({ page }) => {
    const fixtures = await resolveCatalogFixtures(page);
    const buyRow = page.getByRole('link', { name: new RegExp(fixtures.openTitle, 'i') }).first();
    await expect(buyRow).toBeVisible({ timeout: 30_000 });
    await expect(buyRow).toHaveAttribute('href', /\/catalog\/buy\//);
  });

  test('non-purchasable search suggestion routes to release detail, not buy', async ({ page }) => {
    const fixtures = await resolveCatalogFixtures(page);
    const search = page.getByRole('searchbox').first();
    await search.fill(fixtures.searchTerm);
    await page.getByRole('button', { name: fixtures.suggestionPattern }).click();

    await expect(page).toHaveURL(/\/catalog\/market-overview\/analytics\/|\/analytics\/releases\//);
    await expect(page).not.toHaveURL(/\/catalog\/buy\//);
  });

  test('grid cards expose data-purchase-state for open and sold-out releases', async ({ page }) => {
    const fixtures = await resolveCatalogFixtures(page);
    await page.getByRole('button', { name: /сетка|grid/i }).click();
    await expect(
      page.locator('[data-purchase-state="available"]').filter({ hasText: fixtures.openTitle }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator('[data-purchase-state="sold_out"]').filter({ hasText: fixtures.soldTitle }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Secondary market purchasability smoke (mock wallet)', () => {
  test.beforeEach(async ({ page }) => {
    await mockInvestorSession(page);
    await page.goto('/dashboard/secondary-market');
    await expect(page).toHaveURL(/\/dashboard\/secondary-market/, { timeout: 30_000 });
  });

  test('terminal listing rows disable buy for sold_out mock lot', async ({ page }) => {
    await page.getByTestId('secondary-market-filters-open').click();
    await page.getByRole('button', { name: /продано|sold out/i }).click();
    await page.getByRole('button', { name: /применить|apply/i }).click();

    const buyButtons = page.getByRole('button', { name: /купить лот|buy lot|buy/i });
    const count = await buyButtons.count();
    for (let i = 0; i < count; i += 1) {
      await expect(buyButtons.nth(i)).toBeDisabled();
    }
  });

  test('purchasable filter + search reset restores default list', async ({ page }) => {
    const search = page.getByRole('searchbox').first();
    await search.fill('MNR');
    await page.getByRole('button', { name: /сбросить фильтры|reset filters/i }).click();
    await expect(search).toHaveValue('');
    await expect(page.getByText(/нет лотов по фильтрам|no lots match filters/i)).toHaveCount(0);
  });

  test('active/purchasable filter hides cancelled mock listing', async ({ page }) => {
    await page.getByTestId('secondary-market-filters-open').click();
    await page.getByRole('button', { name: /к покупке|purchasable|comprables/i }).click();
    await page.getByRole('button', { name: /применить|apply/i }).click();
    await expect(page.getByText(/lst-cld|cancelled|отмен/i)).toHaveCount(0);
  });
});