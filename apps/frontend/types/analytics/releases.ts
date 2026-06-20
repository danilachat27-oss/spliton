export type ReleaseAnalyticsPeriod = "7d" | "30d" | "90d" | "all";

export type ReleaseRowStatus = "Active" | "Paused" | "Closed";

export type ReleaseRowTrend = "up" | "down" | "flat";

export type ReleaseRowGenre = "electronic" | "hiphop" | "pop";

export type ReleaseAnalyticsRow = {
  id: string;
  symbol: string;
  release: string;
  artist: string;
  genre: ReleaseRowGenre;
  yieldPct: string;
  changePct: string;
  payouts: string;
  units: string;
  soldUnits?: string;
  availableUnits?: string;
  pricePerUnitUsdt?: string;
  targetUsdt?: string;
  /**
   * Прогресс первичного раунда в процентах (0..100).
   * Может отсутствовать для некоторых релизов/выборок.
   */
  progressPercent?: number | null;
  status: ReleaseRowStatus;
  trend: ReleaseRowTrend;
  sparkline: number[];
  payoutBand: { lo: string; hi: string; t: number };

  /** Сумма привлечённых средств в USDT. */
  raisedUsdt?: number | null;
  /** Количество держателей. */
  holdersCount?: number | null;

  secondaryListingsCount?: number | null;
  secondaryVolumeUsdt?: string;
  liquidityPercent?: number | null;
  lastTradePrice?: string | null;
  updatedAt?: string;
};

export type ReleaseAnalyticsSortKey = "yield" | "payouts" | "units";

export type ReleaseAnalyticsChipPreset = "all" | "top" | "stable" | "growth";
