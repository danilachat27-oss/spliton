/**
 * In-memory cache + in-flight dedup for header wallet balance (GET /api/v1/wallet/balance).
 * Does not affect full wallet summary fetches.
 */

const TTL_MS = 45_000;

export type CachedWalletBalance = {
  availableBalance: string;
  updatedAt?: string;
};

type CacheEntry = {
  data: CachedWalletBalance;
  expiresAt: number;
};

let cache: CacheEntry | null = null;
let inFlight: Promise<CachedWalletBalance> | null = null;

export function invalidateWalletBalanceCache(): void {
  cache = null;
  inFlight = null;
}

export async function fetchWalletBalanceCached(
  fetcher: () => Promise<CachedWalletBalance>,
): Promise<CachedWalletBalance> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.data;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = fetcher()
    .then((data) => {
      cache = { data, expiresAt: Date.now() + TTL_MS };
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
