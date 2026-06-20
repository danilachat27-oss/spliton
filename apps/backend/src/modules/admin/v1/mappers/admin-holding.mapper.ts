import { Prisma, ReleaseStatus } from '@prisma/client';
import { releaseStatusToApi } from './admin-track.mapper';

export type HoldingLockReason =
  | 'active_listing'
  | 'pending_trade'
  | 'compliance_freeze'
  | 'settlement'
  | 'unknown'
  | null;

export type AdminHoldingListItemDto = {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string | null;
  userStatus: string;
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  trackCoverUrl: string | null;
  trackStatus: string;
  totalUnits: string;
  availableUnits: string;
  lockedUnits: string;
  lockReason: HoldingLockReason;
  averagePriceUsdt: string;
  currentValueUsdt: string;
  earnedTotalUsdt: string;
  ownershipPct: string;
  activeListingsCount: number;
  hasRiskFlag: boolean;
  riskSeverity: string | null;
  lastActivityAt: string;
};

export type AdminHoldingSummaryDto = {
  totalHolders: number;
  totalUnits: string;
  availableUnits: string;
  lockedUnits: string;
  totalCurrentValueUsdt: string;
  totalEarnedUsdt: string;
  activeListingsCount: number;
  holdingsWithRiskFlags: number;
};

export type AdminHoldingHistoryItemDto = {
  id: string;
  happenedAt: string;
  eventType: string;
  unitsDelta: string;
  pricePerUnit: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  status: string;
};

export type AdminHoldingDistributionItemDto = {
  id: string;
  distributionId: string;
  amountNet: string;
  amountGross: string;
  status: string;
  walletTxId: string | null;
  createdAt: string;
};

export type AdminHoldingMarketItemDto = {
  id: string;
  kind: 'listing' | 'trade';
  side: string | null;
  pricePerUnit: string;
  units: string;
  feeUsdt: string | null;
  counterpartyEmail: string | null;
  status: string;
  happenedAt: string;
};

export type AdminHoldingWalletItemDto = {
  id: string;
  txType: string;
  direction: string;
  amount: string;
  netAmount: string;
  status: string;
  happenedAt: string;
  referenceType: string | null;
  referenceId: string | null;
};

export type AdminHoldingRiskItemDto = {
  id: string;
  flagCode: string;
  severity: string;
  status: string;
  note: string | null;
  createdAt: string;
};

export type AdminHoldingDetailDto = AdminHoldingListItemDto & {
  history?: AdminHoldingHistoryItemDto[];
  distributions?: AdminHoldingDistributionItemDto[];
  market?: AdminHoldingMarketItemDto[];
  wallet?: AdminHoldingWalletItemDto[];
  risk?: AdminHoldingRiskItemDto[];
};

type PositionRow = Prisma.UserPositionGetPayload<{
  include: {
    user: { include: { profile: true } };
    release: {
      include: {
        releaseArtists: { include: { artist: true }; take: 1 };
      };
    };
  };
}>;

function dec(v: Prisma.Decimal): string {
  return Number(v.toString()).toFixed(2).replace(/\.00$/, '');
}

function units(v: Prisma.Decimal): string {
  return Number(v.toString()).toFixed(0);
}

function mapReleaseStatus(status: ReleaseStatus): string {
  return releaseStatusToApi(status);
}

export function mapOwnershipEventType(type: string): string {
  const map: Record<string, string> = {
    PRIMARY_BUY: 'primary_purchase',
    SECONDARY_BUY: 'secondary_purchase',
    SECONDARY_SELL: 'secondary_sale',
    LOCK_FOR_SELL: 'listing_lock',
    UNLOCK_AFTER_CANCEL: 'listing_unlock',
    PAYOUT_SNAPSHOT: 'payout_snapshot',
    ADMIN_ADJUSTMENT: 'manual_adjustment',
  };
  return map[type] ?? type.toLowerCase();
}

export function inferLockReason(params: {
  lockedUnits: number;
  hasActiveListing: boolean;
  hasPendingTrade: boolean;
  hasComplianceRisk: boolean;
}): HoldingLockReason {
  if (params.lockedUnits <= 0) return null;
  if (params.hasActiveListing) return 'active_listing';
  if (params.hasPendingTrade) return 'settlement';
  if (params.hasComplianceRisk) return 'compliance_freeze';
  return 'unknown';
}

export function mapHoldingRow(
  row: PositionRow,
  ctx: {
    earned: Prisma.Decimal;
    activeListingsCount: number;
    hasRiskFlag: boolean;
    riskSeverity: string | null;
    lockReason: HoldingLockReason;
  },
): AdminHoldingListItemDto {
  const releaseTotal = Number(row.release.totalUnits.toString());
  const userTotal = Number(row.unitsTotal.toString());
  const ownershipPct =
    releaseTotal > 0 ? Math.min(100, (userTotal / releaseTotal) * 100) : 0;
  const currentValue = row.unitsTotal.mul(row.avgEntryPrice);

  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.user.email,
    userDisplayName: row.user.profile?.displayName ?? null,
    userStatus: row.user.status.toLowerCase(),
    trackId: row.releaseId,
    trackTitle: row.release.title,
    trackArtist: row.release.releaseArtists[0]?.artist.name ?? '—',
    trackCoverUrl: row.release.coverUrl,
    trackStatus: mapReleaseStatus(row.release.status),
    totalUnits: units(row.unitsTotal),
    availableUnits: units(row.unitsAvailable),
    lockedUnits: units(row.unitsLocked),
    lockReason: ctx.lockReason,
    averagePriceUsdt: dec(row.avgEntryPrice),
    currentValueUsdt: dec(currentValue),
    earnedTotalUsdt: dec(ctx.earned),
    ownershipPct: ownershipPct.toFixed(2),
    activeListingsCount: ctx.activeListingsCount,
    hasRiskFlag: ctx.hasRiskFlag,
    riskSeverity: ctx.riskSeverity,
    lastActivityAt: row.updatedAt.toISOString(),
  };
}
