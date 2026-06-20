import { Prisma, ReleaseStatus } from '@prisma/client';

export type ReleaseLifecycleStatus =
  | 'draft'
  | 'active_primary'
  | 'sold_out'
  | 'closed'
  | 'paused'
  | 'coming_soon';

export function resolveReleaseLifecycleStatus(
  status: ReleaseStatus,
  unitsAvailablePrimary: Prisma.Decimal,
  totalUnits: Prisma.Decimal,
  soldUnits: Prisma.Decimal,
  publicStatus?: string | null,
): ReleaseLifecycleStatus {
  const pub = (publicStatus ?? '').toLowerCase();
  if (pub.includes('coming') || pub.includes('soon') || pub.includes('скоро')) {
    return 'coming_soon';
  }
  if (status === ReleaseStatus.DRAFT || status === ReleaseStatus.REVIEW) {
    return 'draft';
  }
  if (status === ReleaseStatus.PAUSED) {
    return 'paused';
  }
  if (status === ReleaseStatus.ARCHIVED) {
    return 'closed';
  }
  if (status === ReleaseStatus.SOLD_OUT) {
    return 'sold_out';
  }
  const soldOutByUnits =
    unitsAvailablePrimary.lte(0) &&
    soldUnits.gt(0) &&
    (totalUnits.lte(0) || soldUnits.gte(totalUnits));
  if (soldOutByUnits) {
    return 'sold_out';
  }
  if (status === ReleaseStatus.ACTIVE && unitsAvailablePrimary.gt(0)) {
    return 'active_primary';
  }
  if (status === ReleaseStatus.ACTIVE && unitsAvailablePrimary.lte(0)) {
    return soldUnits.gt(0) ? 'sold_out' : 'closed';
  }
  return 'closed';
}

export function computeFillProgressDisplay(
  lifecycle: ReleaseLifecycleStatus,
  fillProgressFromRaise: Prisma.Decimal | null,
  soldUnits: Prisma.Decimal,
  totalUnits: Prisma.Decimal,
): string | null {
  if (lifecycle === 'sold_out') {
    if (totalUnits.gt(0) && soldUnits.gte(totalUnits)) {
      return '100%';
    }
    return null;
  }
  if (fillProgressFromRaise == null || fillProgressFromRaise.lte(0)) {
    return null;
  }
  return `${Number(fillProgressFromRaise).toFixed(1)}%`;
}
