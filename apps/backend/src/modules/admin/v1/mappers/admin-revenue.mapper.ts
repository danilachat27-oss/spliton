import {
  EarningPeriodStatus,
  PayoutStatus,
  WalletTxStatus,
} from '@prisma/client';

export const HOLDERS_SHARE_PCT = 0.7;
export const PLATFORM_SHARE_PCT = 0.15;
export const ARTIST_SHARE_PCT = 0.15;

export type AdminRevenueSummaryDto = {
  totalGrossRevenueUsdt: string;
  distributedToHoldersUsdt: string;
  platformShareUsdt: string;
  artistShareUsdt: string;
  pendingCount: number;
  processingCount: number;
  failedCount: number;
  avgPayoutPerHolderUsdt: string | null;
  activeEventsCount: number;
};

export type AdminRevenueListItemDto = {
  id: string;
  trackId: string;
  trackTitle: string;
  artistName: string | null;
  coverUrl: string | null;
  releaseStatus: string;
  periodFrom: string;
  periodTo: string;
  source: string;
  grossRevenueUsdt: string;
  holdersShareUsdt: string;
  artistShareUsdt: string;
  platformShareUsdt: string;
  distributedAmountUsdt: string;
  holdersCount: number;
  status: string;
  distributionId: string | null;
  errorMessage: string | null;
  createdBy: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type AdminRevenuePreviewHolderDto = {
  userId: string;
  userEmail: string;
  units: string;
  percentage: string;
  payoutAmount: string;
  walletId: string | null;
  availableBalance: string;
};

export type AdminRevenuePreviewDto = {
  revenueEventId: string;
  trackTitle: string;
  grossRevenue: string;
  platformAmount: string;
  artistAmount: string;
  holdersAmount: string;
  holderSharePct: string;
  platformSharePct: string;
  artistSharePct: string;
  totalUnits: string;
  participatingUnits: string;
  holdersCount: number;
  holdersTotalAllocated: string;
  roundingDelta: string;
  reconciliationOk: boolean;
  holders: AdminRevenuePreviewHolderDto[];
};

export type AdminRevenuePayoutItemDto = {
  id: string;
  userId: string;
  userEmail: string;
  units: string;
  percentage: string;
  amountUsdt: string;
  walletTxId: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

export type AdminRevenueLedgerItemDto = {
  id: string;
  operationType: string;
  amountUsdt: string;
  status: string;
  userId: string | null;
  userEmail: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type AdminRevenueAuditItemDto = {
  id: string;
  action: string;
  actorEmail: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
};

export type AdminRevenueDetailDto = AdminRevenueListItemDto & {
  asset: string;
  note: string | null;
  preview?: AdminRevenuePreviewDto;
  payouts?: AdminRevenuePayoutItemDto[];
  ledger?: AdminRevenueLedgerItemDto[];
  audit?: AdminRevenueAuditItemDto[];
};

const STATUS_TO_API: Record<EarningPeriodStatus, string> = {
  OPEN: 'draft',
  CALCULATED: 'calculated',
  REVIEW: 'review',
  APPROVED: 'approved',
  DISTRIBUTED: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

const API_TO_STATUS: Record<string, EarningPeriodStatus> = {
  draft: EarningPeriodStatus.OPEN,
  calculated: EarningPeriodStatus.CALCULATED,
  preview: EarningPeriodStatus.CALCULATED,
  review: EarningPeriodStatus.REVIEW,
  approved: EarningPeriodStatus.APPROVED,
  paid: EarningPeriodStatus.DISTRIBUTED,
  pending: EarningPeriodStatus.OPEN,
  processing: EarningPeriodStatus.REVIEW,
  completed: EarningPeriodStatus.DISTRIBUTED,
  cancelled: EarningPeriodStatus.CANCELLED,
  failed: EarningPeriodStatus.FAILED,
  manual_review: EarningPeriodStatus.REVIEW,
};

type PeriodRow = {
  id: string;
  releaseId: string;
  periodStart: Date;
  periodEnd: Date;
  status: EarningPeriodStatus;
  createdAt: Date;
  release: {
    title: string;
    status: string;
    coverUrl: string | null;
    artists?: Array<{ artist: { name: string } }>;
  };
  reports: Array<{
    grossRevenue: { toString(): string };
    source: string;
    netRevenue?: { toString(): string };
  }>;
  distributions?: Array<{
    id: string;
    createdAt: Date;
    payouts?: Array<{ id: string }>;
  }>;
};

export function revenueStatusToApi(status: EarningPeriodStatus): string {
  return STATUS_TO_API[status] ?? 'draft';
}

export function apiRevenueStatusToDb(
  status: string,
): EarningPeriodStatus | undefined {
  return API_TO_STATUS[status];
}

export function splitAmounts(gross: number) {
  return {
    holders: gross * HOLDERS_SHARE_PCT,
    platform: gross * PLATFORM_SHARE_PCT,
    artist: gross * ARTIST_SHARE_PCT,
  };
}

export function mapRevenueListItem(
  row: PeriodRow,
  meta?: {
    holdersCount?: number;
    createdBy?: string | null;
    errorMessage?: string | null;
  },
): AdminRevenueListItemDto {
  const gross = Number(row.reports[0]?.grossRevenue.toString() ?? 0);
  const split = splitAmounts(gross);
  const distributed =
    row.status === EarningPeriodStatus.DISTRIBUTED ? split.holders : 0;
  const distribution = row.distributions?.[0];
  const artistName = row.release.artists?.[0]?.artist.name ?? null;

  return {
    id: row.id,
    trackId: row.releaseId,
    trackTitle: row.release.title,
    artistName,
    coverUrl: row.release.coverUrl,
    releaseStatus: row.release.status.toLowerCase(),
    periodFrom: row.periodStart.toISOString().slice(0, 10),
    periodTo: row.periodEnd.toISOString().slice(0, 10),
    source: row.reports[0]?.source ?? 'streaming',
    grossRevenueUsdt: gross.toFixed(2).replace(/\.00$/, ''),
    holdersShareUsdt: split.holders.toFixed(2).replace(/\.00$/, ''),
    artistShareUsdt: split.artist.toFixed(2).replace(/\.00$/, ''),
    platformShareUsdt: split.platform.toFixed(2).replace(/\.00$/, ''),
    distributedAmountUsdt: distributed.toFixed(2).replace(/\.00$/, ''),
    holdersCount: meta?.holdersCount ?? distribution?.payouts?.length ?? 0,
    status: revenueStatusToApi(row.status),
    distributionId: distribution?.id ?? null,
    errorMessage: meta?.errorMessage ?? null,
    createdBy: meta?.createdBy ?? null,
    createdAt: row.createdAt.toISOString(),
    completedAt:
      row.status === EarningPeriodStatus.DISTRIBUTED
        ? (distribution?.createdAt.toISOString() ?? null)
        : null,
  };
}

/** @deprecated Use revenueStatusToApi — kept for list filters expecting "completed". */
export function revenueStatusToApiLegacy(status: EarningPeriodStatus): string {
  if (status === EarningPeriodStatus.DISTRIBUTED) return 'completed';
  return revenueStatusToApi(status);
}

export function payoutStatusToApi(status: PayoutStatus): string {
  const map: Record<PayoutStatus, string> = {
    PENDING: 'pending',
    ACCRUED: 'processing',
    PAID: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  };
  return map[status] ?? status.toLowerCase();
}

export function walletTxStatusLabel(status: WalletTxStatus): string {
  return status.toLowerCase();
}
