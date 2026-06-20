import {
  getPublicApiBaseUrl,
  getWalletDataSource as getWalletDataSourceFromEnv,
  type DataSourceMode,
} from "@/lib/public-env";
import { formatApiError } from "@/lib/i18n/format-api-error";

export type WalletDataSource = DataSourceMode;

export function getWalletDataSource(): WalletDataSource {
  return getWalletDataSourceFromEnv();
}

export const WALLET_API_PATHS = {
  wallet: "/api/v1/wallet",
  balance: "/api/v1/wallet/balance",
  transactions: "/api/v1/wallet/transactions",
  activity: "/api/v1/wallet/activity",
  depositAddress: "/api/v1/wallet/deposit-address",
  depositInfo: "/api/v1/wallet/deposit-info",
  deposits: "/api/v1/wallet/deposits",
  deposit: (id: string) => `/api/v1/wallet/deposits/${id}`,
  withdrawals: "/api/v1/wallet/withdrawals",
  withdrawal: (id: string) => `/api/v1/wallet/withdrawals/${id}`,
  orders: "/api/v1/orders",
  order: (id: string) => `/api/v1/orders/${id}`,
  marketListings: "/api/v1/market/listings",
  marketListing: (id: string) => `/api/v1/market/listings/${id}`,
  marketListingsMine: "/api/v1/market/listings/mine",
  marketTrades: "/api/v1/market/trades",
  marketTrade: (id: string) => `/api/v1/market/trades/${id}`,
  marketHoldings: "/api/v1/market/holdings",
  primaryRound: (releaseId: string) => `/api/v1/orders/primary-round/${releaseId}`,
  primaryPreview: "/api/v1/orders/primary-preview",
  orderReceipt: (id: string) => `/api/v1/orders/${id}/receipt`,
} as const;

export type PrimaryOrderPreview = {
  roundId: string;
  releaseId: string | null;
  releaseTitle: string | null;
  artist: string | null;
  symbol: string | null;
  units: string;
  pricePerUnit: string;
  grossAmount: string;
  feeAmount: string;
  feePct: string;
  totalPaid: string;
  walletBalance: string;
  balanceAfter: string;
  availableUnits: string;
  minPurchaseUnits: string | null;
  maxPurchaseUnits: string | null;
  canPurchase: boolean;
  blockingReason: string | null;
  roundingNote: string;
};

export type PrimaryRoundInfo = {
  roundId: string;
  releaseId: string;
  trackTitle: string;
  status: string;
  availableUnits: string;
  pricePerUnit: string;
  primaryPurchaseFeePct: string;
};

export type PrimaryOrderResult = {
  orderId: string;
  releaseId: string;
  roundId: string;
  units: string;
  grossAmount: string;
  feeAmount: string;
  netAmount: string;
  pricePerUnit: string;
  status: string;
};

export type MarketListingItem = {
  id: string;
  releaseId: string;
  trackTitle: string;
  sellerUserId: string;
  pricePerUnit: string;
  unitsTotal: string;
  unitsAvailable: string;
  status: string;
  createdAt: string;
};

export type MarketTradeItem = {
  id: string;
  releaseId: string;
  trackTitle: string;
  role: string;
  units: string;
  price: string;
  grossAmount: string;
  feeAmount: string;
  status: string;
  executedAt: string;
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

export function walletApiUrl(path: string): string {
  return `${getPublicApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export type WalletSummary = {
  walletId: string;
  availableBalance: string;
  lockedBalance: string;
  pendingBalance: string;
  earnedTotal: string;
  withdrawnTotal: string;
  totalDeposits: string;
  pendingWithdrawalsCount: number;
  asset: string;
  network: string;
  updatedAt: string;
};

export type WalletTransactionItem = {
  id: string;
  type: string;
  direction: string;
  amount: string;
  fee: string;
  netAmount: string;
  status: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type WalletActivityRelatedEntity = {
  type: string;
  id: string;
  releaseId: string | null;
  releaseTitle: string | null;
};

export type WalletActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  amount: string;
  amountSigned: string;
  asset: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  direction: "in" | "out";
  userFacingLabel: string;
  referenceId: string;
  relatedEntity: WalletActivityRelatedEntity | null;
  feeAmount: string | null;
  units: string | null;
};

export type WalletActivityQuery = {
  type?: string;
  kind?: string;
  status?: string;
  period?: string;
  from?: string;
  to?: string;
  direction?: string;
  asset?: string;
  releaseId?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
  sort?: string;
  q?: string;
};

export type WalletActivityList = {
  items: WalletActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type DepositAddressResponse = {
  walletId: string;
  asset: string;
  network: string;
  address: string;
  warnings: string[];
  isDevPlaceholder: boolean;
};

export type DepositInfoResponse = {
  asset: string;
  network: string;
  chain: string;
  address: string;
  qrPayload: string;
  qrDataUrl: string;
  tokenContractAddress: string | null;
  tokenDecimals: number;
  minDepositAmount: string;
  minConfirmations: number;
  estimatedCreditTimeMinutes: number;
  estimatedCreditTimeLabel: string;
  withdrawAvailableAfterMinutes: number;
  withdrawAvailableAfterLabel: string;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
  explorerAddressUrl: string | null;
  explorerTokenUrl: string | null;
  userWarnings: string[];
  maintenanceMessage: string | null;
  providerStatus: "healthy" | "degraded" | "disabled" | "misconfigured";
  addressStatus: string;
  walletId: string;
  isDevPlaceholder: boolean;
  updatedAt: string;
};

export type UserDepositItem = {
  id: string;
  amount: string;
  status: string;
  confirmations: number;
  requiredConfirmations: number;
  txHash: string | null;
  createdAt: string;
  receivedAt: string;
};

export type UserWithdrawalItem = {
  id: string;
  amountUsdt: string;
  feeUsdt: string;
  netAmountUsdt: string;
  toAddress: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
  blockchainTxid: string | null;
};

export type CreateWithdrawalPayload = {
  amount: string;
  toAddress: string;
};

export class WalletApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "WalletApiError";
  }
}

async function parseWalletError(res: Response): Promise<WalletApiError> {
  try {
    const body = (await res.json()) as {
      error?: { code?: string; message?: string };
      code?: string;
      message?: string | string[];
    };
    const code = body.error?.code ?? body.code;
    const rawMessage = body.error?.message ?? body.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : typeof rawMessage === "string"
        ? rawMessage
        : res.statusText;
    return new WalletApiError(message, code, res.status);
  } catch {
    return new WalletApiError(res.statusText, undefined, res.status);
  }
}

async function walletGet<T>(
  path: string,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<T> {
  const res = await authorizedFetch(walletApiUrl(path));
  if (!res.ok) throw await parseWalletError(res);
  return res.json() as Promise<T>;
}

export async function fetchWalletSummary(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<WalletSummary> {
  return walletGet(WALLET_API_PATHS.wallet, authorizedFetch);
}

export async function fetchWalletBalance(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
) {
  return walletGet<Pick<WalletSummary, "walletId" | "availableBalance" | "lockedBalance" | "pendingBalance" | "asset" | "network" | "updatedAt">>(
    WALLET_API_PATHS.balance,
    authorizedFetch,
  );
}

export async function listWalletTransactions(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
  page = 1,
): Promise<{ items: WalletTransactionItem[] }> {
  const res = await authorizedFetch(walletApiUrl(`${WALLET_API_PATHS.transactions}?page=${page}`));
  if (!res.ok) throw await parseWalletError(res);
  return res.json() as Promise<{ items: WalletTransactionItem[] }>;
}

function buildActivityQuery(query: WalletActivityQuery): string {
  const params = new URLSearchParams();
  if (query.type) params.set("type", query.type);
  if (query.kind) params.set("kind", query.kind);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.asset) params.set("asset", query.asset);
  if (query.releaseId) params.set("releaseId", query.releaseId);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchWalletActivity(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
  query: WalletActivityQuery = {},
): Promise<WalletActivityList> {
  const res = await authorizedFetch(
    walletApiUrl(`${WALLET_API_PATHS.activity}${buildActivityQuery(query)}`),
  );
  if (!res.ok) throw await parseWalletError(res);
  return res.json() as Promise<WalletActivityList>;
}

export async function fetchDepositAddress(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<DepositAddressResponse> {
  return walletGet(WALLET_API_PATHS.depositAddress, authorizedFetch);
}

export async function fetchDepositInfo(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
  query?: { asset?: string; network?: string; lang?: string },
): Promise<DepositInfoResponse> {
  const q = new URLSearchParams();
  if (query?.asset) q.set("asset", query.asset);
  if (query?.network) q.set("network", query.network);
  if (query?.lang) q.set("lang", query.lang);
  const suffix = q.size > 0 ? `?${q.toString()}` : "";
  return walletGet(`${WALLET_API_PATHS.depositInfo}${suffix}`, authorizedFetch);
}

export async function listUserDeposits(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<{ items: UserDepositItem[] }> {
  const res = await authorizedFetch(walletApiUrl(WALLET_API_PATHS.deposits));
  if (!res.ok) throw await parseWalletError(res);
  return res.json() as Promise<{ items: UserDepositItem[] }>;
}

export async function createUserWithdrawal(
  payload: CreateWithdrawalPayload,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<UserWithdrawalItem> {
  const res = await authorizedFetch(walletApiUrl(WALLET_API_PATHS.withdrawals), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseWalletError(res);
  return res.json() as Promise<UserWithdrawalItem>;
}

export async function listUserWithdrawals(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<UserWithdrawalItem[]> {
  const res = await authorizedFetch(walletApiUrl(WALLET_API_PATHS.withdrawals));
  if (!res.ok) throw await parseWalletError(res);
  const body = (await res.json()) as { items: UserWithdrawalItem[] };
  return body.items;
}

/** TRC20: T + 33 base58 chars */
export function isValidTrc20Address(address: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address.trim());
}

export const MIN_WITHDRAWAL_USDT = Number(process.env.NEXT_PUBLIC_MIN_WITHDRAWAL_USDT ?? 50);

function newIdempotencyKey(): string {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function fetchPrimaryRound(
  releaseId: string,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<PrimaryRoundInfo> {
  return walletGet(WALLET_API_PATHS.primaryRound(releaseId), authorizedFetch);
}

export async function fetchPrimaryOrderPreview(
  roundId: string,
  units: number,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<PrimaryOrderPreview> {
  const res = await authorizedFetch(walletApiUrl(WALLET_API_PATHS.primaryPreview), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roundId, units }),
  });
  if (!res.ok) throw await parseWalletError(res);
  return res.json() as Promise<PrimaryOrderPreview>;
}

export async function downloadPrimaryOrderReceipt(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
  orderId: string,
): Promise<{ filename: string; mimeType: string; contentBase64: string }> {
  let res = await authorizedFetch(walletApiUrl(WALLET_API_PATHS.orderReceipt(orderId)), {
    method: "GET",
  });
  if (res.status === 404 || res.status === 409) {
    res = await authorizedFetch(walletApiUrl(WALLET_API_PATHS.orderReceipt(orderId)), {
      method: "POST",
    });
  }
  if (!res.ok) throw await parseWalletError(res);
  return res.json() as Promise<{ filename: string; mimeType: string; contentBase64: string }>;
}

export async function createPrimaryOrder(
  roundId: string,
  units: number,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<PrimaryOrderResult> {
  const key = newIdempotencyKey();
  const res = await authorizedFetch(walletApiUrl(WALLET_API_PATHS.orders), {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify({ roundId, units, idempotencyKey: key }),
  });
  if (!res.ok) throw await parseWalletError(res);
  return res.json() as Promise<PrimaryOrderResult>;
}

export async function listMarketListings(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<{ items: MarketListingItem[] }> {
  const res = await authorizedFetch(walletApiUrl(WALLET_API_PATHS.marketListings));
  if (!res.ok) throw await parseWalletError(res);
  return res.json() as Promise<{ items: MarketListingItem[] }>;
}

export async function listMyMarketListings(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<{ items: MarketListingItem[] }> {
  const res = await authorizedFetch(walletApiUrl(WALLET_API_PATHS.marketListingsMine));
  if (!res.ok) throw await parseWalletError(res);
  return res.json() as Promise<{ items: MarketListingItem[] }>;
}

export async function listMarketTrades(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<{ items: MarketTradeItem[] }> {
  const res = await authorizedFetch(walletApiUrl(WALLET_API_PATHS.marketTrades));
  if (!res.ok) throw await parseWalletError(res);
  return res.json() as Promise<{ items: MarketTradeItem[] }>;
}

export async function listUserHoldings(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<{ items: UserHoldingItem[] }> {
  return walletGet(WALLET_API_PATHS.marketHoldings, authorizedFetch);
}

export async function createMarketListing(
  body: { releaseId: string; units: number; pricePerUnit: number },
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<MarketListingItem> {
  const res = await authorizedFetch(walletApiUrl(WALLET_API_PATHS.marketListings), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await parseWalletError(res);
  return res.json() as Promise<MarketListingItem>;
}

export async function cancelMarketListing(
  listingId: string,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<void> {
  const res = await authorizedFetch(walletApiUrl(`${WALLET_API_PATHS.marketListing(listingId)}/cancel`), {
    method: "POST",
  });
  if (!res.ok) throw await parseWalletError(res);
}

export async function buyMarketListing(
  listingId: string,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
) {
  const res = await authorizedFetch(walletApiUrl(WALLET_API_PATHS.marketTrades), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId }),
  });
  if (!res.ok) throw await parseWalletError(res);
  return res.json();
}

export function walletErrorMessage(err: unknown): string {
  if (err instanceof WalletApiError) {
    return formatApiError(err);
  }
  return formatApiError(err);
}
