import { walletApiUrl } from "@/services/wallet.service";

export type RichMarketListingDto = {
  id: string;
  releaseId: string;
  releaseSlug: string;
  symbol: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  genre: string;
  unitsAvailable: string;
  unitsTotal: string;
  pricePerUnit: string;
  listingValueUsdt: string;
  seller: { id: string; email: string };
  spread: string;
  spreadPct: string;
  liquidity: "high" | "med" | "low";
  liquidityLabel: string;
  volume24hUsdt: string;
  change7dPct: string;
  payoutSparkline: string[];
  range7dLow: string;
  range7dHigh: string;
  bestBid: string | null;
  bestAsk: string | null;
  deals7d: number;
  status: string;
  statusLabel: string;
  canBuy: boolean;
  canCancel: boolean;
  analyticsCatalogId: string;
  listingNote: string;
  featured: boolean;
  createdAt: string;
};

export type RichMarketTradeDto = {
  id: string;
  releaseId: string;
  releaseSlug: string;
  title: string;
  artist: string;
  ticker: string;
  genre: string;
  coverUrl: string | null;
  side: "buy" | "sell";
  units: string;
  price: string;
  grossAmount: string;
  feeAmount: string;
  netAmount: string;
  settlementStatus: "settled" | "processing" | "failed";
  settlementLabel: string;
  linkedOrderId: string | null;
  linkedListingId: string | null;
  executedAt: string;
};

export type RichUserMarketOrderDto = {
  id: string;
  listingId: string;
  releaseId: string;
  releaseSlug: string;
  symbol: string;
  title: string;
  artist: string;
  side: "buy" | "sell";
  mode: "limit" | "market";
  pricePerUnit: string | null;
  unitsTotal: string;
  unitsFilled: string;
  orderValueUsdt: string;
  status: string;
  statusLabel: string;
  canCancel: boolean;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserHoldingItem = {
  releaseId: string;
  trackTitle: string;
  symbol: string;
  unitsTotal: string;
  unitsAvailable: string;
  unitsLocked: string;
  avgEntryPrice: string;
};

export type ListingDetailDto = {
  listing: RichMarketListingDto;
  release: {
    id: string;
    slug: string;
    symbol: string;
    title: string;
    coverUrl: string | null;
    genre: string;
    description: string | null;
    status: string;
  };
  seller: { id: string; displayName: string };
  permissions: { canBuy: boolean; canCancel: boolean };
  recentTrades: Array<{
    id: string;
    side: "buy" | "sell";
    price: string;
    units: string;
    grossAmount: string;
    executedAt: string;
    settlementStatus: string;
  }>;
  relatedListings: RichMarketListingDto[];
  marketSummary: {
    volume24hUsdt: string;
    change7dPct: string;
    spread: string;
    spreadPct: string;
    bestBid: string | null;
    bestAsk: string | null;
    liquidity: "high" | "med" | "low";
    liquidityLabel: string;
    deals7d: number;
    payoutSparkline: string[];
    range7dLow: string;
    range7dHigh: string;
    artist: string;
  };
};

export type MarketDepthDto = {
  releaseId: string;
  slug: string;
  symbol: string;
  title: string;
  artist: string;
  genre: string;
  coverUrl: string | null;
  bids: Array<{ price: string; units: string }>;
  asks: Array<{ price: string; units: string; listingId?: string }>;
  spread: string;
  spreadPct: string;
  bestBid: string | null;
  bestAsk: string | null;
  bidDepthUnits: string;
  askDepthUnits: string;
  volume24hUsdt: string;
  volume24hUnits: string;
  change7dPct: string;
  change24hPct?: string;
  liquidity: "high" | "med" | "low";
  rightsListed: string;
  activeListingsCount?: number;
  recentTradesCount?: number;
  priceSparkline: number[];
  lastPrice?: string;
  high24h: string;
  low24h: string;
  availableUsdt: string;
  lockedUsdt?: string;
  availableUnits: string;
  unitsTotal?: string;
  unitsLocked?: string;
  avgEntryPrice: string;
  recentTrades: Array<{
    id: string;
    time: string;
    side: "buy" | "sell";
    price: string;
    units: string;
  }>;
  asksAggregated?: Array<{
    price: string;
    units: string;
    cumulativeUnits: string;
    cumulativeValueUsdt: string;
    depthPercent: string;
    orderCount: number;
    listingId?: string;
  }>;
  bidsAggregated?: Array<{
    price: string;
    units: string;
    cumulativeUnits: string;
    cumulativeValueUsdt: string;
    depthPercent: string;
    orderCount: number;
  }>;
  tickSize?: number;
  pair?: string;
  midPrice?: string;
  listings: RichMarketListingDto[];
  updatedAt: string;
};

export type MarketPricesDto = {
  releaseId: string;
  bucket: string;
  period: string;
  points: Array<{
    ts: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volumeUnits: string;
    volumeNotional: string;
  }>;
};

const PATHS = {
  listings: "/api/v1/market/listings",
  listingsMine: "/api/v1/market/listings/mine",
  ordersMine: "/api/v1/market/orders/mine",
  trades: "/api/v1/market/trades",
  holdings: "/api/v1/market/holdings",
  depth: "/api/v1/market/depth",
  orderPreview: "/api/v1/market/orders/preview",
  submitOrder: "/api/v1/market/orders",
  cancelOrder: (id: string) => `/api/v1/market/orders/${id}/cancel`,
  myOrders: "/api/v1/market/my-orders",
  recentTrades: "/api/v1/market/recent-trades",
  terminal: (marketId: string) => `/api/v1/market/terminal/${encodeURIComponent(marketId)}`,
  terminalUserState: (marketId: string) =>
    `/api/v1/market/terminal/${encodeURIComponent(marketId)}/user-state`,
  sparkline: "/api/v1/market/charts/sparkline",
  prices: "/api/v1/market/prices",
  feePreview: "/api/v1/market/fee-preview",
  watchlist: "/api/v1/market/watchlist",
  listing: (id: string) => `/api/v1/market/listings/${id}`,
  cancelListing: (id: string) => `/api/v1/market/listings/${id}/cancel`,
  buy: "/api/v1/market/trades",
  tradeReceipt: (id: string) => `/api/v1/market/trades/${id}/receipt`,
  watchlistItem: (id: string) => `/api/v1/market/watchlist/${id}`,
} as const;

export type BuyTradeResult = {
  tradeId: string;
  listingId: string;
  units: string;
  grossAmount: string;
  feeAmount: string;
  sellerNet: string;
  status: string;
};

export type FeePreviewDto = {
  units: string;
  pricePerUnit: string;
  grossAmount: string;
  feeAmount: string;
  feePct: string;
  buyerTotal: string;
  sellerNet: string;
  roundingNote: string;
};

export type WatchlistItemDto = {
  id: string;
  releaseId: string;
  releaseUuid: string;
  bookMarketId: string | null;
  symbol: string;
  track: string;
  artist: string;
  pricePerUnit: number;
  change24hPct: number;
  listingsCount: number;
  unitsInBook: number;
  deals24h: number;
  liquidity: "high" | "med" | "low";
  spark: number[];
};

import { formatApiError } from "@/lib/i18n/format-api-error";
import {
  buildMarketListingsQueryParams,
  type MarketListingsQuery,
  type MarketListingsResponse,
} from "@/lib/secondary-market/market-listings-query";

type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
    const err = new Error(body.message ?? res.statusText) as Error & { code?: string; status?: number };
    err.code = body.code;
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export function marketErrorMessage(err: unknown): string {
  return formatApiError(err);
}

export async function fetchMarketListings(
  authorizedFetch: AuthorizedFetch,
  query: MarketListingsQuery = {},
): Promise<MarketListingsResponse & { items: RichMarketListingDto[] }> {
  const params = buildMarketListingsQueryParams({
    page: 1,
    limit: 100,
    status: "purchasable",
    sort: "availability",
    ...query,
  });
  const res = await authorizedFetch(
    `${walletApiUrl(PATHS.listings)}?${params.toString()}`,
  );
  return parseJson(res);
}

export async function fetchMyListings(
  authorizedFetch: AuthorizedFetch,
): Promise<{ items: RichMarketListingDto[] }> {
  const res = await authorizedFetch(walletApiUrl(PATHS.listingsMine));
  return parseJson(res);
}

export async function fetchMyOrders(
  authorizedFetch: AuthorizedFetch,
  opts?: { releaseId?: string; page?: number; pageSize?: number },
): Promise<{ items: RichUserMarketOrderDto[] }> {
  const q = new URLSearchParams();
  if (opts?.releaseId) q.set("releaseId", opts.releaseId);
  if (opts?.page) q.set("page", String(opts.page));
  if (opts?.pageSize) q.set("pageSize", String(opts.pageSize));
  const suffix = q.size > 0 ? `?${q.toString()}` : "";
  const res = await authorizedFetch(walletApiUrl(`${PATHS.ordersMine}${suffix}`));
  return parseJson(res);
}

export async function fetchMarketTrades(
  authorizedFetch: AuthorizedFetch,
): Promise<{ items: RichMarketTradeDto[] }> {
  const res = await authorizedFetch(walletApiUrl(PATHS.trades));
  return parseJson(res);
}

export async function fetchUserHoldings(
  authorizedFetch: AuthorizedFetch,
): Promise<{ items: UserHoldingItem[] }> {
  const res = await authorizedFetch(walletApiUrl(PATHS.holdings));
  return parseJson(res);
}

export async function createListing(
  authorizedFetch: AuthorizedFetch,
  body: { releaseId: string; units: number; pricePerUnit: number },
): Promise<RichMarketListingDto> {
  const res = await authorizedFetch(walletApiUrl(PATHS.listings), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function cancelListing(
  authorizedFetch: AuthorizedFetch,
  listingId: string,
): Promise<void> {
  const res = await authorizedFetch(walletApiUrl(PATHS.cancelListing(listingId)), {
    method: "POST",
  });
  await parseJson(res);
}

export async function buyListing(
  authorizedFetch: AuthorizedFetch,
  listingId: string,
): Promise<BuyTradeResult> {
  const res = await authorizedFetch(walletApiUrl(PATHS.buy), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId }),
  });
  return parseJson(res);
}

export async function fetchFeePreview(
  authorizedFetch: AuthorizedFetch,
  params: { listingId?: string; releaseId?: string; units?: number; pricePerUnit?: number },
): Promise<FeePreviewDto> {
  const q = new URLSearchParams();
  if (params.listingId) q.set("listingId", params.listingId);
  if (params.releaseId) q.set("releaseId", params.releaseId);
  if (params.units != null) q.set("units", String(params.units));
  if (params.pricePerUnit != null) q.set("pricePerUnit", String(params.pricePerUnit));
  const res = await authorizedFetch(`${walletApiUrl(PATHS.feePreview)}?${q.toString()}`);
  return parseJson(res);
}

export async function fetchWatchlist(authorizedFetch: AuthorizedFetch): Promise<{ items: WatchlistItemDto[] }> {
  const res = await authorizedFetch(walletApiUrl(PATHS.watchlist));
  return parseJson(res);
}

export async function addWatchlistItem(
  authorizedFetch: AuthorizedFetch,
  releaseId: string,
): Promise<{ id: string; releaseId: string; alreadyExists: boolean }> {
  const res = await authorizedFetch(walletApiUrl(PATHS.watchlist), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ releaseId }),
  });
  return parseJson(res);
}

export async function removeWatchlistItem(authorizedFetch: AuthorizedFetch, id: string): Promise<void> {
  const res = await authorizedFetch(walletApiUrl(PATHS.watchlistItem(id)), { method: "DELETE" });
  await parseJson(res);
}

export async function downloadTradeReceipt(
  authorizedFetch: AuthorizedFetch,
  tradeId: string,
): Promise<{ filename: string; mimeType: string; contentBase64: string }> {
  const res = await authorizedFetch(walletApiUrl(PATHS.tradeReceipt(tradeId)), { method: "GET" });
  if (res.ok) return parseJson(res);
  const gen = await authorizedFetch(walletApiUrl(PATHS.tradeReceipt(tradeId)), { method: "POST" });
  return parseJson(gen);
}

export async function fetchListingDetail(
  authorizedFetch: AuthorizedFetch,
  listingId: string,
): Promise<ListingDetailDto> {
  const res = await authorizedFetch(walletApiUrl(PATHS.listing(listingId)));
  return parseJson(res);
}

export type MarketOrderPreviewDto = {
  canSubmit: boolean;
  blockingReason: string | null;
  subtotal: string;
  feeRate: string;
  feeAmount: string;
  totalAmount: string;
  estimatedAveragePrice: string | null;
  estimatedSlippage: string | null;
  walletBalance: string;
  availableUnits: string;
  lockedUnits: string;
  bestBid: string | null;
  bestAsk: string | null;
  crossesMarket: boolean;
  executionMode: "MAKER" | "TAKER" | "PARTIAL" | "BLOCKED";
  listingId?: string | null;
  releaseId: string;
};

export async function fetchOrderPreview(
  authorizedFetch: AuthorizedFetch,
  body: {
    marketId: string;
    side: "buy" | "sell";
    type: "limit" | "market";
    price?: number;
    units?: number;
    tickSize?: number;
  },
): Promise<MarketOrderPreviewDto> {
  const res = await authorizedFetch(walletApiUrl(PATHS.orderPreview), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      marketId: body.marketId,
      side: body.side.toUpperCase(),
      type: body.type.toUpperCase(),
      price: body.price,
      units: body.units,
      tickSize: body.tickSize,
    }),
  });
  return parseJson(res);
}

export async function submitMarketOrder(
  authorizedFetch: AuthorizedFetch,
  body: {
    marketId: string;
    side: "buy" | "sell";
    type: "limit" | "market";
    price?: number;
    units?: number;
    idempotencyKey?: string;
  },
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (body.idempotencyKey) headers["Idempotency-Key"] = body.idempotencyKey;
  const res = await authorizedFetch(walletApiUrl(PATHS.submitOrder), {
    method: "POST",
    headers,
    body: JSON.stringify({
      marketId: body.marketId,
      side: body.side.toUpperCase(),
      type: body.type.toUpperCase(),
      price: body.price,
      units: body.units,
      idempotencyKey: body.idempotencyKey,
    }),
  });
  return parseJson(res);
}

export async function cancelMarketOrder(authorizedFetch: AuthorizedFetch, orderId: string) {
  const res = await authorizedFetch(walletApiUrl(PATHS.cancelOrder(orderId)), {
    method: "POST",
  });
  return parseJson(res);
}

export async function fetchMarketDepth(
  authorizedFetch: AuthorizedFetch,
  params: { releaseId?: string; slug?: string; symbol?: string; marketId?: string; tickSize?: number },
): Promise<MarketDepthDto> {
  const q = new URLSearchParams();
  if (params.releaseId) q.set("releaseId", params.releaseId);
  if (params.slug) q.set("slug", params.slug);
  if (params.symbol) q.set("symbol", params.symbol);
  if (params.marketId) q.set("marketId", params.marketId);
  if (params.tickSize != null) q.set("tickSize", String(params.tickSize));
  const res = await authorizedFetch(`${walletApiUrl(PATHS.depth)}?${q.toString()}`);
  return parseJson(res);
}

export async function fetchMarketPrices(
  authorizedFetch: AuthorizedFetch,
  params: {
    releaseId?: string;
    slug?: string;
    symbol?: string;
    bucket?: string;
    period?: string;
  },
): Promise<MarketPricesDto> {
  const q = new URLSearchParams();
  if (params.releaseId) q.set("releaseId", params.releaseId);
  if (params.slug) q.set("slug", params.slug);
  if (params.symbol) q.set("symbol", params.symbol);
  if (params.bucket) q.set("bucket", params.bucket);
  if (params.period) q.set("period", params.period);
  const res = await authorizedFetch(`${walletApiUrl(PATHS.prices)}?${q.toString()}`);
  return parseJson(res);
}
