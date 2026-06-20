import { Prisma } from '@prisma/client';

export function d(
  value: Prisma.Decimal | string | number | null | undefined,
): Prisma.Decimal {
  if (value == null) return new Prisma.Decimal(0);
  if (value instanceof Prisma.Decimal) return value;
  return new Prisma.Decimal(value);
}

export function decToString(value: Prisma.Decimal, places = 8): string {
  return value.toDecimalPlaces(places, Prisma.Decimal.ROUND_HALF_UP).toString();
}

export function decToMoney(value: Prisma.Decimal): string {
  const n = Number(value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP));
  if (!Number.isFinite(n)) return '0';
  return n.toFixed(2);
}
