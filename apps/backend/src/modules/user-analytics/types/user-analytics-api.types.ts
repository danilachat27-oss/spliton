export type UserAnalyticsRowStatus = 'Active' | 'Paused' | 'Closed';
export type UserAnalyticsTrend = 'up' | 'down' | 'flat';

export type UserAnalyticsListItemDto = {
  id: string;
  slug: string;
  symbol: string;
  release: string;
  artist: string;
  genre: string;
  yieldPct: string;
  changePct: string;
  payouts: string;
  units: string;
  status: UserAnalyticsRowStatus;
  trend: UserAnalyticsTrend;
  sparkline: number[];
  payoutBand: { lo: string; hi: string; t: number };
  soldUnits?: string;
  availableUnits?: string;
  pricePerUnitUsdt?: string;
  raisedUsdt?: string;
  targetUsdt?: string;
  progressPercent?: number;
  holdersCount?: number;
  secondaryListingsCount?: number;
  secondaryVolumeUsdt?: string;
  liquidityPercent?: number;
  lastTradePrice?: string | null;
  updatedAt?: string;
  userUnits?: string;
  userValueUsdt?: string;
  userPnlUsdt?: string;
  userPnlPct?: string;
};

export type UserAnalyticsListDto = {
  items: UserAnalyticsListItemDto[];
  stats: {
    avgYieldPct: string | null;
    activeCount: number | null;
    payoutsTotalUsdt: string | null;
  };
};

export type UserAnalyticsReleaseMetaDto = {
  id: string;
  slug: string;
  symbol: string;
  title: string;
  artist: string;
  genre: string | null;
  coverUrl: string | null;
  description: string | null;
  shortDescription: string | null;
  status: UserAnalyticsRowStatus;
  statusLabel: string;
  payoutFrequency: string;
  primaryUnitPrice: string;
  totalUnits: string;
  unitsAvailablePrimary: string;
  soldUnits: string;
  raiseTargetUsdt: string | null;
  hardCapUsdt: string | null;
  raisedAmountUsdt: string | null;
  fillProgressPct: string | null;
  holderSharePct: string | null;
  artistSharePct: string | null;
  platformSharePct: string | null;
  promoBudgetUsdt: string | null;
  artistUpfrontUsdt: string | null;
  platformUpfrontUsdt: string | null;
  minPurchaseUnits: string | null;
  maxPurchaseUnits: string | null;
  videoUrl: string | null;
  videoPosterUrl: string | null;
  videoType: string;
  videoStatus: string;
  riskDisclosureText: string | null;
  legalDisclaimer: string | null;
  secondaryEnabled: boolean;
  releaseDate: string | null;
  updatedAt: string;
};

export type UserAnalyticsHoldingDto = {
  unitsTotal: string;
  unitsAvailable: string;
  unitsLocked: string;
  avgEntryPrice: string;
  currentPrice: string;
  marketValueUsdt: string;
  costBasisUsdt: string;
  pnlUnrealizedUsdt: string;
  pnlPct: string;
  portfolioSharePct: string;
};

export type UserAnalyticsDetailDto = {
  release: UserAnalyticsReleaseMetaDto;
  holding: UserAnalyticsHoldingDto | null;
  expectedYieldPct: string | null;
  riskLabel: string;
  faq: { question: string; answer: string; order: number; locale: string; category: string | null }[];
  payoutSummary: {
    payouts30d: string;
    payoutsAllTime: string;
    lastPayoutDate: string | null;
  };
  walletCta: { available: boolean; href: string; reason: string | null };
};

export type UserAnalyticsPerformanceDto = {
  period: string;
  seriesByPeriod: Record<string, number[]>;
  miniStats: { label: string; value: string }[];
  priceHistory: { ts: string; close: string }[];
};

export type UserAnalyticsPayoutPeriodDto = {
  period: string;
  gross: string;
  poolShare: string;
  distribution: string;
  perUnit: string;
  toHolders: string;
  status: string;
  paidAt: string | null;
};

export type UserAnalyticsPayoutsDto = {
  periods: UserAnalyticsPayoutPeriodDto[];
  userPayouts: {
    id: string;
    amountNet: string;
    status: string;
    unitsEligible: string;
    createdAt: string;
  }[];
  totalDistributedUsdt: string;
};

export type UserAnalyticsMarketDto = {
  bestBid: string | null;
  bestAsk: string | null;
  volume24hUsdt: string;
  change7dPct: string;
  deals7d: number;
  liquidity: string;
  activeListings: number;
  rows: { label: string; value: string }[];
};

export type UserAnalyticsLedgerEntryDto = {
  id: string;
  eventType: string;
  title: string;
  detail: string;
  happenedAt: string;
  unitsDelta: string;
  pricePerUnit: string | null;
  tone: 'buy' | 'sell' | 'order' | 'fill' | 'cancel' | 'payout' | 'other';
};

export type UserAnalyticsLedgerDto = {
  items: UserAnalyticsLedgerEntryDto[];
};
