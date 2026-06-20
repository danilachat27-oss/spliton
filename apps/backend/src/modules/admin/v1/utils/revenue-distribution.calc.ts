import { Prisma } from '@prisma/client';

export type RevenueShareSplit = {
  holderPct: Prisma.Decimal;
  platformPct: Prisma.Decimal;
  artistPct: Prisma.Decimal;
};

export type HolderAllocation = {
  userId: string;
  units: Prisma.Decimal;
  percentage: Prisma.Decimal;
  payoutAmount: Prisma.Decimal;
};

export type DistributionCalculation = {
  grossRevenue: Prisma.Decimal;
  holdersPool: Prisma.Decimal;
  platformAmount: Prisma.Decimal;
  artistAmount: Prisma.Decimal;
  totalUnits: Prisma.Decimal;
  holders: HolderAllocation[];
  holdersTotalAllocated: Prisma.Decimal;
  roundingDelta: Prisma.Decimal;
  reconciled: boolean;
};

const DEFAULT_SPLIT: RevenueShareSplit = {
  holderPct: new Prisma.Decimal('0.70'),
  platformPct: new Prisma.Decimal('0.15'),
  artistPct: new Prisma.Decimal('0.15'),
};

export function resolveRevenueShares(release: {
  holderSharePct: Prisma.Decimal | null;
  platformSharePct: Prisma.Decimal | null;
  artistSharePct: Prisma.Decimal | null;
}): RevenueShareSplit {
  const h = release.holderSharePct;
  const p = release.platformSharePct;
  const a = release.artistSharePct;
  if (h && p && a) {
    const sum = h.plus(p).plus(a);
    if (sum.greaterThan(0)) {
      return {
        holderPct: h.div(100),
        platformPct: p.div(100),
        artistPct: a.div(100),
      };
    }
  }
  return DEFAULT_SPLIT;
}

export function calculateDistribution(input: {
  grossRevenue: Prisma.Decimal;
  shares: RevenueShareSplit;
  positions: Array<{ userId: string; unitsTotal: Prisma.Decimal }>;
}): DistributionCalculation {
  const gross = input.grossRevenue;
  const holdersPool = gross.mul(input.shares.holderPct);
  const platformAmount = gross.mul(input.shares.platformPct);
  const artistAmount = gross.mul(input.shares.artistPct);

  const totalUnits = input.positions.reduce(
    (sum, p) => sum.plus(p.unitsTotal),
    new Prisma.Decimal(0),
  );

  if (totalUnits.lessThanOrEqualTo(0)) {
    return {
      grossRevenue: gross,
      holdersPool,
      platformAmount,
      artistAmount,
      totalUnits,
      holders: [],
      holdersTotalAllocated: new Prisma.Decimal(0),
      roundingDelta: holdersPool,
      reconciled: holdersPool
        .plus(platformAmount)
        .plus(artistAmount)
        .equals(gross),
    };
  }

  const sorted = [...input.positions].sort((a, b) =>
    a.userId.localeCompare(b.userId),
  );

  const holders: HolderAllocation[] = [];
  let allocated = new Prisma.Decimal(0);

  for (let i = 0; i < sorted.length; i++) {
    const pos = sorted[i];
    const isLast = i === sorted.length - 1;
    const pct = pos.unitsTotal.div(totalUnits).mul(100);
    const payout = isLast
      ? holdersPool.minus(allocated)
      : holdersPool
          .mul(pos.unitsTotal)
          .div(totalUnits)
          .toDecimalPlaces(8, Prisma.Decimal.ROUND_DOWN);
    allocated = allocated.plus(payout);
    holders.push({
      userId: pos.userId,
      units: pos.unitsTotal,
      percentage: pct,
      payoutAmount: payout,
    });
  }

  const roundingDelta = holdersPool.minus(allocated);
  const partsSum = holdersPool.plus(platformAmount).plus(artistAmount);

  return {
    grossRevenue: gross,
    holdersPool,
    platformAmount,
    artistAmount,
    totalUnits,
    holders,
    holdersTotalAllocated: allocated,
    roundingDelta,
    reconciled:
      partsSum.equals(gross) &&
      roundingDelta.abs().lessThanOrEqualTo('0.00000001'),
  };
}
