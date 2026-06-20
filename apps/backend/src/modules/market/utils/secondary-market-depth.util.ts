import { Prisma } from '@prisma/client';

export type RawBookLevel = {
  price: string;
  units: string;
  listingId?: string;
};

export type AggregatedDepthLevel = {
  price: string;
  units: string;
  cumulativeUnits: string;
  cumulativeValueUsdt: string;
  depthPercent: string;
  orderCount: number;
  listingId?: string;
};

const TICK_SIZES = [0.01, 0.05, 0.1] as const;

export function normalizeTickSize(raw?: number): number {
  if (raw == null || !Number.isFinite(raw)) return 0.01;
  const allowed = TICK_SIZES as readonly number[];
  return allowed.includes(raw) ? raw : 0.01;
}

function roundToTick(price: Prisma.Decimal, tick: number): Prisma.Decimal {
  const tickD = new Prisma.Decimal(tick);
  const k = price.div(tickD).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  return k.mul(tickD);
}

export function aggregateDepthLevels(
  levels: RawBookLevel[],
  tickSize: number,
  side: 'ask' | 'bid',
): AggregatedDepthLevel[] {
  const tick = normalizeTickSize(tickSize);
  const map = new Map<string, { units: Prisma.Decimal; orderCount: number; listingId?: string }>();

  for (const level of levels) {
    const price = roundToTick(new Prisma.Decimal(level.price), tick);
    const units = new Prisma.Decimal(level.units);
    const key = price.toString();
    const prev = map.get(key);
    map.set(key, {
      units: (prev?.units ?? new Prisma.Decimal(0)).plus(units),
      orderCount: (prev?.orderCount ?? 0) + 1,
      listingId: prev?.listingId ?? level.listingId,
    });
  }

  const sorted = [...map.entries()].map(([price, agg]) => ({
    price: new Prisma.Decimal(price),
    units: agg.units,
    orderCount: agg.orderCount,
    listingId: agg.listingId,
  }));

  sorted.sort((a, b) =>
    side === 'ask'
      ? a.price.comparedTo(b.price)
      : b.price.comparedTo(a.price),
  );

  const totalUnits = sorted.reduce(
    (sum, row) => sum.plus(row.units),
    new Prisma.Decimal(0),
  );

  let cumUnits = new Prisma.Decimal(0);
  return sorted.map((row) => {
    cumUnits = cumUnits.plus(row.units);
    const cumValue = cumUnits.mul(row.price);
    const depthPercent = totalUnits.greaterThan(0)
      ? cumUnits.div(totalUnits).mul(100)
      : new Prisma.Decimal(0);
    return {
      price: row.price.toString(),
      units: row.units.toString(),
      cumulativeUnits: cumUnits.toString(),
      cumulativeValueUsdt: cumValue.toFixed(2),
      depthPercent: depthPercent.toFixed(2),
      orderCount: row.orderCount,
      ...(row.listingId ? { listingId: row.listingId } : {}),
    };
  });
}
