import {
  PayoutFrequency,
  PrimaryRaiseRoundStatus,
  Prisma,
  ReleaseStatus,
  type Release,
} from '@prisma/client';

/** Visible on `/catalog` and buy flow (not market overview). */
export const CATALOG_PUBLIC_STATUSES: ReleaseStatus[] = [
  ReleaseStatus.ACTIVE,
  ReleaseStatus.SOLD_OUT,
];

export type CatalogPurchaseState =
  | 'available'
  | 'sold_out'
  | 'paused'
  | 'unavailable';

export function isCatalogPublicStatus(status: ReleaseStatus): boolean {
  return CATALOG_PUBLIC_STATUSES.includes(status);
}

export function artistDisplayName(
  release: Release & {
    releaseArtists?: { artist: { name: string } }[];
  },
): string {
  const fromJoin = release.releaseArtists?.[0]?.artist.name?.trim();
  if (fromJoin) return fromJoin;
  const owner = release.copyrightOwner?.trim();
  if (owner) return owner;
  return release.symbol;
}

export function mapPayoutFreq(freq: PayoutFrequency): 'monthly' | 'biweekly' {
  return freq === PayoutFrequency.WEEKLY ? 'biweekly' : 'monthly';
}

export function mapRiskLabel(input: {
  purchaseState: CatalogPurchaseState;
  liquidityScore?: Prisma.Decimal | null;
  hasLiveRound: boolean;
}): string {
  if (input.purchaseState === 'sold_out') return 'Раунд закрыт';
  if (input.purchaseState === 'paused') return 'Пауза';
  if (input.purchaseState === 'unavailable') return 'Недоступно';
  if (!input.hasLiveRound) return 'Нет активного раунда';
  const score = input.liquidityScore ? Number(input.liquidityScore) : null;
  if (score !== null && score < 0.35) return 'Низкая ликвидность';
  return 'Стандартный';
}

export function resolvePurchaseState(input: {
  releaseStatus: ReleaseStatus;
  roundStatus: PrimaryRaiseRoundStatus | null;
  availableUnits: Prisma.Decimal;
}): CatalogPurchaseState {
  if (input.releaseStatus === ReleaseStatus.SOLD_OUT) return 'sold_out';
  if (input.releaseStatus !== ReleaseStatus.ACTIVE) return 'unavailable';
  if (!input.roundStatus) return 'unavailable';
  if (input.roundStatus === PrimaryRaiseRoundStatus.PAUSED) return 'paused';
  if (input.roundStatus === PrimaryRaiseRoundStatus.LIVE) {
    return input.availableUnits.greaterThan(0) ? 'available' : 'sold_out';
  }
  if (input.roundStatus === PrimaryRaiseRoundStatus.COMPLETED)
    return 'sold_out';
  return 'unavailable';
}

export function roundStatusToApi(
  status: PrimaryRaiseRoundStatus | null,
): 'live' | 'paused' | 'completed' | 'draft' | 'none' {
  if (!status) return 'none';
  if (status === PrimaryRaiseRoundStatus.LIVE) return 'live';
  if (status === PrimaryRaiseRoundStatus.PAUSED) return 'paused';
  if (status === PrimaryRaiseRoundStatus.COMPLETED) return 'completed';
  return 'draft';
}

export function shortDescription(
  description: string | null | undefined,
  max = 160,
): string | null {
  if (!description?.trim()) return null;
  const t = description.trim().replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
