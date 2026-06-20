export type PortfolioPositionStatus =
  | 'Active'
  | 'Open round'
  | 'Secondary'
  | 'Closed';

export type PortfolioPositionDto = {
  id: string;
  releaseId: string;
  slug: string;
  symbol: string;
  release: string;
  artist: string;
  coverUrl: string | null;
  genre: string;
  unitsTotal: string;
  unitsAvailable: string;
  unitsLocked: string;
  listedUnits: string;
  avgEntryPrice: string;
  currentPrice: string;
  priceSource: 'best_ask' | 'last_trade' | 'primary';
  hasMarketPrice: boolean;
  lastTradePriceUsdt: string | null;
  marketValue: string;
  costBasis: string;
  totalInvestedUsdt: string;
  pnlUnrealized: string;
  pnlPct: string;
  status: PortfolioPositionStatus;
  availableToSell: boolean;
  canBuyMore: boolean;
  dateEntered: string;
  updatedAt: string;
  portfolioSharePct: string;
  liquidityPercent: string;
  totalAccruedUsdt: string;
  totalPaidUsdt: string;
  pendingPayoutUsdt: string;
  activeListingsCount: number;
};

export type PortfolioStructureItemDto = {
  label: string;
  value: string;
  percent: number;
};

export type PortfolioOverviewDto = {
  totalValue: string;
  totalUnits: string;
  activeReleases: number;
  positionCount: number;
  expectedPayouts: string;
  realizedIncome: string;
  unrealizedPnl: string;
  change30dPct: string | null;
  topPositions: PortfolioPositionDto[];
  riskSummary: {
    lockedUnits: string;
    lockedValue: string;
    liquidityLabel: string;
    openRoundCount: number;
  };
  stats: { label: string; value: string }[];
  genreStructure: PortfolioStructureItemDto[];
  statusStructure: PortfolioStructureItemDto[];
  updatedAt: string;
};

export type PortfolioMetricsOverviewDto = {
  portfolioValueUsdt: string;
  totalUnits: string;
  activePositions: number;
  activeReleases: number;
  totalAccruedUsdt: string;
  totalPaidUsdt: string;
  pendingPayoutUsdt: string;
  unrealizedPnlUsdt: string;
  change30dPct: string | null;
  averagePositionSizeUsdt: string | null;
};

export type PortfolioMetricsDto = {
  overview: PortfolioMetricsOverviewDto;
  topStats: { label: string; value: string; hint: string }[];
  genreAllocation: PortfolioStructureItemDto[];
  statusAllocation: PortfolioStructureItemDto[];
  incomeByPeriod: { period: string; amount: string }[];
  valueHistory: { ts: string; value: string }[];
  performance: {
    pnl30dPct: string | null;
    portfolioValue: string;
    realizedIncome: string;
    unrealizedPnl: string;
    pendingPayouts: string;
    totalAccrued: string;
  };
  productPnl: { label: string; value: string }[];
  updatedAt: string;
};

export type PortfolioPositionsPageDto = {
  items: PortfolioPositionDto[];
  total: number;
  page: number;
  limit: number;
};

export type PortfolioActivityKind =
  | 'deposit'
  | 'purchase'
  | 'sale'
  | 'transfer'
  | 'withdrawal'
  | 'secondary'
  | 'payout'
  | 'fee';

export type PortfolioActivityStatus =
  | 'Completed'
  | 'Pending'
  | 'Processing'
  | 'Cancelled';

export type PortfolioActivityItemDto = {
  id: string;
  occurredAt: string;
  type: string;
  kind: PortfolioActivityKind;
  release: string;
  releaseId: string | null;
  units: string;
  amount: string;
  status: PortfolioActivityStatus;
  txId: string;
  details: string;
};

export type PortfolioActivityDto = {
  items: PortfolioActivityItemDto[];
  total: number;
};
