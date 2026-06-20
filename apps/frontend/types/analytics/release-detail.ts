import type { ReleaseAnalyticsRow } from "@/types/analytics/releases";
import type { ReleaseDetailFullApi, ReleaseMyHistoryApi } from "@/types/analytics/release-detail-api";
import type { ReleaseDetailPageState } from "@/lib/analytics/release-detail-state";

export type ReleaseDetailChartPeriod = "7d" | "30d" | "90d" | "ytd" | "all";

export type ReleaseDetailSummaryRowKind =
  | "round-status"
  | "gross"
  | "position"
  | "payouts"
  | "units"
  | "available"
  | "secondary"
  | "my-position"
  | "min-entry"
  | "action";

export type ReleaseDetailSummaryRow = {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  /** Ряд для мини-графика справа (реальные данные, не placeholder). */
  sparkline?: number[];
  kind?: ReleaseDetailSummaryRowKind;
};

export type ReleaseDetailQuickStat = {
  label: string;
  value: string;
  sub?: string;
  /** Короткая справка при наведении на «i». */
  info?: string;
};

export type ReleaseDetailPayoutRow = {
  period: string;
  gross: string;
  poolShare: string;
  distribution: string;
  perUnit: string;
  toHolders: string;
};

/** Видео-обложка в hero. */
export type ReleaseDetailCover = {
  videoSrc?: string;
  videoType?: "MP4" | "HLS" | "NONE";
  videoStatus?: "NONE" | "PROCESSING" | "READY" | "FAILED";
  posterSrc?: string;
  caption?: string;
};

export type ReleaseDetailMechanicsRow = { label: string; value: string };

export type ReleaseDetailMechanicsBlock = {
  heading: string;
  rows?: ReleaseDetailMechanicsRow[];
  /** Legacy mock / fallback prose. */
  body?: string;
};

export type ReleaseDetailPageData = {
  row: ReleaseAnalyticsRow;
  /** Slug for secondary market deep links (live). */
  slug?: string;
  breadcrumbs: { label: string; href?: string }[];
  heroBlurb: string;
  cover?: ReleaseDetailCover;
  summaryPanel: ReleaseDetailSummaryRow[];
  performance: {
    title: string;
    subtitle: string;
    seriesByPeriod: Record<ReleaseDetailChartPeriod, number[]>;
    miniStats: { label: string; value: string }[];
  };
  quickStats: ReleaseDetailQuickStat[];
  about: { title: string; paragraphs: string[] };
  howItWorks: { title: string; description?: string; blocks: ReleaseDetailMechanicsBlock[] };
  terms: { title: string; rows: { key: string; val: string; note?: string }[] };
  payoutHistory: ReleaseDetailPayoutRow[];
  secondary: { title: string; rows: { label: string; value: string }[]; marketHref?: string };
  faq: { q: string; a: string }[];
  related: { title: string; description: string; href: string }[];
  pageState: ReleaseDetailPageState;
  /** Localized lifecycle badge label (resolved at adapter time). */
  lifecycleLabel: string;
  /** Live-only context for my-history / secondary views. */
  liveContext?: {
    secondarySummary: ReleaseDetailFullApiSecondarySummary;
    user: ReleaseDetailFullApi["user"];
    walletCtaHref: string;
    walletCtaAvailable: boolean;
    canBuyPrimary: boolean;
    primaryBlockingReason: string | null;
  };
  myHistory?: ReleaseMyHistoryApi;
};

export type ReleaseDetailFullApiSecondarySummary = {
  activeListings: number;
  trades7d: number;
  averageSpread: string | null;
  bestBid: string | null;
  bestAsk: string | null;
  lastTradePrice: string | null;
  liquidityLabel: string;
  secondaryVolume24h: string;
  secondaryAvailable: boolean;
};
