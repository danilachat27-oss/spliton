import type { APIRequestContext } from '@playwright/test';

/** Fallback mock catalog id when CATALOG_DATA_SOURCE=mock. */
export const MOCK_CATALOG_RELEASE_ID = '1';

export function apiBaseUrl(): string {
  return (
    process.env.PLAYWRIGHT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:4001'
  ).replace(/\/+$/, '');
}

/** Resolve a release id for buy smoke: env → catalog API (purchasable) → null. */
export async function resolvePlaywrightBuyReleaseId(
  request: APIRequestContext,
): Promise<string | null> {
  const fromEnv = process.env.PLAYWRIGHT_BUY_RELEASE_ID?.trim();
  if (fromEnv) return fromEnv;

  try {
    const query =
      'page=1&pageSize=10&status=open&roundStatus=live&availableOnly=true&sort=available_units';
    const res = await request.get(`${apiBaseUrl()}/api/v1/catalog/releases?${query}`);
    if (!res.ok()) return null;
    const data = (await res.json()) as {
      items?: Array<{
        id?: string;
        purchaseState?: string;
        availableUnits?: string;
      }>;
    };
    const items = data.items ?? [];
    const purchasable = items.find(
      (item) => item.id && item.purchaseState === 'available',
    );
    if (purchasable?.id) return purchasable.id;

    // Fallback: any release (buy page may show closed-round state — callers should skip).
    return items[0]?.id ?? null;
  } catch {
    return null;
  }
}

export function loginNextParam(path: string): string {
  return `next=${encodeURIComponent(path)}`;
}
