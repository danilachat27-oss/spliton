/** Pure pricing math shared by primary buy, secondary trade, and demo calculators. */

export function roundUsdt2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Parses a per-unit price; returns null when missing, non-finite, or non-positive. */
export function parseUnitPrice(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return roundUsdt2(n);
}

export function validateUnitPrice(price: number): boolean {
  return Number.isFinite(price) && price > 0;
}

export function parsePositiveInt(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

export function effectiveMinUnits(minPurchaseUnits?: number | null, fallback = 1): number {
  const min = minPurchaseUnits != null ? parsePositiveInt(minPurchaseUnits) : null;
  if (min != null && min > 0) return min;
  return Math.max(1, fallback);
}

export function effectiveMaxUnits(availableUnits: number, maxPurchaseUnits?: number | null): number {
  const available = Math.max(0, Math.floor(availableUnits));
  if (available <= 0) return 0;
  const cap = maxPurchaseUnits != null ? parsePositiveInt(maxPurchaseUnits) : null;
  if (cap != null && cap > 0) return Math.min(available, cap);
  return available;
}

export function clampUnits(qty: number, minUnits: number, maxUnits: number): number {
  if (!Number.isFinite(qty) || maxUnits <= 0) return 0;
  const min = Math.max(0, Math.floor(minUnits));
  const max = Math.max(0, Math.floor(maxUnits));
  if (max < min) return 0;
  return Math.min(max, Math.max(min, Math.floor(qty)));
}

/**
 * Whole units purchasable for `amount` at `unitPrice` (floor, no overpay tail).
 * Returns 0 when price invalid, amount insufficient, or maxUnits is 0.
 */
export function unitsFromAmount(
  unitPrice: number,
  amount: number,
  maxUnits: number,
  minUnits = 1,
): number {
  if (!validateUnitPrice(unitPrice) || !Number.isFinite(amount) || amount < 0) return 0;
  if (maxUnits <= 0) return 0;
  if (amount < unitPrice) return 0;
  const q = Math.floor((amount + 1e-9) / unitPrice);
  if (q < minUnits) return 0;
  return Math.min(maxUnits, q);
}

/** @deprecated Use unitsFromAmount — kept for existing imports. */
export function unitsFromUsdtBudget(
  unitPriceUsdt: number,
  usdt: number,
  maxUnits: number,
  minUnits = 1,
): number {
  return unitsFromAmount(unitPriceUsdt, usdt, maxUnits, minUnits);
}

export function amountFromUnits(unitPrice: number, units: number): number {
  if (!validateUnitPrice(unitPrice) || !Number.isFinite(units) || units <= 0) return 0;
  return roundUsdt2(unitPrice * units);
}

export type PrimaryPurchaseQuote = {
  grossAmount: number;
  feeAmount: number;
  totalPaid: number;
};

export function computePrimaryPurchase(params: {
  unitPrice: number;
  units: number;
  feePct: number;
}): PrimaryPurchaseQuote | null {
  const { unitPrice, units, feePct } = params;
  if (!validateUnitPrice(unitPrice) || !Number.isFinite(units) || units <= 0) return null;
  const grossAmount = amountFromUnits(unitPrice, units);
  const feeAmount = roundUsdt2((grossAmount * feePct) / 100);
  return { grossAmount, feeAmount, totalPaid: grossAmount };
}

export type SecondaryTradeQuote = {
  grossAmount: number;
  feeAmount: number;
  buyerTotal: number;
  sellerNet: number;
};

/** Backend contract: buyer pays gross; fee retained inside gross for buyer side. */
export function computeSecondaryTrade(params: {
  unitPrice: number;
  units: number;
  feePct: number;
}): SecondaryTradeQuote | null {
  const { unitPrice, units, feePct } = params;
  if (!validateUnitPrice(unitPrice) || !Number.isFinite(units) || units <= 0) return null;
  const grossAmount = amountFromUnits(unitPrice, units);
  const feeAmount = roundUsdt2((grossAmount * feePct) / 100);
  return {
    grossAmount,
    feeAmount,
    buyerTotal: grossAmount,
    sellerNet: roundUsdt2(Math.max(0, grossAmount - feeAmount)),
  };
}

/** Safe ownership share; null when totalUnits missing or invalid. */
export function computeOwnershipPercent(units: number, totalUnits: number | null | undefined): number | null {
  if (totalUnits == null || !Number.isFinite(totalUnits) || totalUnits <= 0) return null;
  if (!Number.isFinite(units) || units <= 0) return null;
  const pct = (units / totalUnits) * 100;
  if (!Number.isFinite(pct)) return null;
  return Math.round(pct * 100) / 100;
}

export type EducationalPrimaryBuyQuote = PrimaryPurchaseQuote & {
  units: number;
  pricePerUnit: number;
};

/**
 * Standalone/educational primary buy — same money-flow as catalog checkout:
 * totalPaid = gross = units × unitPrice; fee is informational (withheld from gross).
 */
export function computeEducationalPrimaryBuy(input: {
  mode: "usdt" | "units";
  budgetUsdt?: number;
  unitsInput?: number;
  unitPrice: number;
  feePct: number;
  maxUnits?: number;
}): EducationalPrimaryBuyQuote | null {
  const { unitPrice, feePct, mode } = input;
  if (!validateUnitPrice(unitPrice)) return null;
  const maxUnits = input.maxUnits ?? Number.MAX_SAFE_INTEGER;

  if (mode === "usdt") {
    const budget = input.budgetUsdt;
    if (budget == null || !Number.isFinite(budget) || budget <= 0) return null;
    const units = unitsFromAmount(unitPrice, budget, maxUnits, 1);
    if (units <= 0) return null;
    const quote = computePrimaryPurchase({ unitPrice, units, feePct });
    if (!quote) return null;
    return { ...quote, units, pricePerUnit: unitPrice };
  }

  const rawUnits = input.unitsInput;
  if (rawUnits == null || !Number.isFinite(rawUnits) || rawUnits <= 0) return null;
  const units = Math.floor(rawUnits);
  const quote = computePrimaryPurchase({ unitPrice, units, feePct });
  if (!quote) return null;
  return { ...quote, units, pricePerUnit: unitPrice };
}
