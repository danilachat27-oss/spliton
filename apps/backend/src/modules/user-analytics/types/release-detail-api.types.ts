export type ReleaseFaqItemDto = {
  question: string;
  answer: string;
  order: number;
  locale: string;
  category: string | null;
  isPublished: boolean;
};

export type ReleaseDocumentSummaryDto = {
  id: string;
  title: string;
  type: string;
  visibility: string;
  locale: string;
  downloadable: boolean;
  downloadUrl: string | null;
  requiresAuth: boolean;
  requiresHolding: boolean;
  status: string;
};

export type ReleaseDetailPrimaryRoundDto = {
  unitPrice: string;
  totalUnits: string;
  soldUnits: string;
  availableUnits: string;
  fillProgress: string;
  raiseTarget: string | null;
  raisedAmount: string | null;
  hardCap: string | null;
  minPurchaseAmount: string | null;
  maxPurchaseAmount: string | null;
  closeAt: string | null;
  canBuyPrimary: boolean;
  primaryBlockingReason: string | null;
};

export type ReleaseDetailDealTermsDto = {
  distributionShare: string | null;
  artistShare: string | null;
  investorShare: string | null;
  platformFee: string | null;
  promoBudget: string | null;
  artistUpfront: string | null;
  platformUpfront: string | null;
  payoutFrequency: string;
  payoutCurrency: string;
  payoutNetwork: string;
  rightsTransferAllowed: boolean;
  secondaryEnabled: boolean;
  riskDisclosureText: string | null;
  legalDisclaimer: string | null;
  modelNotes: string | null;
};

export type ReleaseDetailPayoutSummaryDto = {
  payouts30d: string;
  payoutsAllTime: string;
  nextPayoutDate: string | null;
  lastPayoutDate: string | null;
  averagePayoutPerUnit: string | null;
  payoutCurrency: string;
};

export type ReleaseDetailSecondarySummaryDto = {
  activeListings: number;
  trades7d: number;
  averageSpread: string | null;
  medianFillTime: string | null;
  averageUnitPrice: string | null;
  liquidityLabel: string;
  secondaryVolume24h: string;
  secondaryVolume30d: string;
  bestBid: string | null;
  bestAsk: string | null;
  lastTradePrice: string | null;
  priceChange7d: string;
  priceChange30d: string | null;
  secondaryAvailable: boolean;
};

export type ReleaseDetailUserBlockDto = {
  userUnits: string | null;
  userAvailableUnits: string | null;
  userLockedUnits: string | null;
  userAvgEntryPrice: string | null;
  userCurrentValue: string | null;
  userPnl: string | null;
  userPayoutsReceived: string | null;
  canSell: boolean;
  canBuyMore: boolean;
  complianceRestrictions: string[];
};

export type ReleaseDetailPulseDto = {
  grossYieldReference: string | null;
  grossYieldLabel: string;
  roundStatusLabel: string;
  payoutWindowAmount: string;
  payoutWindowPeriod: string;
  unitsInCirculation: string;
  availablePrimaryUnits: string;
  secondaryVolume30d: string;
  minEntryAmount: string | null;
  walletCtaAvailable: boolean;
  walletCtaHref: string;
  lastUpdatedAt: string;
};

export type ReleaseDetailFullDto = {
  identity: {
    id: string;
    slug: string;
    symbol: string;
    title: string;
    artistName: string;
    artistId: string | null;
    genre: string | null;
    status: string;
    publicStatus: string | null;
    roundStatus: string;
    lifecycleStatus?: string;
    coverUrl: string | null;
    videoUrl: string | null;
    videoType: string;
    videoStatus: string;
    videoPosterUrl: string | null;
    shortDescription: string | null;
    fullDescription: string | null;
    releaseDate: string | null;
    createdAt: string;
    updatedAt: string;
  };
  pulse: ReleaseDetailPulseDto;
  primaryRound: ReleaseDetailPrimaryRoundDto;
  dealTerms: ReleaseDetailDealTermsDto;
  payoutSummary: ReleaseDetailPayoutSummaryDto;
  secondarySummary: ReleaseDetailSecondarySummaryDto;
  user: ReleaseDetailUserBlockDto | null;
  faq: ReleaseFaqItemDto[];
  documents: ReleaseDocumentSummaryDto[];
  payoutHistory: {
    period: string;
    gross: string;
    poolShare: string;
    distribution: string;
    perUnit: string;
    toHolders: string;
    status?: string;
    paidAt?: string | null;
  }[];
  expectedYieldPct: string | null;
  riskLabel: string;
  holding: import('./user-analytics-api.types').UserAnalyticsHoldingDto | null;
};

export type ReleaseMyHistoryDto = {
  orders: {
    id: string;
    side: string;
    status: string;
    units: string;
    price: string | null;
    createdAt: string;
  }[];
  trades: {
    id: string;
    side: string;
    units: string;
    price: string;
    executedAt: string;
  }[];
  payouts: {
    id: string;
    amountNet: string;
    status: string;
    createdAt: string;
  }[];
  ledger: import('./user-analytics-api.types').UserAnalyticsLedgerEntryDto[];
};
